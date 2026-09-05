import { BRAND_NAME, BRAND_MARK, OPERATOR } from '../config/brand'
import { Link } from 'react-router-dom'

/**
 * Shared site footer. Extracted from Landing.tsx so the "Reference" column
 * can carry real links to the guide/calculator/table pages instead of the
 * inert placeholder <a> tags it originally had (no href — dead ends for
 * both users and crawlers).
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand-mark">{BRAND_MARK}</div>
          <div>
            <div>{BRAND_NAME}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>BS7671 · NFC · IEC</div>
          </div>
        </div>
        <div className="footer-cols">
          <div>
            <h5>Product</h5>
            <Link to="/calculator">Calculator</Link>
            <Link to="/ai">AI assistant</Link>
            <Link to="/dashboard">History</Link>
                      </div>
          <div>
            <h5>Calculators</h5>
            <Link to="/calculator/swa-armoured-cable-size">SWA armoured cable size</Link>
            <Link to="/calculator/voltage-drop">Voltage drop</Link>
            <Link to="/calculator/shower-cable-size">Shower cable size</Link>
          </div>
          <div>
            <h5>Reference</h5>
            <Link to="/guides/bs7671-cable-sizing-explained">BS7671 sizing explained</Link>
            <Link to="/tables/bs7671-cable-current-rating-tables">Current rating tables</Link>
            <Link to="/methodology">How it calculates</Link>
            <Link to="/verification">Worked examples</Link>
          </div>
        </div>
      </div>
      {/* Stated plainly rather than buried in terms: professionals trust a tool
          more when it is honest about where its responsibility ends. */}
      <div className="container footer-disclaimer">
        Calculated to BS7671:2018+A2. {BRAND_NAME} is a design aid, not a substitute for a
        competent designer — the person signing the certificate remains responsible for the
        design under BS7671. See <Link to="/methodology">how it calculates</Link> and the{' '}
        <Link to="/verification">worked examples</Link>.
      </div>
      <div className="footer-bottom">
        <span>© 2026 {OPERATOR.name || BRAND_NAME}</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>BS7671:2018+A2</span>
      </div>
    </footer>
  )
}
