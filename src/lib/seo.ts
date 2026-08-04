/**
 * Central SEO metadata for every route.
 *
 * Consumed by two places, which must stay in sync:
 *   - <Seo /> (client-side, updates the head on SPA navigation)
 *   - scripts/prerender.mjs (build-time, bakes the tags into static HTML)
 */

export const SITE_URL = 'https://www.cablecalc.org'
export const SITE_NAME = 'CableCalc'
// TODO: replace with a purpose-built 1200x630 social card; this is the PWA icon.
export const OG_IMAGE = `${SITE_URL}/pwa-512x512.png`

export interface RouteSeo {
  path: string
  title: string
  description: string
  /** Only routes marked prerender:true get a static HTML file at build time. */
  prerender: boolean
  jsonLd?: Record<string, unknown>[]
}

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description:
    'Cable sizing and electrical design software built to BS7671:2018+A2, the IET Wiring Regulations 18th Edition.',
}

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#software`,
  name: 'CableCalc',
  applicationCategory: 'EngineeringApplication',
  applicationSubCategory: 'Electrical cable sizing calculator',
  operatingSystem: 'Web browser',
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#organization` },
  description:
    'BS7671:2018+A2 cable sizing calculator covering LV cable selection, voltage drop, short circuit and adiabatic checks, motor cables, ABC overhead conductors and busbars.',
  featureList: [
    'LV cable sizing to BS7671 Appendix 4 (Tables 4D1A, 4D2A, 4E1A, 4E2A)',
    'Correction factors Ca, Cg, Ci and Cc',
    'Voltage drop check against BS7671 Section 525',
    'Short circuit and adiabatic check S = (I x sqrt(t)) / k per Regulation 543.1.3',
    'Motor cable sizing from kW, efficiency and power factor',
    'ABC overhead cable sizing (NFC 33-209)',
    'Busbar sizing for copper and aluminium',
    'PDF calculation reports',
  ],
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '12.99',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '12.99',
        priceCurrency: 'USD',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
    },
    {
      '@type': 'Offer',
      name: 'Business',
      price: '34.99',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '34.99',
        priceCurrency: 'USD',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
    },
  ],
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { '@id': `${SITE_URL}/#organization` },
}

export const ROUTES: RouteSeo[] = [
  {
    path: '/',
    title: 'BS7671 Cable Size Calculator | CableCalc',
    description:
      'BS7671:2018+A2 cable size calculator for UK electrical design. LV cable sizing with correction factors, voltage drop to Section 525 and adiabatic short circuit checks.',
    prerender: true,
    jsonLd: [organization, website, softwareApplication],
  },
  {
    path: '/pricing',
    title: 'Pricing — BS7671 Cable Sizing Software | CableCalc',
    description:
      'CableCalc pricing. Free BS7671 LV cable sizing, or upgrade for short circuit, motor cable, ABC and busbar calculators with PDF reports. From $12.99 per month.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'WebPage',
        name: 'CableCalc Pricing',
        url: `${SITE_URL}/pricing`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
    ],
  },
  {
    // Currently behind the auth wall, so there is nothing meaningful to
    // prerender. Metadata is still applied client-side.
    path: '/calculator',
    title: 'BS7671 Cable Sizing Calculator | CableCalc',
    description:
      'Size LV cables to BS7671 Appendix 4. Enter design current, installation method, length and grouping to get a compliant cable size with voltage drop and fault checks.',
    prerender: false,
  },
  {
    path: '/calculator/swa-armoured-cable-size',
    title: 'SWA & Armoured Cable Size Calculator | BS7671 | CableCalc',
    description:
      'Free SWA and armoured cable size calculator to BS7671. Current rating, correction factors and voltage drop for PVC or XLPE, clipped direct or buried.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'WebPage',
        name: 'SWA & Armoured Cable Size Calculator',
        url: `${SITE_URL}/calculator/swa-armoured-cable-size`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
    ],
  },
  {
    path: '/calculator/voltage-drop',
    title: 'Voltage Drop Calculator | BS7671 Section 525 | CableCalc',
    description:
      'Free voltage drop calculator to BS7671 Section 525. Check cable voltage drop against the 3% lighting / 5% power limits for any length, load and cable size.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'WebPage',
        name: 'Voltage Drop Calculator',
        url: `${SITE_URL}/calculator/voltage-drop`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
    ],
  },
  {
    path: '/calculator/shower-cable-size',
    title: 'Electric Shower Cable Size Calculator | BS7671 | CableCalc',
    description:
      'Free electric shower cable size calculator to BS7671. Current rating and voltage drop for any shower kW rating, run length and installation method.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'WebPage',
        name: 'Electric Shower Cable Size Calculator',
        url: `${SITE_URL}/calculator/shower-cable-size`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
    ],
  },
  {
    path: '/guides/bs7671-cable-sizing-explained',
    title: 'BS7671 Cable Sizing Explained | Step-by-Step Guide | CableCalc',
    description:
      'How BS7671:2018+A2 sizes a cable, step by step: design current, correction factors, current rating, voltage drop and the adiabatic check, with a worked calculator.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'TechArticle',
        headline: 'BS7671 Cable Sizing, Explained',
        url: `${SITE_URL}/guides/bs7671-cable-sizing-explained`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  },
  {
    path: '/tables/bs7671-cable-current-rating-tables',
    title: 'BS7671 Cable Current Rating Tables | Appendix 4 | CableCalc',
    description:
      'BS7671 Appendix 4 current-carrying capacity tables (4D1A, 4D2A, 4E1A, 4E2A) for PVC and XLPE copper cable, plus ambient temperature and grouping correction factors.',
    prerender: true,
    jsonLd: [
      {
        '@type': 'WebPage',
        name: 'BS7671 Cable Current Rating Tables',
        url: `${SITE_URL}/tables/bs7671-cable-current-rating-tables`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#software` },
      },
    ],
  },
  {
    path: '/ai',
    title: 'AI Cable Sizing Assistant | CableCalc',
    description:
      'Describe a circuit in plain English and get a BS7671-compliant cable size, with the calculation steps and regulation references explained.',
    prerender: false,
  },
  {
    path: '/dashboard',
    title: 'Calculation History | CableCalc',
    description: 'Your saved BS7671 cable sizing calculations.',
    prerender: false,
  },
]

export const DEFAULT_SEO = ROUTES[0]

export function seoForPath(pathname: string): RouteSeo {
  return ROUTES.find(r => r.path === pathname) ?? DEFAULT_SEO
}

/** Wrap the route's JSON-LD blocks in a single @graph document. */
export function jsonLdFor(route: RouteSeo): string | null {
  if (!route.jsonLd?.length) return null
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': route.jsonLd })
}
