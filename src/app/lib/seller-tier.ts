/**
 * Seller tiers.
 *
 * Today a seller earns the refined "premium" treatment once they reach
 * PREMIUM_SELLER_THRESHOLD published products — a proxy for an established,
 * high-status seller. When paid plans land, gate this on the plan as well
 * (e.g. `isPremiumSeller(count) || user.isPaid`) so the prestige treatment
 * also rewards subscribers.
 */
export const PREMIUM_SELLER_THRESHOLD = 20;

export function isPremiumSeller(productCount: number): boolean {
  return productCount >= PREMIUM_SELLER_THRESHOLD;
}
