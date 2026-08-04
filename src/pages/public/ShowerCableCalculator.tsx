import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import QuickCalculator from '../../components/public/QuickCalculator'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'
import type { RefMethod } from '../../calculators/lvCableSizing'

const METHODS: RefMethod[] = ['C', 'A1', 'A2', 'B1', 'B2']

const SHOWER_RATINGS = [
  { kw: 7.5, amps: 32.6 },
  { kw: 8.5, amps: 37.0 },
  { kw: 9.5, amps: 41.3 },
  { kw: 10.5, amps: 45.7 },
]

const FAQ_ITEMS = [
  {
    q: 'What cable size do I need for a 9.5kW electric shower?',
    a: "It depends on cable run length and installation method, so there is no single correct answer — that's exactly what the calculator solves. As a starting point, a 9.5kW shower draws about 41.3A, typically protected by a 45A device, on a dedicated radial circuit. Short runs (under ~10m) clipped direct often size at 6mm² T&E; longer runs frequently need 10mm² once voltage drop is checked. Enter your actual length and installation method above.",
  },
  {
    q: 'How do I convert shower kW to design current?',
    a: 'Electric showers are resistive loads on a single-phase 230V supply, so design current Ib = Power (W) / 230. A 9,500W shower draws 9500 / 230 ≈ 41.3A. This site\'s calculator lets you enter that current directly.',
  },
  {
    q: 'Does the shower circuit need RCD protection?',
    a: 'Yes — a shower is in a special location (BS7671 Section 701, bathrooms) and additionally most installations from 2008 onward require RCD protection for socket outlets and many fixed circuits under Regulation 411.3.3. This calculator checks cable sizing only; RCD/RCBO selection is a separate design step.',
  },
  {
    q: 'Why do two showers of the same kW sometimes need different cable sizes?',
    a: 'Because cable size depends on more than load: run length, installation method (clipped direct vs in insulation vs buried), ambient temperature and grouping with other circuits all change the correction factors applied to the tabulated rating, and voltage drop scales with length. Two 9.5kW showers with different cable runs can legitimately need different sizes.',
  },
]

export default function ShowerCableCalculator() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Calculator', to: '/calculator' }, { label: 'Shower cable size' }]}
      eyebrow="BS7671:2018+A2 · Section 701"
      title="Electric Shower Cable Size Calculator"
      intro="Size the cable for an electric shower circuit to BS7671 — current rating, correction factors and voltage drop, for any shower kW rating and run length."
    >
      <QuickCalculator
        preset={{ designCurrent: 41.3, deviceRating: 45, referenceMethod: 'C', cableLength: 12, phases: 1, voltage: 230 }}
        methods={METHODS}
        note="Preset for a common 9.5kW / 41.3A shower on a 45A device, method C, 12m run. Change the length and method to match your installation."
      />

      <article className="article">
        <h2>Sizing a shower circuit</h2>
        <p>
          Electric showers are single-phase, near-purely resistive loads, so the design
          current is simply the shower's power rating divided by 230V. A dedicated radial
          circuit then needs a protective device rated at or just above that current, and a
          cable sized to carry it — corrected for the actual installation conditions and
          checked for voltage drop, exactly as for any other circuit.
        </p>

        <h3>Common UK shower ratings and design current</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Ib = Power / 230V, single phase</caption>
            <thead><tr><th>Shower rating</th><th>Design current Ib</th></tr></thead>
            <tbody>
              {SHOWER_RATINGS.map(r => (
                <tr key={r.kw}><td>{r.kw} kW</td><td>{r.amps.toFixed(1)} A</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>What decides the final cable size</h3>
        <ul>
          <li><strong>Run length</strong> — from consumer unit to shower unit; longer runs need larger cable to stay within the 5% voltage drop limit.</li>
          <li><strong>Installation method</strong> — clipped direct (method C) rates higher than a cable buried in insulation (Ci correction) or run through a loft with other circuits (Cg correction).</li>
          <li><strong>Ambient temperature</strong> — a cable run through a warm loft space needs the Ca correction applied.</li>
        </ul>
        <p>
          This is why generic "9.5kW shower = X mm²" advice is unreliable — the load is
          fixed, but the three factors above are specific to your installation. Enter them
          into the calculator above for a result that's actually checked against your run,
          not a rule of thumb.
        </p>
      </article>

      <div style={{ marginTop: 40 }}>
        <Faq items={FAQ_ITEMS} />
      </div>

      <div className="related-pages">
        <Link to="/calculator/voltage-drop">
          <div className="label">Calculator</div>
          <div className="title">Voltage drop calculator →</div>
        </Link>
        <Link to="/guides/bs7671-cable-sizing-explained">
          <div className="label">Guide</div>
          <div className="title">BS7671 cable sizing, step by step →</div>
        </Link>
        <Link to="/calculator">
          <div className="label">Tool</div>
          <div className="title">Full calculator — fault current, PDF export →</div>
        </Link>
      </div>

      <Footer />
    </PageShell>
  )
}
