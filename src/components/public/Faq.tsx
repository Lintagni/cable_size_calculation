import { useState } from 'react'
import { Plus } from 'lucide-react'

export interface FaqEntry { q: string; a: string }

function FaqItem({ q, a }: FaqEntry) {
  const [open, setOpen] = useState(false)
  return (
    <button className="faq-item" onClick={() => setOpen(o => !o)} type="button">
      <div className="faq-q">
        <span>{q}</span>
        <Plus size={14} style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </div>
      {open && <div className="faq-a">{a}</div>}
    </button>
  )
}

/**
 * Renders visibly (accordion, matches Pricing.tsx) AND emits an FAQPage
 * JSON-LD block, since the visible accordion answers are collapsed by
 * default and would otherwise be invisible to a renderer that doesn't
 * execute the click.
 */
export default function Faq({ items, title = 'Frequently asked' }: { items: FaqEntry[]; title?: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div className="faq">
      <span className="section-eyebrow">Questions</span>
      <h3>{title}</h3>
      <div className="faq-grid">
        {items.map((f, i) => <FaqItem key={i} {...f} />)}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
