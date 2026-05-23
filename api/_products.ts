// Shared product config for Vercel API routes (server-side)
// Hardcoded test mode IDs — override with env vars for live mode

export const PRODUCTS = {
  STARTER:       process.env.PRODUCT_STARTER       || 'pdt_0NfKWwNlgLAUIRjgrInu5',
  BOOST:         process.env.PRODUCT_BOOST         || 'pdt_0NfKX4XJ839wZrSHM3Qkz',
  STANDARD:      process.env.PRODUCT_STANDARD      || 'pdt_0NfKXATusDEKQbyrqGX15',
  PRO_PACK:      process.env.PRODUCT_PRO_PACK      || 'pdt_0NfKXEVFKZn8BKSHFsJ1O',
  STUDIO:        process.env.PRODUCT_STUDIO        || 'pdt_0NfKXI6kBSG4QsZCeZ3j3',
  ENTERPRISE:    process.env.PRODUCT_ENTERPRISE    || 'pdt_0NfKXNDghtiQ6Vn9trCKx',
  PLAN_PRO:      process.env.PRODUCT_PLAN_PRO      || 'pdt_0NfKXSIx1EMeoQ0buSGxU',
  PLAN_BUSINESS: process.env.PRODUCT_PLAN_BUSINESS || 'pdt_0NfKXWTQpI8bLIQHzwzE6',
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
