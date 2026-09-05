/**
 * Single source of truth for the product name.
 *
 * The site previously traded as "CableCalc", which collided with CABLECALC
 * (UK registered trade mark UK00002586954, Castline Systems). That name has
 * been withdrawn in full.
 *
 * Everything brand-facing reads from here, so changing the name again is a
 * one-line edit rather than a hunt through thirty files.
 *
 * "Conductra" was chosen because it is distinctive rather than descriptive
 * (which makes it defensible), and because searches of Companies House and the
 * general web found no user of it in this or any adjacent field. That is NOT a
 * formal clearance search — the UK IPO register blocks automated access, so a
 * Class 9 search on the register, and ideally a paid clearance search, should
 * be done before the name is relied on commercially.
 *
 * If it changes again: edit the constants below, regenerate the icons in
 * public/, and update SITE_URL in src/lib/seo.ts.
 */

/** Full product name, used in titles, reports and structured data. */
export const BRAND_NAME = 'Conductra'

/** Short form for tight spaces — navbar, PWA short_name, tab titles. */
export const BRAND_SHORT = 'Conductra'

/** Two-character mark for the navbar badge and auth screens. */
export const BRAND_MARK = 'Co'

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
