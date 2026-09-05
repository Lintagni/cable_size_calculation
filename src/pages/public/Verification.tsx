import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import Footer from '../../components/Footer'
import WorkedExample from '../../components/public/WorkedExample'
import type { LvCableInput } from '../../calculators/lvCableSizing'

/**
 * Worked examples with every step exposed.
 *
 * The numbers are computed by the live engine when this page renders (at build
 * time for the prerendered copy), so a published example cannot drift from what
 * the calculator does. Deliberately makes a reproducibility claim, not a
 * certification claim — see the caveat section.
 */

const BASE: Omit<LvCableInput, 'designCurrent' | 'deviceRating' | 'cableLength' | 'referenceMethod' | 'insulation' | 'phases' | 'voltage'> = {
  description: '',
  origin: '',
  destination: '',
  frequency: 50,
  powerFactor: 0.85,
  protectiveDevice: 'MCB',
  cableConfig: 'multicore',
  parallelCircuits: 1,
  ambientTemp: 30,
  groupedCircuits: 1,
  thermalInsulation: 'none',
  conductorMaterial: 'copper',
}

export default function Verification() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Verification' }]}
      eyebrow="Evidence"
      title="Worked Examples, Checked Step by Step"
      intro="Five cases run through the live engine with every intermediate figure printed, so each step can be checked against your own copy of BS7671."
    >
      <article className="article">
        <h2>What this page is, and is not</h2>
        <p>
          Every number below is produced by the same calculation engine the site's calculators
          use, at the moment this page is built. Nothing is transcribed by hand, so an example
          here cannot quietly disagree with what the calculator returns.
        </p>
        <p>
          <strong>This is a reproducibility claim, not a certification claim.</strong> No
          independent third party has audited the engine. What the page gives you is every
          intermediate value — the table row, each correction factor, the derated capacity,
          the mV/A/m figure and the drop — laid out so you can check each step against
          BS7671:2018+A2 yourself in a couple of minutes. That is a stronger basis for trust
          than a badge, and it is an honest description of where the tool actually stands.
        </p>
        <p>
          If you find a discrepancy, it is a bug and we want to know:{' '}
          the feedback button on any page reaches us directly.{' '}
          <Link to="/methodology">How CableCalc calculates</Link> sets out the scope and the
          deliberate exclusions.
        </p>
      </article>

      <div className="worked-examples">
        <WorkedExample
          id="ex-1"
          title="1 · Domestic radial circuit"
          brief="32 A radial in thermoplastic (PVC), clipped direct, 20 m. The simplest case there is — current rating decides it and voltage drop is nowhere near the limit. Note this is a radial: BS7671 treats ring final circuits as a special case, which this engine does not model."
          table="4D1A"
          input={{ ...BASE, phases: 1, voltage: 230, designCurrent: 32, deviceRating: 32, cableLength: 20, referenceMethod: 'C', insulation: 'PVC' }}
        />

        <WorkedExample
          id="ex-2"
          title="2 · Long run where voltage drop decides"
          brief="A 10.5 kW shower drawing about 46 A on a 50 A device, 60 m from the board. Current rating alone would allow a smaller cable — watch the 10 mm² row get rejected on drop, not capacity."
          table="4D1A"
          input={{ ...BASE, phases: 1, voltage: 230, designCurrent: 46, deviceRating: 50, cableLength: 60, referenceMethod: 'C', insulation: 'PVC' }}
        />

        <WorkedExample
          id="ex-3"
          title="3 · Six circuits sharing a tray"
          brief="A 40 A three-phase circuit as one of six on a shared tray. Grouping costs it two sizes: run on its own the same circuit sizes at 4 mm², because Cg goes from 1.00 to 0.57."
          table="4E1A"
          input={{ ...BASE, phases: 3, voltage: 400, designCurrent: 40, deviceRating: 40, cableLength: 30, referenceMethod: 'C', insulation: 'XLPE', groupedCircuits: 6 }}
        />

        <WorkedExample
          id="ex-4"
          title="4 · Sub-main in trunking"
          brief="63 A three-phase XLPE multicore in trunking on a wall (method B2), 45 m, protected by an MCCB. A typical sub-main to a secondary board."
          table="4E1A"
          input={{ ...BASE, phases: 3, voltage: 400, designCurrent: 63, deviceRating: 63, cableLength: 45, referenceMethod: 'B', insulation: 'XLPE', protectiveDevice: 'MCCB' }}
        />

        <WorkedExample
          id="ex-5"
          title="5 · High ambient temperature"
          brief="100 A three-phase in a 50 °C plant room. Ca = 0.82 costs a full conductor size: the same circuit at 30 °C sizes at 25 mm², but at 50 °C that size derates to Iz = 97.6 A — below the 100 A device — so it steps up to 35 mm²."
          table="4E1A"
          input={{ ...BASE, phases: 3, voltage: 400, designCurrent: 100, deviceRating: 100, cableLength: 25, referenceMethod: 'C', insulation: 'XLPE', ambientTemp: 50, protectiveDevice: 'MCCB' }}
        />
      </div>

      <article className="article">
        <h2>How to check one of these</h2>
        <ol>
          <li>
            Open BS7671:2018+A2 at the Appendix 4 table named in the example and find the row
            for the selected size. The column is the reference method. That is I<sub>t</sub>.
          </li>
          <li>
            Check C<sub>a</sub> against Table 4B1 for the stated ambient and insulation type,
            and C<sub>g</sub> against Table 4C1 for the number of grouped circuits.
          </li>
          <li>
            Multiply: I<sub>t</sub> × the combined factor should give the I<sub>z</sub> shown,
            and it must be at least I<sub>n</sub>.
          </li>
          <li>
            Take the mV/A/m figure for that size from the voltage drop column of the same
            appendix, multiply by I<sub>b</sub> and the route length, divide by 1000, and
            compare with the drop shown.
          </li>
        </ol>
        <p>
          If every step matches, the engine is doing exactly what the standard says for that
          case. Run your own numbers on the{' '}
          <Link to="/calculator">calculator</Link> — it shows the same intermediate values for
          any circuit you enter.
        </p>
      </article>

      <div className="related-pages">
        <Link to="/methodology">
          <div className="label">Methodology</div>
          <div className="title">Standard, scope and exclusions →</div>
        </Link>
        <Link to="/tables/bs7671-cable-current-rating-tables">
          <div className="label">Reference</div>
          <div className="title">The Appendix 4 tables in full →</div>
        </Link>
        <Link to="/calculator">
          <div className="label">Tool</div>
          <div className="title">Run your own circuit →</div>
        </Link>
      </div>

      <Footer />
    </PageShell>
  )
}
