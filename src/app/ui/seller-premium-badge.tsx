/**
 * Refined "premium seller" chip shown on the profiles of high-status sellers
 * (see isPremiumSeller). Intentionally subtle — a small gold-toned label that
 * signals prestige without shouting.
 */
export default function SellerPremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-gradient-to-b from-amber-50 to-amber-100/50 px-3.5 py-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-amber-800 uppercase shadow-sm dark:border-amber-400/25 dark:from-amber-400/10 dark:to-amber-500/5 dark:text-amber-200">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      Vendedor destacado
    </span>
  );
}
