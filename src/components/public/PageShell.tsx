import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Navbar from '../Navbar'

interface Crumb { label: string; to?: string }

interface Props {
  crumbs: Crumb[]
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
}

/**
 * Shared chrome for public content pages (calculator landing pages, guides,
 * reference tables): navbar, breadcrumb, H1 + intro, then whatever the page
 * supplies. Deliberately does not include the app Footer — pages that want
 * it (all current callers) render <Footer /> themselves after their content,
 * since footer link relevance (e.g. "next tool") varies by page.
 */
export default function PageShell({ crumbs, eyebrow, title, intro, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="public-page">
        <div className="container">
          <div className="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--ink-4)' }} />}
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c.label}</span>}
              </span>
            ))}
          </div>

          <div className="public-hero">
            <span className="section-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
