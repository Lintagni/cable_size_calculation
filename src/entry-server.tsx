/* eslint-disable react-refresh/only-export-components --
   Build-time server entry; never loaded by the browser, so fast refresh
   does not apply. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import SwaArmouredCalculator from './pages/public/SwaArmouredCalculator'
import VoltageDropCalculator from './pages/public/VoltageDropCalculator'
import ShowerCableCalculator from './pages/public/ShowerCableCalculator'
import Bs7671Guide from './pages/public/Bs7671Guide'
import Bs7671Tables from './pages/public/Bs7671Tables'
// Re-exported so scripts/prerender.mjs has a single entry point to import.
export { ROUTES, SITE_URL, SITE_NAME, OG_IMAGE, jsonLdFor } from './lib/seo'

/**
 * Build-time render targets.
 *
 * Deliberately does NOT import App.tsx — that would pull the calculator,
 * jspdf and xlsx into the SSR bundle for no benefit. Only public,
 * content-bearing routes belong here.
 *
 * Landing and Pricing render bare page content and rely on App's <Shell> for
 * navbar/layout, so they're wrapped here to match. The pages under
 * pages/public/ compose their own chrome via <PageShell> (which renders its
 * own <Navbar />), so wrapping them in <Shell> again would double it up.
 */
const SHELL_WRAPPED: Record<string, React.ComponentType> = {
  '/': Landing,
  '/pricing': Pricing,
}

const SELF_CONTAINED: Record<string, React.ComponentType> = {
  '/calculator/swa-armoured-cable-size': SwaArmouredCalculator,
  '/calculator/voltage-drop': VoltageDropCalculator,
  '/calculator/shower-cable-size': ShowerCableCalculator,
  '/guides/bs7671-cable-sizing-explained': Bs7671Guide,
  '/tables/bs7671-cable-current-rating-tables': Bs7671Tables,
}

export function render(url: string): string {
  const ShellPage = SHELL_WRAPPED[url]
  if (ShellPage) {
    return renderToString(<StaticRouter location={url}><Shell><ShellPage /></Shell></StaticRouter>)
  }

  const StandalonePage = SELF_CONTAINED[url]
  if (StandalonePage) {
    return renderToString(<StaticRouter location={url}><StandalonePage /></StaticRouter>)
  }

  throw new Error(`No prerender component registered for "${url}"`)
}
