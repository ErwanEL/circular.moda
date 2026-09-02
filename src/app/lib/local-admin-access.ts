const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHost(host: string) {
  const firstHost = host.split(',')[0]?.trim().toLowerCase() ?? '';

  if (firstHost.startsWith('[')) {
    const closingBracketIndex = firstHost.indexOf(']');
    return closingBracketIndex > 0
      ? firstHost.slice(1, closingBracketIndex)
      : firstHost;
  }

  return firstHost.split(':')[0] ?? firstHost;
}

export function isLocalAdminRequest(host: string | null) {
  if (!host) return false;
  return LOCAL_HOSTS.has(normalizeHost(host));
}

export function getRequestHost(headers: Headers) {
  return headers.get('host');
}
