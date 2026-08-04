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
            <Link to="/ai">AI assistant</Link>
            <Link to="/dashboard">History</Link>
            <Link to="/pricing">Pricing</Link>
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
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 CableCalc Ltd.</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>v3.2.1 · BS7671:2018+A2</span>
      </div>
    </footer>
  )
}
