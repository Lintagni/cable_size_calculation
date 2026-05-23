// Dodo Payments product IDs (test mode — safe to commit, not secrets)
// Override with VITE_PRODUCT_* env vars when switching to live mode

// Fallbacks are the live product IDs — override with VITE_PRODUCT_* env vars only if needed.
export const DODO_PRODUCTS = {
  // ── One-time credit packs ──────────────────────────────────────────────────
  STARTER:    import.meta.env.VITE_PRODUCT_STARTER    || 'pdt_0NfT4A7QFL27JpdwdFrrl',
  BOOST:      import.meta.env.VITE_PRODUCT_BOOST      || 'pdt_0NfT4ADEcgVzB64xnvINx',
  STANDARD:   import.meta.env.VITE_PRODUCT_STANDARD   || 'pdt_0NfT4AGSoIGZqKeM47ury',
  PRO_PACK:   import.meta.env.VITE_PRODUCT_PRO_PACK   || 'pdt_0NfT4AItAA3GGzTqTS4C4',
  STUDIO:     import.meta.env.VITE_PRODUCT_STUDIO     || 'pdt_0NfT4AOoJMDIINnO79xgf',
  ENTERPRISE: import.meta.env.VITE_PRODUCT_ENTERPRISE || 'pdt_0NfT4ASJ7Kr4d3WtRJ9Un',

  // ── Subscription plans — monthly ───────────────────────────────────────────
  PLAN_PRO:          import.meta.env.VITE_PRODUCT_PLAN_PRO          || 'pdt_0NfT4AUumjuRg0bv0HzDK',
  PLAN_BUSINESS:     import.meta.env.VITE_PRODUCT_PLAN_BUSINESS     || 'pdt_0NfT4AY1RJ1b42iTjNkPW',

  // ── Subscription plans — yearly ────────────────────────────────────────────
  PLAN_PRO_YEAR:      import.meta.env.VITE_PRODUCT_PLAN_PRO_YEAR      || 'pdt_0NfTAQYQofroLJNeMoOYv',
  PLAN_BUSINESS_YEAR: import.meta.env.VITE_PRODUCT_PLAN_BUSINESS_YEAR || 'pdt_0NfTAQcbASBXw55XMzQzN',
} as const
