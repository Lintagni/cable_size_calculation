import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_URL, OG_IMAGE, SITE_NAME, seoForPath, jsonLdFor } from '../lib/seo'

function upsertMeta(key: 'name' | 'property', value: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(key, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(json: string | null) {
  const id = 'seo-jsonld'
  const existing = document.getElementById(id)
  if (!json) {
    existing?.remove()
    return
  }
  const el = existing ?? document.createElement('script')
  el.id = id
  el.setAttribute('type', 'application/ld+json')
  el.textContent = json
  if (!existing) document.head.appendChild(el)
}

/**
 * Keeps the document head in sync with the current route.
 *
 * Prerendered routes already ship these tags in their static HTML — this
 * exists so client-side navigation and non-prerendered routes stay correct.
 */
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const route = seoForPath(pathname)
    const url = `${SITE_URL}${route.path === '/' ? '/' : route.path}`

    document.title = route.title
    upsertMeta('name', 'description', route.description)
    upsertCanonical(url)

    upsertMeta('property', 'og:title', route.title)
    upsertMeta('property', 'og:description', route.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:image', OG_IMAGE)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', route.title)
    upsertMeta('name', 'twitter:description', route.description)
    upsertMeta('name', 'twitter:image', OG_IMAGE)

    upsertJsonLd(jsonLdFor(route))
  }, [pathname])

  return null
}
