// Dodo Payments product IDs (test mode — safe to commit, not secrets)
// Override with VITE_PRODUCT_* env vars when switching to live mode

export const DODO_PRODUCTS = {
  // ── One-time credit packs ──────────────────────────────────────────────────
  STARTER:    import.meta.env.VITE_PRODUCT_STARTER    || 'pdt_0NfKWwNlgLAUIRjgrInu5',
  BOOST:      import.meta.env.VITE_PRODUCT_BOOST      || 'pdt_0NfKX4XJ839wZrSHM3Qkz',
  STANDARD:   import.meta.env.VITE_PRODUCT_STANDARD   || 'pdt_0NfKXATusDEKQbyrqGX15',
  PRO_PACK:   import.meta.env.VITE_PRODUCT_PRO_PACK   || 'pdt_0NfKXEVFKZn8BKSHFsJ1O',
  STUDIO:     import.meta.env.VITE_PRODUCT_STUDIO     || 'pdt_0NfKXI6kBSG4QsZCeZ3j3',
  ENTERPRISE: import.meta.env.VITE_PRODUCT_ENTERPRISE || 'pdt_0NfKXNDghtiQ6Vn9trCKx',

  // ── Subscription plans ─────────────────────────────────────────────────────
  PLAN_PRO:      import.meta.env.VITE_PRODUCT_PLAN_PRO      || 'pdt_0NfKXSIx1EMeoQ0buSGxU',
  PLAN_BUSINESS: import.meta.env.VITE_PRODUCT_PLAN_BUSINESS || 'pdt_0NfKXWTQpI8bLIQHzwzE6',
} as const
