import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import RatingTable from '../../components/public/RatingTable'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'
import { table4D1A, table4D2A, table4E1A, table4E2A } from '../../data/cableTables'
import { ambientTempFactors, groupingFactors } from '../../data/correctionFactors'

const FAQ_ITEMS = [
  {
    q: 'Are these the exact BS7671 Appendix 4 figures?',
    a: 'Yes — these are the same tables (4D1A, 4D2A, 4E1A, 4E2A, and the Table 4B1 / 4C1 correction factors) that drive the calculator on this site, transcribed from BS7671:2018 Amendment 2. Always verify against your own copy of the Regulations for a signed-off design.',
  },
  {
    q: 'Why do I need to apply correction factors to the tabulated rating?',
    a: 'The tabulated current (It) assumes a 30°C ambient, no grouping, and no thermal insulation contact. Multiply It by Ca × Cg × Ci × Cc to get the actual current-carrying capacity (Iz) for your installation, then check Iz ≥ In ≥ Ib.',
  },
  {
    q: 'Which table applies to aluminium conductors?',
    a: 'This page covers copper. Aluminium uses Tables 4D3A, 4D4A (PVC) and 4E3A, 4E4A (XLPE), with a minimum practical size of 16mm² — selectable in the full calculator.',
  },
  {
    q: 'What is reference method C?',
    a: 'Method C is a cable clipped direct to a wall or surface — one of the most common domestic and commercial installation methods, and usually the highest-rated non-buried, non-enclosed method for a given size.',
  },
]

export default function Bs7671Tables() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'BS7671 current rating tables' }]}
      eyebrow="BS7671:2018+A2 · Appendix 4"
      title="BS7671 Cable Current Rating Tables"
      intro="Tabulated current-carrying capacities for PVC and XLPE copper cables, plus the ambient temperature and grouping correction factors, straight from BS7671:2018 Amendment 2 Appendix 4."
    >
      <nav className="toc" aria-label="Tables on this page">
        <a href="#table-4d1a">Table 4D1A</a>
        <a href="#table-4d2a">Table 4D2A</a>
        <a href="#table-4e1a">Table 4E1A</a>
        <a href="#table-4e2a">Table 4E2A</a>
        <a href="#correction-factors">Correction factors</a>
      </nav>

      <article className="article">
        <p>
          Every cable size shown by this calculator traces back to one of these tables. The
          tabulated rating <code>It</code> is the maximum current a cable can carry
          continuously at a 30°C ambient, installed alone, with no thermal insulation contact.
          Real installations rarely match those exact conditions, so <code>It</code> gets
          corrected down (or occasionally up) before it can be compared against a protective
          device rating — see the correction factors section below.
        </p>

        <RatingTable
          id="table-4d1a"
          title="Table 4D1A — Multicore PVC, 70°C, copper"
          caption="2 or 3 loaded conductors, e.g. twin-and-earth, PVC/PVC multicore, PVC/SWA/PVC"
          rows={table4D1A}
        />
        <RatingTable
          id="table-4d2a"
          title="Table 4D2A — Single-core PVC, 70°C, copper"
          caption="In free air, reference methods E and F"
          rows={table4D2A}
        />
        <RatingTable
          id="table-4e1a"
          title="Table 4E1A — Multicore XLPE, 90°C, copper"
          caption="2 or 3 loaded conductors, e.g. XLPE/SWA/PVC, XLPE/LSZH"
          rows={table4E1A}
        />
        <RatingTable
          id="table-4e2a"
          title="Table 4E2A — Single-core XLPE, 90°C, copper"
          caption="In free air, reference methods E and F"
          rows={table4E2A}
        />

        <h2 id="correction-factors">Correction factors</h2>
        <p>
          Apply the relevant factors to the tabulated rating: <code>Iz = It × Ca × Cg × Ci × Cc</code>.
          A cable is compliant when <code>Iz</code> is at least equal to the protective
          device rating <code>In</code>, and <code>In</code> is at least equal to the design
          current <code>Ib</code>.
        </p>

        <h3>Table 4B1 — Ambient temperature factor Ca</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Correction applied when ambient temperature differs from the 30°C the tables assume</caption>
            <thead><tr><th>Ambient °C</th><th>PVC (70°C)</th><th>XLPE (90°C)</th></tr></thead>
            <tbody>
              {ambientTempFactors.map(r => (
                <tr key={r.temp}><td>{r.temp}</td><td>{r.pvc || '—'}</td><td>{r.xlpe}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Table 4C1 — Grouping factor Cg</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Correction applied when multiple circuits are grouped together (bunched, in a duct, or on a tray)</caption>
            <thead><tr><th>Circuits in group</th><th>Cg</th></tr></thead>
            <tbody>
              {groupingFactors.map(r => (
                <tr key={r.circuits}><td>{r.circuits}</td><td>{r.Cg.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Two further factors apply but aren't published as simple lookup tables here: <strong>Ci</strong>{' '}
          (thermal insulation contact — 1.00 with none, 0.75 touching on one side, 0.50 fully
          surrounded, per Regulation 523.9 / Table 52.2) and <strong>Cc</strong> (protective
          device — 1.00 for MCBs, MCCBs and RCDs, 0.725 for BS3036 semi-enclosed fuses).
        </p>
      </article>

      <div style={{ marginTop: 40 }}>
        <Faq items={FAQ_ITEMS} title="Reading the tables" />
      </div>

      <div className="related-pages">
        <Link to="/calculator">
          <div className="label">Tool</div>
          <div className="title">Run these tables through the full calculator →</div>
        </Link>
        <Link to="/guides/bs7671-cable-sizing-explained">
          <div className="label">Guide</div>
          <div className="title">BS7671 cable sizing, step by step →</div>
        </Link>
      </div>

      <Footer />
    </PageShell>
  )
}
