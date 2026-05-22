import { useState } from 'react'
import { CheckCircle, X, Plus } from 'lucide-react'
import { usePlanStore } from '../store/planStore'

const PLANS = [
  {
    name: 'Free', tag: 'Try it',
    price: { month: 0, year: 0 },
    blurb: 'For occasional sizing and exploring the methodology.',
    features: ['LV cable sizing · 5/day', 'Voltage drop check', 'AI assistant · 10/mo', 'Calculation history · last 5'],
    excluded: ['Short circuit', 'Motor sizing', 'PDF export', 'ABC, Busbar'],
    cta: 'Get started', ctaClass: 'btn', planValue: 'free' as const, featured: false,
  },
  {
    name: 'Pro', tag: 'Practising engineers',
    price: { month: 12.99, year: 124.7 },
    blurb: 'For engineers who need the full BS7671 toolset.',
    features: ['Everything in Free', 'Unlimited LV sizing', 'AI assistant · 200/mo', 'Short circuit · Motor sizing', 'Aluminium sizing', 'PDF report export', 'Unlimited history'],
    excluded: ['ABC calculator', 'Busbar sizing'],
    cta: 'Start free trial', ctaClass: 'btn btn-accent', planValue: 'pro' as const, featured: true,
  },
  {
    name: 'Business', tag: 'Consultancies',
    price: { month: 34.99, year: 335.9 },
    blurb: 'For design firms needing every tool, with team access.',
    features: ['Everything in Pro', 'AI assistant · 2,000/mo', 'ABC cable (NFC 33-209)', 'Busbar sizing (Cu & Al)', 'Multi-user team access', 'API access', 'Priority support', 'Custom branding on reports'],
    excluded: [],
    cta: 'Contact sales', ctaClass: 'btn btn-primary', planValue: 'business' as const, featured: false,
  },
]

const COMPARE = [
  { feat: 'LV cable sizing',    ref: 'BS7671 4D1–4E5',     free: '5/day',  pro: 'Unlimited', biz: 'Unlimited' },
  { feat: 'Voltage drop check', ref: 'Sec 525',            free: true,     pro: true,        biz: true },
  { feat: 'AI assistant',       ref: 'Claude',             free: '10/mo',  pro: '200/mo',    biz: '2,000/mo' },
  { feat: 'Short-circuit calc', ref: 'IPSSC + adiabatic',  free: false,    pro: true,        biz: true },
  { feat: 'Motor cable sizing', ref: 'kW · η · cos φ',     free: false,    pro: true,        biz: true },
  { feat: 'Aluminium cables',   ref: '',                   free: false,    pro: true,        biz: true },
  { feat: 'PDF report export',  ref: 'Calculation sheet',  free: false,    pro: true,        biz: true },
  { feat: 'History',            ref: '',                   free: 'Last 5', pro: 'Unlimited', biz: 'Unlimited' },
  { feat: 'ABC cable',          ref: 'NFC 33-209',         free: false,    pro: false,       biz: true },
  { feat: 'Busbar sizing',      ref: 'Cu · Al',            free: false,    pro: false,       biz: true },
  { feat: 'Team access',        ref: 'Multi-user',         free: false,    pro: false,       biz: true },
  { feat: 'API access',         ref: '',                   free: false,    pro: false,       biz: true },
]

const FAQ = [
  { q: 'Are calculations actually BS7671-compliant?', a: 'Yes — every coefficient is sourced from BS7671:2018 Amendment 2 and the methodology is visible step-by-step. You can audit every intermediate result.' },
  { q: 'Can I use the PDF reports professionally?', a: 'Pro and Business plans include exportable calculation sheets formatted for inclusion in project documentation, with optional custom branding on Business.' },
  { q: 'What models power the AI assistant?', a: 'Claude Haiku, Sonnet, and Opus — selectable in the AI panel. Credits vary by model weight. Credits reset monthly.' },
  { q: 'Do you offer team or volume licensing?', a: 'Business plans include multi-user access. For >20 seats, contact sales for custom volume pricing.' },
]

