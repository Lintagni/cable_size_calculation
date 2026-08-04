import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import QuickCalculator from '../../components/public/QuickCalculator'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'

const FAQ_ITEMS = [
  {
    q: 'What is the maximum allowed voltage drop under BS7671?',
    a: 'BS7671 Section 525 sets 3% of nominal voltage for lighting circuits and 5% for other circuits, measured from the origin of the installation to the point of use, when supplied directly from a public low-voltage distribution network.',
  },
  {
    q: 'How is voltage drop calculated?',
    a: 'Voltage drop (V) = length (m) × design current Ib (A) × mV/A/m × 10⁻³, using the tabulated mV/A/m figure for the cable size, insulation and configuration from BS7671 Appendix 4. The result is checked against the percentage limit for the supply voltage.',
  },
  {
    q: 'Why does a cable that passes the current rating check still fail on voltage drop?',
    a: 'Current rating and voltage drop are two independent checks. A cable can carry the design current comfortably (Iz well above In) while still dropping too much voltage over a long run, because voltage drop scales with length and current together, not with the margin on current rating.',
  },
  {
    q: 'Does voltage drop include the neutral conductor?',
    a: "The mV/A/m figures in BS7671 Appendix 4 already account for the full circuit (out and back for single-phase, or the relevant conductors for three-phase), so you don't add the neutral separately.",
  },
]

export default function VoltageDropCalculator() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Calculator', to: '/calculator' }, { label: 'Voltage drop' }]}
      eyebrow="BS7671:2018+A2 · Section 525"
      title="Voltage Drop Calculator"
      intro="Check cable voltage drop against the BS7671 Section 525 limits — 3% for lighting, 5% for other circuits — for any length, load and cable size."
    >
      <QuickCalculator
        preset={{ cableLength: 45, designCurrent: 20, deviceRating: 20, referenceMethod: 'C', phases: 1, voltage: 230, insulation: 'PVC' }}
        note="Preset for a 20A single-phase circuit over 45m. The voltage drop result below updates as you change length, current or cable size. This tool checks the 5% non-lighting limit — for a 3%-limited lighting circuit, use the full calculator."
      />

      <article className="article">
        <h2>How voltage drop is checked</h2>
        <p>
          Every conductor has resistance, so current flowing through it produces a voltage
          drop along its length. If that drop is too large, equipment at the far end
          receives a lower voltage than intended — motors run hot, lighting dims, and some
          equipment simply won't start reliably. BS7671 Section 525 limits this to{' '}
          <strong>3% of nominal voltage for lighting circuits</strong> and{' '}
          <strong>5% for other circuits</strong>, when supplied directly from a public
          low-voltage network.
        </p>

        <h3>The calculation</h3>
        <p>
          BS7671 Appendix 4 publishes a millivolt-drop-per-amp-per-metre (mV/A/m) figure
          for every cable size, insulation type and configuration. Voltage drop in volts is:
        </p>
        <p><code>V = (Length × Ib × mV/A/m) / 1000</code></p>
        <p>
          divided by the number of parallel cable sets if more than one is run per phase.
          That figure is then expressed as a percentage of the nominal voltage and compared
          against the 3% or 5% limit.
        </p>

        <h3>Why longer runs need larger cable even when current rating is satisfied</h3>
        <p>
          Voltage drop scales with length, but current-carrying capacity doesn't. A cable
          sized purely on current rating for a 5m run can be badly undersized for the same
          load at 40m — the load hasn't changed, but the accumulated resistive drop has.
          This is the single most common reason a cable that "should" work on paper fails
          a full BS7671 check, and it's why sub-main and outbuilding circuits — garages, EV
          chargers, garden rooms — are so often limited by voltage drop rather than by how
          much current the cable can physically carry.
        </p>

        <h3>Worked example</h3>
        <p>
          The preset loaded in the calculator above — a 20A single-phase circuit, PVC
          twin-and-earth, method C, 45m from the consumer unit — returns a minimum
          compliant size of 4mm², at 4.30% voltage drop against the 5% limit (11.5V of
          230V). 2.5mm² already carries 20A comfortably on current rating alone (its
          tabulated rating under method C is 27A), so it's the voltage drop over the 45m
          run that pushes the result up to 4mm². This is a non-lighting circuit at the 5%
          limit — a lighting circuit at the tighter 3% limit would need an even larger
          cable over the same run. Enter your own circuit above to see the exact figures.
        </p>
      </article>

      <div style={{ marginTop: 40 }}>
        <Faq items={FAQ_ITEMS} />
      </div>

      <div className="related-pages">
        <Link to="/calculator/swa-armoured-cable-size">
          <div className="label">Calculator</div>
          <div className="title">SWA / armoured cable size →</div>
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
