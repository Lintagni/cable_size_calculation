/* eslint-disable react-refresh/only-export-components --
   Build-time server entry; never loaded by the browser, so fast refresh
   does not apply. */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
// Re-exported so scripts/prerender.mjs has a single entry point to import.
export { ROUTES, SITE_URL, SITE_NAME, OG_IMAGE, jsonLdFor } from './lib/seo'

/**
 * Build-time render targets.
 *
 * Deliberately does NOT import App.tsx — that would pull the calculator,
 * jspdf and xlsx into the SSR bundle for no benefit. Only public,
 * content-bearing routes belong here.
 */
const PAGES: Record<string, React.ComponentType> = {
  '/': Landing,
  '/pricing': Pricing,
}

export function render(url: string): string {
  const Page = PAGES[url]
  if (!Page) throw new Error(`No prerender component registered for "${url}"`)

  return renderToString(
    <StaticRouter location={url}>
      <Shell>
        <Page />
      </Shell>
    </StaticRouter>,
  )
}
