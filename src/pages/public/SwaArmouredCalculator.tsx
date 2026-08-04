import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import QuickCalculator from '../../components/public/QuickCalculator'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'
import type { RefMethod } from '../../calculators/lvCableSizing'

const METHODS: RefMethod[] = ['C', 'D1', 'D2', 'B2']

const FAQ_ITEMS = [
  {
    q: 'Does the steel armour itself affect the current rating?',
    a: "BS7671 Appendix 4 doesn't publish a separate table for armoured versus unarmoured cable — SWA (PVC/SWA/PVC to BS6346, or XLPE/SWA/PVC to BS5467) is rated using the same general multicore tables as any other cable of that insulation type, under whichever reference method matches how it's actually installed. Method C (clipped direct) and D1/D2 (in duct or direct buried) are the two most common for SWA runs.",
  },
  {
    q: 'What size SWA cable do I need for a garage or outbuilding supply?',
    a: "It depends on the load, run length and installation method — there is no single correct answer. A 32A radial run of 20-30m in XLPE/SWA/PVC clipped direct (method C) commonly comes out at 6mm², but longer runs are frequently limited by voltage drop rather than current rating and need 10mm² or larger. Run your actual numbers through the calculator above.",
  },
  {
    q: 'Do I need to correct for grouping if the SWA cable is buried alone in a duct?',
    a: 'No — Cg (grouping factor) only applies when circuits share a duct, tray or trench with other loaded cables. A single SWA cable in its own duct uses Cg = 1.00.',
  },
  {
    q: 'Should I use XLPE or PVC armoured cable?',
    a: 'XLPE (90°C, e.g. BS5467) carries more current than PVC (70°C, e.g. BS6346) at the same size, so it can sometimes save a size on long or heavily grouped runs. PVC is cheaper and more common for shorter domestic sub-mains. The calculator lets you compare both directly.',
  },
]

export default function SwaArmouredCalculator() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Calculator', to: '/calculator' }, { label: 'SWA / armoured cable' }]}
      eyebrow="BS7671:2018+A2"
      title="SWA & Armoured Cable Size Calculator"
      intro="Size steel wire armoured (SWA) cable to BS7671 — current rating, correction factors and voltage drop, for PVC or XLPE, clipped direct or buried."
    >
      <QuickCalculator
        preset={{ referenceMethod: 'C', insulation: 'XLPE', deviceRating: 32, designCurrent: 32, cableLength: 40, phases: 1, voltage: 230 }}
        methods={METHODS}
        note="Preset for a 32A single-phase sub-main, XLPE/SWA/PVC, clipped direct (method C), 40m run. Change any field to match your installation."
      />

      <article className="article">
        <h2>How SWA cable is sized to BS7671</h2>
        <p>
          Steel wire armoured cable — PVC/SWA/PVC to BS6346 or XLPE/SWA/PVC to BS5467 — is
          sized the same way as any other multicore cable in BS7671 Appendix 4. The armour
          provides mechanical protection and can serve as a circuit protective conductor; it
          doesn't get its own current-rating table. What matters for sizing is the conductor
          material, the insulation type (PVC 70°C or XLPE 90°C), and the installation
          method — most commonly <strong>method C</strong> (clipped direct to a wall, tray or
          surface) or <strong>method D1/D2</strong> (in a buried duct, or direct buried).
        </p>

        <h3>The sizing sequence</h3>
        <ol>
          <li><strong>Design current Ib</strong> — the actual load current the circuit will carry.</li>
          <li><strong>Device rating In</strong> — the MCB, MCCB or fuse protecting the circuit; In ≥ Ib.</li>
          <li><strong>Tabulated rating It</strong> — read from Appendix 4 for the insulation, configuration and installation method.</li>
          <li><strong>Correction factors</strong> — Ca (ambient temperature), Cg (grouping with other circuits), Ci (thermal insulation contact) and Cc (protective device type) are multiplied together and applied to It to get Iz, the actual current-carrying capacity.</li>
          <li><strong>Compliance check</strong> — Iz must be ≥ In, and the voltage drop over the cable run must sit within the 5% limit in BS7671 Section 525 for non-lighting circuits (3% for lighting).</li>
        </ol>

        <h3>Why voltage drop often decides the size, not current rating</h3>
        <p>
          SWA cable is frequently used for longer sub-main and outbuilding runs — garages,
          workshops, garden offices, EV chargers. On a 25–40m run, the cable size needed to
          keep voltage drop within the Section 525 limit is often larger than the size the
          current rating alone would require. Always check both, which is exactly what the
          calculator above does in one pass.
        </p>

        <h3>Worked example</h3>
        <p>
          The preset loaded in the calculator above — a 32A single-phase radial circuit,
          XLPE/SWA/PVC, clipped direct (method C), 40m run, 30°C ambient, no grouping, no
          thermal insulation — returns a minimum compliant size of 6mm², at 4.06% voltage
          drop against the 5% limit. 4mm² already carries the current comfortably (its
          tabulated rating is 42A, well over the 32A design current), so it's the voltage
          drop check over the 40m run that pushes the result up to 6mm², not the current
          rating. Shorten the run in the calculator above and watch the recommended size
          drop back down once voltage drop stops being the binding constraint.
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
        <Link to="/tables/bs7671-cable-current-rating-tables">
          <div className="label">Reference</div>
          <div className="title">Full BS7671 current rating tables →</div>
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
