import { Link } from 'react-router-dom'
import { Zap, Shield, CheckCircle, FileText, Clock, Cpu } from 'lucide-react'

const FEATURES = [
  { Icon: Zap,         title: 'LV cable sizing',   desc: 'Full BS7671:2018+A2 sizing with correction factors Ca, Cg, Ci, Cc and methods A–G.', code: '01' },
  { Icon: Shield,      title: 'Voltage drop',       desc: 'Instant check against Section 525 limits — 3% lighting, 5% other circuits, mV/A/m tables.', code: '02' },
  { Icon: CheckCircle, title: 'Short circuit',      desc: 'IPSSC calculation and adiabatic withstand check S = (I·√t)/k per BS7671.', code: '03' },
  { Icon: FileText,    title: 'PDF reports',        desc: 'Export cable schedules and full calculation sheets ready for project documentation.', code: '04' },
  { Icon: Clock,       title: 'Calculation history',desc: 'All your sizings in one place — searchable, taggable, re-openable, exportable.', code: '05' },
  { Icon: Cpu,         title: 'Motor sizing',       desc: 'Derive design current from motor kW, efficiency and power factor automatically.', code: '06' },
]

const CHAIN = [
  { num: '01', label: 'Tables 4D1–4E5 current ratings',     ref: 'BS7671 Appendix 4' },
  { num: '02', label: 'Ambient temperature Ca',             ref: 'Table 4B1' },
  { num: '03', label: 'Grouping factor Cg',                 ref: 'Table 4C1' },
  { num: '04', label: 'Thermal insulation Ci',              ref: 'Table 52.2' },
  { num: '05', label: 'mV/A/m voltage drop',                ref: 'Appendix 4 columns 3–4' },
  { num: '06', label: 'Adiabatic check  S = (IF·√t) / K',  ref: 'Reg 543.1.3' },
]

