/** Shared client/server rules; the database enforces the same username contract. */
export const RESERVED_USERNAMES = [
  'admin',
  'api',
  'auth',
  'blog',
  'circular',
  'circular-moda',
  'circularmoda',
  'help',
  'instagram',
  'login',
  'logout',
  'me',
  'products',
  'settings',
  'signup',
  'support',
  'user',
  'welcome',
  'www',
];

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase();
}
export function usernameError(value: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/.test(value))
    return 'Usá entre 3 y 30 caracteres: letras, números y guiones, sin guiones al principio o al final.';
  if (RESERVED_USERNAMES.includes(value))
    return 'Este nombre está reservado. Elegí otro.';
  return null;
}
/** Accept a handle or an Instagram profile URL, never an arbitrary external link. */
export function normalizeInstagram(value: string): string | null {
  let handle = value.trim();
  if (!handle) return '';
  if (/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(handle)) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(handle) ? handle : `https://${handle}`
      );
      if (
        !['instagram.com', 'www.instagram.com'].includes(
          url.hostname.toLowerCase()
        ) ||
        url.username ||
        url.password ||
        url.port
      )
        return null;
      handle = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    } catch {
      return null;
    }
  }
  handle = handle.replace(/^@/, '').toLowerCase();
  if (
    !/^[a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?$/.test(handle) ||
    handle.includes('..')
  )
    return null;
  if (
    ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct'].includes(
      handle
    )
  )
    return null;
  return handle;
}
export function suggestUsername(instagram: string): string {
  const handle = normalizeInstagram(instagram);
  if (!handle) return '';
  const suggestion = handle.replace(/[._]+/g, '-').replace(/^-+|-+$/g, '');
  return usernameError(suggestion) ? '' : suggestion;
}
export function sellerPath(user: {
  id: string | number;
  username?: string | null;
}): string {
  return user.username ? `/@${user.username}` : `/user/${user.id}`;
}

/** Next may preserve the escaped @ (%40) in a dynamic route parameter. */
export function parseSellerHandle(
  value: string
): { handle: string; username: string } | null {
  try {
    const handle = decodeURIComponent(value);
    if (!handle.startsWith('@')) return null;
    const username = normalizeUsername(handle);
    return usernameError(username) ? null : { handle, username };
  } catch {
    return null;
  }
}
