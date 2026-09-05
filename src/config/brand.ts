/**
 * Single source of truth for the product name.
 *
 * The site previously traded as "CableCalc", which collided with CABLECALC
 * (UK registered trade mark UK00002586954, Castline Systems). That name has
 * been withdrawn in full.
 *
 * Everything brand-facing now reads from here, so adopting the replacement
 * name is a one-line change rather than a hunt through thirty files. The
 * current values are deliberately plain and descriptive — a description of
 * what the tool does cannot itself infringe anyone's mark, which makes this a
 * safe state to sit in while the new name is chosen and cleared.
 *
 * When the new name is settled: change these five constants, swap the logo and
 * favicon assets in public/, and update SITE_URL in src/lib/seo.ts.
 */

/** Full product name, used in titles, reports and structured data. */
export const BRAND_NAME = 'BS7671 Cable Sizing'

/** Short form for tight spaces — navbar, PWA short_name, tab titles. */
export const BRAND_SHORT = 'Cable Sizing'

/** Two-character mark for the navbar badge and auth screens. */
export const BRAND_MARK = 'BS'

/** One-line description used in meta tags and the PWA manifest. */
export const BRAND_TAGLINE =
  'Free BS7671:2018+A2 cable sizing calculator for UK electrical design.'

/**
 * Who operates the site. Required on a UK site that trades with the public —
 * the previous footer claimed "CableCalc Ltd", which is not a registered
 * company.
 *
 * TODO(owner): replace with your real trading name and contact address before
 * the site takes any payment again. If you trade as a sole trader, that is
 * your own name plus an address at which you can be contacted.
 */
export const OPERATOR = {
  name: '',
  contact: '',
}