export default function Landing() {
  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="chip accent" style={{ marginBottom: 28 }}>
              <Shield size={12} /> BS7671:2018 + Amendment 2 · Compliant
            </div>
            <h1 className="hero-title">
              Cable sizing<br />
              built like an<br />
              <span className="hero-accent">instrument.</span>
            </h1>
            <p className="hero-sub">
              LV cable sizing, voltage drop, fault current and adiabatic
              checks — wired directly to BS7671 Appendix 4. Professional
              PDFs, calculation history, AI assistance.
            </p>
            <div className="hero-cta">
              <Link to="/calculator" className="btn btn-primary btn-lg">
                Open calculator
              </Link>
              <Link to="/pricing" className="btn btn-lg">
                View pricing
              </Link>
            </div>
            <div className="hero-meta">
              <div><span className="k">v</span>3.2.1</div>
              <div className="dot" />
              <div><span className="k">tables</span> 4D1–4E5</div>
              <div className="dot" />
              <div><span className="k">standard</span> BS7671:2018+A2</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="code-panel" style={{ transform: 'rotate(0.6deg)', maxWidth: 480, marginLeft: 'auto', boxShadow: '0 30px 60px -20px oklch(0% 0 0 / 0.25), 0 12px 24px -10px oklch(0% 0 0 / 0.12)' }}>
              <div className="code-dots">
                <span /><span /><span />
                <span className="label">calc · 22kW motor · 35m run</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="comment">// cable sizing result</div>
                <div><span className="green">✓ Selected:</span> <span className="amber">50mm² XLPE 4C SWA</span></div>
                <br />
                <div><span className="dim">Ib</span> = <span className="amber">98.4 A</span> <span className="dim">(design current)</span></div>
                <div><span className="dim">In</span> = <span className="amber">100 A</span> <span className="dim">(MCCB rating)</span></div>
                <div><span className="dim">Iz</span> = <span className="amber">112.8 A</span> <span className="dim">(derated rating)</span></div>
                <br />
                <div><span className="dim">Ca</span> = 0.96  <span className="dim">(40°C ambient)</span></div>
                <div><span className="dim">Cg</span> = 1.00  <span className="dim">(ungrouped)</span></div>
                <div><span className="dim">Ci</span> = 1.00  <span className="dim">(no insulation)</span></div>
                <br />
                <div><span className="dim">VD</span> = <span className="amber">2.14 V</span> (1.07%)</div>
                <div><span className="dim">Max</span> = 20 V (5.0%) <span className="green">✓</span></div>
                <br />
                <div><span className="blue">→</span> <span className="green">BS7671 Compliant</span> <span className="live-dot" style={{ marginLeft: 8, verticalAlign: 'middle' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features">
        <div className="container">
          <header className="section-head">
            <span className="section-eyebrow">02 · Capabilities</span>
            <h2>Everything you need, on one schematic.</h2>
            <p className="section-sub">
              Six calculators built around the same compliance engine — switch
              freely without re-entering the project context.
            </p>
          </header>
          <div className="feature-grid">
            {FEATURES.map(f => (
              <article key={f.title} className="feature-card">
                <div className="feature-top">
                  <span className="feature-num">{f.code}</span>
                  <span className="feature-stripe" />
                </div>
                <div className="feature-icon"><f.Icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculation chain ── */}
      <section className="chain">
        <div className="container chain-grid">
          <div>
            <span className="section-eyebrow">03 · Method</span>
            <h2>The full BS7671 calculation chain — visible.</h2>
            <p className="section-sub">
              No black boxes. Every coefficient, every table lookup, every
              intermediate result is exposed in the workspace. The same
              workflow you'd use on paper, just faster.
            </p>
            <ul className="chain-list">
              {CHAIN.map(c => (
                <li key={c.label}>
                  <span className="chain-num">{c.num}</span>
                  <div>
                    <div className="chain-label">{c.label}</div>
                    <div className="chain-ref">{c.ref}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="code-panel">
              <div className="code-dots">
                <span /><span /><span />
                <span className="label">BS7671 · adiabatic check</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="comment">// Reg 543.1.3 adiabatic equation</div>
                <div><span className="dim">S</span> ≥ <span className="amber">(IF × √t) / k</span></div>
                <br />
                <div><span className="dim">IF</span>  = <span className="amber">8.4 kA</span> <span className="dim">(fault current)</span></div>
                <div><span className="dim">t</span>   = <span className="amber">0.4 s</span>  <span className="dim">(disconnection time)</span></div>
                <div><span className="dim">k</span>   = <span className="amber">143</span>    <span className="dim">(Cu/XLPE, 90°C)</span></div>
                <br />
                <div><span className="dim">S_min</span> = <span className="amber">37.2 mm²</span></div>
                <div><span className="dim">S_sel</span> = <span className="amber">50 mm²</span> <span className="green">✓ OK</span></div>
                <br />
                <div><span className="blue">→</span> <span className="green">Thermally withstands fault</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="cta-band">
        <div className="container cta-band-inner">
          <div>
            <span className="section-eyebrow">Ready when you are</span>
            <h2>Start sizing your next circuit in 30 seconds.</h2>
          </div>
          <div className="cta-band-actions">
            <Link to="/calculator" className="btn btn-accent btn-lg">
              Open calculator
            </Link>
            <Link to="/calculator" className="btn btn-lg">
              <Zap size={14} /> Try AI assistant
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="brand-mark">CC</div>
            <div>
              <div>CableCalc</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>BS7671 · NFC · IEC</div>
            </div>
          </div>
          <div className="footer-cols">
            <div>
              <h5>Product</h5>
              <Link to="/calculator">Calculator</Link>
              <Link to="/calculator">AI assistant</Link>
              <Link to="/dashboard">History</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div>
              <h5>Reference</h5>
              <a>BS7671 tables</a>
              <a>Methodology</a>
              <a>Release notes</a>
            </div>
            <div>
              <h5>Company</h5>
              <a>About</a>
              <a>Contact</a>
              <a>Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CableCalc Ltd.</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>v3.2.1 · BS7671:2018+A2</span>
        </div>
      </footer>
    </div>
  )
}
