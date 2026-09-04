import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/**
 * 404 page, prerendered to dist/404.html so Vercel can serve it with a real
 * 404 status for unmatched paths.
 *
 * Previously the SPA catch-all rewrite in vercel.json turned every unknown URL
 * into a 200 serving the prerendered homepage — complete with canonical="/" —
 * so the whole infinite URL space looked like indexable duplicates of the home
 * page. The route list in vercel.json is now explicit and anything outside it
 * lands here.
 *
 * seo.ts marks this route noindex; scripts/prerender.mjs bakes that meta tag in.
 */
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="public-page" style={{ flex: 1 }}>
        <div className="container">
          <div className="public-hero">
            <span className="section-eyebrow">Error 404</span>
            <h1>Page not found</h1>
            <p>
              That URL doesn&rsquo;t exist on CableCalc. It may have moved, or the link that
              brought you here may be wrong.
            </p>
          </div>

          <div className="related-pages" style={{ marginTop: 32 }}>
            <Link to="/calculator">
              <div className="label">Calculator</div>
              <div className="title">BS7671 cable size calculator →</div>
            </Link>
            <Link to="/calculator/voltage-drop">
              <div className="label">Calculator</div>
              <div className="title">Voltage drop calculator →</div>
            </Link>
            <Link to="/calculator/swa-armoured-cable-size">
              <div className="label">Calculator</div>
              <div className="title">SWA / armoured cable size →</div>
            </Link>
            <Link to="/tables/bs7671-cable-current-rating-tables">
              <div className="label">Reference</div>
              <div className="title">Appendix 4 current rating tables →</div>
            </Link>
            <Link to="/guides/bs7671-cable-sizing-explained">
              <div className="label">Guide</div>
              <div className="title">BS7671 cable sizing explained →</div>
            </Link>
            <Link to="/">
              <div className="label">Home</div>
              <div className="title">Back to the home page →</div>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
