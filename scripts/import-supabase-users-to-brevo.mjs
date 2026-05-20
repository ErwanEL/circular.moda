#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';
const SUPABASE_PAGE_SIZE = 1000;

function printUsage() {
  console.log(`Import Supabase auth users into a Brevo list.

Usage:
  node scripts/import-supabase-users-to-brevo.mjs --list-id=4 [--dry-run]

Options:
  --list-id=<id>   Brevo list ID to import into (required)
  --list-id <id>   Alternative syntax for the same option
  --dry-run        Build and print the import plan without calling Brevo
  --help           Show this help text
`);
}

function parseArgs(argv) {
  const parsed = {
    dryRun: false,
    listId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg.startsWith('--list-id=')) {
      parsed.listId = Number.parseInt(arg.slice('--list-id='.length), 10);
      continue;
    }

    if (arg === '--list-id') {
      const nextArg = argv[index + 1];
      if (!nextArg) {
        throw new Error('Missing value after --list-id.');
      }
      parsed.listId = Number.parseInt(nextArg, 10);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(parsed.listId) || parsed.listId <= 0) {
    throw new Error('A valid positive integer is required for --list-id.');
  }

  return parsed;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required. Add it to .env.local or provide it in the shell environment.`
    );
  }
  return value;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '') {
    return null;
  }

  return EMAIL_PATTERN.test(normalized) ? normalized : null;
}

function normalizeName(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizePhoneForBrevo(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  if (/^\+54\d+$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits === '') {
    return null;
  }

  const localDigits = digits.startsWith('54') ? digits.slice(2) : digits;
  if (localDigits === '') {
    return null;
  }

  return `+54${localDigits}`;
}

async function listAllAuthUsers(supabase) {
  const allUsers = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: SUPABASE_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to list Supabase auth users: ${error.message}`);
    }

    const batch = data?.users ?? [];
    if (batch.length === 0) {
      break;
    }

    allUsers.push(...batch);

    if (batch.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

async function fetchProfiles(supabase) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, name, phone');

  if (error) {
    throw new Error(`Failed to fetch Supabase profiles: ${error.message}`);
  }

  return data ?? [];
}

function buildImportRows(authUsers, profiles) {
  const authUserIds = new Set(authUsers.map((user) => user.id));
  const profileByUserId = new Map();
  let orphanProfileRows = 0;

  for (const profile of profiles) {
    if (!profile.user_id || !authUserIds.has(profile.user_id)) {
      orphanProfileRows += 1;
      continue;
    }

    profileByUserId.set(profile.user_id, profile);
  }

  const rows = authUsers.map((user) => {
    const profile = profileByUserId.get(user.id);
    const email = normalizeEmail(user.email);
    const firstName = normalizeName(profile?.name);
    const sms = normalizePhoneForBrevo(profile?.phone);
    const attributes = {};

    if (firstName) {
      attributes.FIRSTNAME = firstName;
    }

    if (sms) {
      attributes.SMS = sms;
    }

    return {
      authUserId: user.id,
      email,
      hasProfile: Boolean(profile),
      payload: {
        email,
        listIds: [],
        updateEnabled: true,
        attributes,
      },
    };
  });

  return {
    rows,
    linkedProfiles: rows.filter((row) => row.hasProfile).length,
    orphanProfileRows,
  };
}

function summarize(rows, linkedProfiles, orphanProfileRows) {
  const validRows = rows.filter((row) => row.email);
  const skippedInvalidEmail = rows.length - validRows.length;
  const contactsWithFirstName = validRows.filter(
    (row) => typeof row.payload.attributes.FIRSTNAME === 'string'
  ).length;
  const contactsWithSms = validRows.filter(
    (row) => typeof row.payload.attributes.SMS === 'string'
  ).length;
  const emailOnlyImports = validRows.filter(
    (row) => Object.keys(row.payload.attributes).length === 0
  ).length;

  return {
    scannedUsers: rows.length,
    linkedProfiles,
    orphanProfileRows,
    validEmailUsers: validRows.length,
    skippedInvalidEmail,
    emailOnlyImports,
    contactsWithFirstName,
    contactsWithNormalizedSms: contactsWithSms,
  };
}

function formatAttributeSummary(attributes) {
  const labels = [];

  if (typeof attributes.FIRSTNAME === 'string') {
    labels.push('FIRSTNAME');
  }

  if (typeof attributes.SMS === 'string') {
    labels.push('SMS');
  }

  return labels.length > 0 ? labels.join(', ') : 'email-only';
}

async function upsertBrevoContact(apiKey, payload) {
  const response = await fetch(`${BREVO_API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function main() {
  const { dryRun, listId } = parseArgs(process.argv.slice(2));

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const brevoApiKey = requireEnv('BREVO_API_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(
    dryRun
      ? `Dry run for Brevo list ${listId}. No Brevo API calls will be made.`
      : `Importing Supabase users into Brevo list ${listId}.`
  );

  const authUsers = await listAllAuthUsers(supabase);
  const profiles = await fetchProfiles(supabase);
  const { rows, linkedProfiles, orphanProfileRows } = buildImportRows(
    authUsers,
    profiles
  );
  const summary = summarize(rows, linkedProfiles, orphanProfileRows);
  const importableRows = rows
    .filter((row) => row.email)
    .map((row) => ({
      ...row,
      payload: {
        ...row.payload,
        listIds: [listId],
      },
    }));

  console.log(
    `Fetched ${authUsers.length} auth users, ${profiles.length} profile rows, ${linkedProfiles} linked profiles, ${orphanProfileRows} orphan profile rows.`
  );

  let upsertedContacts = 0;
  let failures = 0;

  for (const [index, row] of importableRows.entries()) {
    const attributeSummary = formatAttributeSummary(row.payload.attributes);
    const label = `[${index + 1}/${importableRows.length}] ${row.email}`;

    if (dryRun) {
      console.log(`${label} -> would upsert (${attributeSummary})`);
      continue;
    }

    try {
      await upsertBrevoContact(brevoApiKey, row.payload);
      upsertedContacts += 1;
      console.log(`${label} -> upserted (${attributeSummary})`);
    } catch (error) {
      failures += 1;
      const message =
        error instanceof Error ? error.message : 'Unknown Brevo error';
      console.error(`${label} -> failed: ${message}`);
    }
  }

  if (summary.skippedInvalidEmail > 0) {
    console.warn(
      `Skipped ${summary.skippedInvalidEmail} auth user(s) with missing or invalid email.`
    );
  }

  console.log('\nSummary');
  console.log(JSON.stringify({
    listId,
    dryRun,
    scannedUsers: summary.scannedUsers,
    linkedProfiles: summary.linkedProfiles,
    orphanProfileRows: summary.orphanProfileRows,
    validEmailUsers: summary.validEmailUsers,
    skippedInvalidEmail: summary.skippedInvalidEmail,
    upsertedContacts: dryRun ? importableRows.length : upsertedContacts,
    emailOnlyImports: summary.emailOnlyImports,
    contactsWithFirstName: summary.contactsWithFirstName,
    contactsWithNormalizedSms: summary.contactsWithNormalizedSms,
    failures,
  }, null, 2));

  if (!dryRun && failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`\nImport failed: ${message}`);
  process.exit(1);
});