function Cell({ val }: { val: boolean | string }) {
  if (val === true)  return <CheckCircle size={14} style={{ color: 'var(--ok)' }} />
  if (val === false) return <span style={{ color: 'var(--ink-4)' }}>—</span>
  return <span className="compare-cell-value">{val}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button className="faq-item" onClick={() => setOpen(o => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <Plus size={14} style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </div>
      {open && <div className="faq-a">{a}</div>}
    </button>
  )
}

export default function Pricing() {
  const { setPlan } = usePlanStore()
  const [period, setPeriod] = useState<'month' | 'year'>('month')

  return (
    <div className="pricing">
      <div className="container">
        {/* Header */}
        <header className="pricing-head">
          <span className="section-eyebrow">Pricing</span>
          <h1>Tools priced by how seriously you size.</h1>
          <p>Start free. Upgrade when you start billing your time against it.</p>
          <div className="period-toggle seg" style={{ marginTop: 24, display: 'inline-flex' }}>
            <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>Monthly</button>
            <button className={period === 'year'  ? 'on' : ''} onClick={() => setPeriod('year')}>
              Yearly <span className="save-pill">−20%</span>
            </button>
          </div>
        </header>

        {/* Plan cards */}
        <div className="pricing-grid">
          {PLANS.map(p => {
            const price = p.price[period]
            return (
              <article key={p.name} className={`plan-card${p.featured ? ' featured' : ''}`}>
                {p.featured && <div className="featured-banner">Recommended</div>}
                <div className="plan-head">
                  <span className="plan-tag">{p.tag}</span>
                  <h3>{p.name}</h3>
                </div>
                <div className="plan-price">
                  {price === 0 ? (
                    <><span className="amount">$0</span><span className="period">forever</span></>
                  ) : (
                    <><span className="currency">$</span>
                    <span className="amount">{period === 'year' ? (price / 12).toFixed(2) : price.toFixed(2)}</span>
                    <span className="period">/{period === 'year' ? 'mo, billed yearly' : 'month'}</span></>
                  )}
                </div>
                <p className="plan-blurb">{p.blurb}</p>
                <button
                  className={`${p.ctaClass} btn-lg plan-cta`}
                  onClick={() => setPlan(p.planValue)}
                >
                  {p.cta}
                </button>
                <ul className="plan-features">
                  {p.features.map((f, i) => (
                    <li key={i}><CheckCircle size={13} style={{ color: 'var(--ok)', flexShrink: 0 }} /><span>{f}</span></li>
                  ))}
                  {p.excluded.map((f, i) => (
                    <li key={i} className="excluded"><X size={13} style={{ flexShrink: 0 }} /><span>{f}</span></li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        {/* Compare table */}
        <div className="compare">
          <div className="compare-head">
            <span className="section-eyebrow">Compare</span>
            <h3>Full feature table</h3>
          </div>
          <div className="compare-table">
            <div className="compare-row compare-head-row">
              <div>Feature</div>
              <div>Free</div>
              <div>Pro</div>
              <div>Business</div>
            </div>
            {COMPARE.map((c, i) => (
              <div key={i} className="compare-row">
                <div className="compare-feat">
                  {c.feat}
                  {c.ref && <span className="compare-ref">{c.ref}</span>}
                </div>
                <div><Cell val={c.free} /></div>
                <div><Cell val={c.pro} /></div>
                <div><Cell val={c.biz} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="faq">
          <span className="section-eyebrow">Questions</span>
          <h3>Frequently asked</h3>
          <div className="faq-grid">
            {FAQ.map((f, i) => <FaqItem key={i} {...f} />)}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 48 }}>
          All prices in USD · Cancel anytime · 7-day free trial on Pro and Business
        </p>
      </div>
    </div>
  )
}
