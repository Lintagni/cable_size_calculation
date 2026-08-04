/**
 * Build-time prerenderer.
 *
 * Runs after `vite build`. For every route flagged `prerender: true` in
 * src/lib/seo.ts it renders the React tree to a string and writes a real
 * HTML file, so crawlers receive content instead of an empty <div id="root">.
 *
 * The client still boots normally via createRoot() and replaces the markup —
 * this is prerendering for crawlers, not hydration.
 *
 * When adding a prerendered route, also add a matching rewrite in vercel.json
 * ABOVE the SPA catch-all, e.g.
 *   { "source": "/guides/x", "destination": "/guides/x/index.html" }
 * Vercel checks the filesystem before rewrites so this is belt-and-braces,
 * but it makes the routing explicit rather than order-dependent.
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const TMP = path.join(ROOT, '.prerender-tmp')

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

function headTags(route, { SITE_URL, SITE_NAME, OG_IMAGE, jsonLdFor }) {
  const url = `${SITE_URL}${route.path}`
  const t = esc(route.title)
  const d = esc(route.description)
  const jsonLd = jsonLdFor(route)

  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    jsonLd
      ? `<script id="seo-jsonld" type="application/ld+json">${jsonLd.replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

async function main() {
  // 1. Bundle the server entry. Separate from the client config so the PWA
  //    plugin and Tailwind don't run again for a build that emits no assets.
  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    plugins: [react()],
    build: {
      ssr: path.join(ROOT, 'src/entry-server.tsx'),
      outDir: TMP,
      emptyOutDir: true,
      ssrEmitAssets: false,
      copyPublicDir: false,
    },
  })

  const { render, ROUTES, SITE_URL, SITE_NAME, OG_IMAGE, jsonLdFor } = await import(
    pathToFileURL(path.join(TMP, 'entry-server.js')).href
  )
  const helpers = { SITE_URL, SITE_NAME, OG_IMAGE, jsonLdFor }

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
  const targets = ROUTES.filter(r => r.prerender)

  for (const route of targets) {
    const appHtml = render(route.path)

    let html = template
      // Drop the generic defaults; the per-route block below replaces them.
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace(/\s*<link rel="canonical"[^>]*>/, '')
      .replace(/<title>[\s\S]*?<\/title>/, headTags(route, helpers))
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

    if (html === template) {
      throw new Error(`Prerender injection failed for ${route.path} — template markers not found`)
    }

    const outDir = route.path === '/' ? DIST : path.join(DIST, route.path)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8')

    const kb = (Buffer.byteLength(appHtml) / 1024).toFixed(1)
    console.log(`  prerendered ${route.path.padEnd(12)} ${kb} kB of HTML`)
  }

  await rm(TMP, { recursive: true, force: true })
  console.log(`prerender: ${targets.length} route(s) written`)
}

main().catch(err => {
  console.error('prerender failed:', err)
  process.exit(1)
})
