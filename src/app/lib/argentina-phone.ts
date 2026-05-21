export function normalizeArgentinaPhone(
  value: string | null | undefined
): string | null {
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

export function argentinaPhoneToLocalInput(
  value: string | null | undefined
): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }

  if (trimmed.startsWith('+54')) {
    return trimmed.slice(3).trim();
  }

  if (trimmed.startsWith('54') && /^\d{2,}/.test(trimmed.slice(2))) {
    return trimmed.slice(2).trim();
  }

  return trimmed;
}
