export type InstallPlatform = 'ios-safari' | 'ios-other' | 'other';

export function isIosDevice(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0
): boolean {
  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1)
  );
}

export function isSafariBrowser(userAgent: string): boolean {
  return (
    /Safari/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent)
  );
}

export function getInstallPlatform(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0
): InstallPlatform {
  if (!isIosDevice(userAgent, platform, maxTouchPoints)) {
    return 'other';
  }

  return isSafariBrowser(userAgent) ? 'ios-safari' : 'ios-other';
}
