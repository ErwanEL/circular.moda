import { brevoFetch, normalizeSubscriberEmail } from '@/app/lib/catalogue-newsletter';
import { normalizeArgentinaPhone } from '@/app/lib/argentina-phone';

export const BREVO_USERS_LIST_ID = Number(process.env.BREVO_USERS_LIST_ID);

export type BrevoUserContactInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
};

function getBrevoUsersListId(): number {
  if (!Number.isInteger(BREVO_USERS_LIST_ID) || BREVO_USERS_LIST_ID <= 0) {
    throw new Error('BREVO_USERS_LIST_ID is not configured as a positive integer.');
  }

  return BREVO_USERS_LIST_ID;
}

function normalizeContactName(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function upsertBrevoUserContact({
  email,
  name,
  phone,
}: BrevoUserContactInput): Promise<void> {
  const normalizedEmail = normalizeSubscriberEmail(email);
  if (!normalizedEmail) {
    throw new Error('A valid email is required to sync a Brevo user contact.');
  }

  const normalizedName = normalizeContactName(name);
  const normalizedPhone = normalizeArgentinaPhone(phone);
  const attributes: Record<string, string> = {};

  if (normalizedName) {
    attributes.FIRSTNAME = normalizedName;
  }

  if (normalizedPhone) {
    attributes.SMS = normalizedPhone;
  }

  await brevoFetch('/contacts', {
    method: 'POST',
    body: {
      email: normalizedEmail,
      listIds: [getBrevoUsersListId()],
      updateEnabled: true,
      attributes,
    },
  });
}
