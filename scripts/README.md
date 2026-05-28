# Scripts

## `test-supabase.mjs`

Script to verify the Supabase connection and product data.

**Usage:**

```bash
node scripts/test-supabase.mjs
```

**Requirements:**

- `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**What it does:**

1. Checks that the `products` table exists and is accessible
2. Prints a sample of the table structure (columns)
3. Fetches up to 5 products and logs name, ID, SKU, slug, price, category

Use this after setting up Supabase or when debugging product loading.

## `import-supabase-users-to-brevo.mjs`

One-off import script to sync Supabase auth users into a Brevo contact list.

**Usage:**

```bash
node scripts/import-supabase-users-to-brevo.mjs --list-id=4 --dry-run
node scripts/import-supabase-users-to-brevo.mjs --list-id=4
```

**Requirements:**

- `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BREVO_API_KEY`

**Related app env:**

- `BREVO_USERS_LIST_ID`
  - used by the app runtime to auto-sync new signed-up users to Brevo
  - the import script still takes the destination list from `--list-id`

**What it does:**

1. Fetches all Supabase Auth users with pagination
2. Joins linked profile rows from the `users` table through `users.user_id`
3. Builds Brevo contact upserts using:
   - `email` from Supabase Auth
   - `FIRSTNAME` from `users.name` when present
   - `SMS` from `users.phone`, normalized to `+54...`
4. Upserts contacts into the provided Brevo list with `updateEnabled: true`
5. Prints a summary including scanned users, linked profiles, email-only imports, SMS-enriched imports, and failures

Use `--dry-run` first to verify the data that will be sent before running the live import.
