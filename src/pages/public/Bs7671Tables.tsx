import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import RatingTable from '../../components/public/RatingTable'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'
import { table4D1A, table4D2A, table4D4A, table4E1A, table4E2A, table4E4A } from '../../data/appendix4'
import { ambientTempFactors, groupingFactors } from '../../data/correctionFactors'

const FAQ_ITEMS = [
  {
    q: 'Are these the exact BS7671 Appendix 4 figures?',
    a: 'These are transcribed from BS7671:2018+A2 Appendix 4 and are the same arrays the calculator reads, so the published figures and the computed ones cannot diverge. They have not been independently audited by a third party, so verify against your own copy of the Regulations before signing off a design.',
  },
  {
    q: 'Why do I need to apply correction factors to the tabulated rating?',
    a: 'The tabulated current (It) assumes a 30°C ambient, no grouping, and no thermal insulation contact. Multiply It by Ca × Cg × Ci × Cc to get the actual current-carrying capacity (Iz) for your installation, then check Iz ≥ In ≥ Ib.',
  },
  {
    q: 'Which table applies to aluminium conductors?',
    a: 'Aluminium uses the 4H series (70 °C thermoplastic) and 4J series (90 °C thermosetting). Those tables are being transcribed and are not yet available, so the calculator currently sizes copper only. Note that 4D3A/4D4A and 4E3A/4E4A are ARMOURED COPPER tables, not aluminium — a mix-up this site previously made.',
  },
  {
    q: 'Why does each method have two columns?',
    a: 'Because BS7671 publishes two figures per method: one for a two-core cable on single-phase AC or DC, and a lower one for a three- or four-core cable on three-phase AC. Using the single-phase figure for a three-phase circuit overstates capacity by roughly 10-15%, so the calculator picks the column from the number of phases you enter.',
  },
]

export default function Bs7671Tables() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'BS7671 current rating tables' }]}
      eyebrow="BS7671:2018+A2 · Appendix 4"
      title="BS7671 Cable Current Rating Tables"
      intro="Tabulated current-carrying capacities for PVC and XLPE copper cable — plain, armoured and buried — plus the ambient temperature and grouping correction factors, from BS7671:2018+A2 Appendix 4."
    >
      <nav className="toc" aria-label="Tables on this page">
        <a href="#table-4d1a">4D1A</a>
        <a href="#table-4d2a">4D2A</a>
        <a href="#table-4d4a">4D4A</a>
        <a href="#table-4e1a">4E1A</a>
        <a href="#table-4e2a">4E2A</a>
        <a href="#table-4e4a">4E4A</a>
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
          table={table4D1A}
          caption="Single-core, non-armoured, with or without sheath — e.g. singles in conduit or trunking"
        />
        <RatingTable
          table={table4D2A}
          caption="Multicore, non-armoured — e.g. twin-and-earth, PVC/PVC multicore"
        />
        <RatingTable
          table={table4D4A}
          caption="Multicore armoured — PVC/SWA/PVC to BS6346. The buried Method D columns are published here"
        />
        <RatingTable
          table={table4E1A}
          caption="Single-core, non-armoured — 90 °C thermosetting singles"
        />
        <RatingTable
          table={table4E2A}
          caption="Multicore, non-armoured — e.g. XLPE/LSZH multicore"
        />
        <RatingTable
          table={table4E4A}
          caption="Multicore armoured — XLPE/SWA/PVC to BS5467. The buried Method D columns are published here"
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
