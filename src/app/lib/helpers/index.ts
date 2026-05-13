export * from './product-transformer';
import { getColorLabel } from '../product-option-labels';

export function translateColorToSpanish(color: string): string {
  return getColorLabel(color);
}

export function signupUrl(nextPath: string = '/me'): string {
  const safeNext = nextPath.startsWith('/') ? nextPath : '/me';
  return `/signup?next=${encodeURIComponent(safeNext)}`;
}

export function loginUrl(nextPath: string = '/me'): string {
  const safeNext = nextPath.startsWith('/') ? nextPath : '/me';
  return `/login?next=${encodeURIComponent(safeNext)}`;
}
