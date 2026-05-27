// Shared product config for Vercel API routes (server-side)
// Hardcoded test mode IDs — override with env vars for live mode

export const PRODUCTS = {
  STARTER:       process.env.PRODUCT_STARTER       || 'pdt_0NfT4A7QFL27JpdwdFrrl',
  BOOST:         process.env.PRODUCT_BOOST         || 'pdt_0NfT4ADEcgVzB64xnvINx',
  STANDARD:      process.env.PRODUCT_STANDARD      || 'pdt_0NfT4AGSoIGZqKeM47ury',
  PRO_PACK:      process.env.PRODUCT_PRO_PACK      || 'pdt_0NfT4AItAA3GGzTqTS4C4',
  STUDIO:        process.env.PRODUCT_STUDIO        || 'pdt_0NfT4AOoJMDIINnO79xgf',
  ENTERPRISE:    process.env.PRODUCT_ENTERPRISE    || 'pdt_0NfT4ASJ7Kr4d3WtRJ9Un',
  PLAN_PRO:      process.env.PRODUCT_PLAN_PRO      || 'pdt_0NfT4AUumjuRg0bv0HzDK',
  PLAN_BUSINESS: process.env.PRODUCT_PLAN_BUSINESS || 'pdt_0NfT4AY1RJ1b42iTjNkPW',
}

// One-time pack → credits granted
export const PACK_CREDITS: Record<string, number> = {
  [PRODUCTS.STARTER]:    25,
  [PRODUCTS.BOOST]:      75,
  [PRODUCTS.STANDARD]:   200,
  [PRODUCTS.PRO_PACK]:   600,
  [PRODUCTS.STUDIO]:     1500,
  [PRODUCTS.ENTERPRISE]: 5000,
}

// Subscription plan → plan tier
export const PLAN_MAP: Record<string, 'pro' | 'business'> = {
  [PRODUCTS.PLAN_PRO]:      'pro',
  [PRODUCTS.PLAN_BUSINESS]: 'business',
}
