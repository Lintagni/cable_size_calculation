import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import QuickCalculator from '../../components/public/QuickCalculator'
import Faq from '../../components/public/Faq'
import Footer from '../../components/Footer'
import { REFERENCE_METHODS, supportedMethods } from '../../data/cableTables'
import { ambientTempFactors, groupingFactors } from '../../data/correctionFactors'
import type { RefMethod } from '../../calculators/lvCableSizing'

/**
 * The logged-out view of /calculator.
 *
 * This is the page anonymous visitors AND crawlers get; the full workspace
 * calculator (pages/Calculator.tsx) replaces it once a session exists. It is
 * deliberately SSR-safe — no zustand persist, no Supabase, no jspdf — so
 * scripts/prerender.mjs can bake it into dist/calculator/index.html.
 *
 * Before this existed /calculator had prerender:false, so the SPA catch-all
 * served it the prerendered homepage, canonical tag and all. Google was being
 * told the site's highest-impression URL was a duplicate of "/".
 */

const METHODS: RefMethod[] = ['C', 'B', 'A', 'E', 'F']

// The union of methods any loaded table can rate. Listing methods the data
// cannot serve would advertise coverage the engine does not have.
const SUPPORTED = [...new Set([
  ...supportedMethods('PVC', 'multicore'), ...supportedMethods('PVC', 'single-core'),
  ...supportedMethods('XLPE', 'multicore'), ...supportedMethods('XLPE', 'single-core'),
])]

const FAQ_ITEMS = [
  {
    q: 'Is this BS7671 cable calculator free to use?',
    a: 'Yes. LV cable sizing and the voltage drop check run in the browser with no account and no limit — the calculator on this page uses the same BS7671:2018+A2 engine as the paid product. A free account adds saved calculation history and the AI assistant; short circuit, motor cable, ABC and busbar sizing are paid tiers.',
  },
  {
    q: 'Which BS7671 tables does it use?',
    a: 'Appendix 4 current-carrying capacity tables 4D1A and 4D2A (70°C thermoplastic / PVC, single-core and multicore), 4E1A and 4E2A (90°C thermosetting / XLPE), the aluminium equivalents, and the matching mV/A/m voltage drop columns. Correction factors come from Tables 4B1 (ambient temperature), 4C1 (grouping) and 52.2 (thermal insulation).',
  },
  {
    q: 'What does "minimum compliant size" actually mean?',
    a: 'The smallest CSA in the relevant Appendix 4 table that satisfies both checks at once: derated capacity Iz ≥ the protective device rating In, and voltage drop within the Section 525 limit over your stated run length. If either check fails at a given size the calculator steps up until both pass.',
  },
  {
    q: 'Does it do fault current and adiabatic checks?',
    a: 'Not on this page — the adiabatic check S = (I × √t) / k needs a prospective fault current and a disconnection time, which are project-specific inputs. Those live in the short circuit tab of the full calculator, along with motor cable sizing, ABC overhead conductors, busbars and PDF report export.',
  },
  {
    q: 'Is a calculator result enough on its own for a design?',
    a: 'No. It gives you a compliant starting size fast and shows every intermediate figure so you can check the working, but the designer remains responsible for the design under BS7671. Verify the installation method, the assumed ambient temperature, grouping and any thermal insulation against the real installation.',
  },
  {
    q: 'Is this CableCalc BS7671 by Castline Systems?',
    a: 'No — unrelated. CableCalc BS7671 is a long-standing desktop application from Castline Systems. This site (cablecalc.org) is a separate browser-based BS7671 calculator with no connection to that product or company.',
  },
]

export default function PublicCalculator() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Calculator' }]}
      eyebrow="BS7671:2018+A2 · IET Wiring Regulations 18th Edition"
      title="BS7671 Cable Size Calculator"
      intro="Size LV cables to BS7671 Appendix 4 in the browser — tabulated rating, correction factors, derated capacity and voltage drop, checked in one pass. Free, no login."
    >
      <QuickCalculator
        preset={{ referenceMethod: 'C', insulation: 'XLPE', deviceRating: 63, designCurrent: 58, cableLength: 25, phases: 3, voltage: 400 }}
        methods={METHODS}
        note="Preset for a 63A three-phase sub-main, XLPE multicore, clipped direct (method C), 25m run, 30°C ambient. Change any field to match your circuit."
        cta={null}
      />

      <article className="article">
        <h2>What this calculator does</h2>
        <p>
          It runs the cable selection sequence in BS7671:2018+A2 for a single low-voltage
          circuit. You give it the design current, the protective device rating, how the
          cable is installed, how long the run is and the conditions around it; it returns
          the smallest conductor size that satisfies <strong>both</strong> the
          current-carrying capacity requirement of Regulation 433.1.1 and the voltage drop
          limit in Section 525 — and shows every intermediate number, so the result is
          checkable rather than a black box.
        </p>

        <h3>The sizing sequence, in order</h3>
        <ol>
          <li>
            <strong>Design current I<sub>b</sub></strong> — the current the circuit is
            actually intended to carry, after diversity.
          </li>
          <li>
            <strong>Device rating I<sub>n</sub></strong> — the MCB, MCCB or fuse protecting
            the circuit. Regulation 433.1.1 requires I<sub>n</sub> ≥ I<sub>b</sub>.
          </li>
          <li>
            <strong>Tabulated rating I<sub>t</sub></strong> — read from the Appendix 4 table
            matching the conductor material, insulation (70°C PVC or 90°C XLPE), cable
            configuration and installation reference method.
          </li>
          <li>
            <strong>Correction factors</strong> — C<sub>a</sub> for ambient temperature,
            C<sub>g</sub> for grouping, C<sub>i</sub> for contact with thermal insulation and
            C<sub>c</sub> for the protective device type. These multiply together and are
            applied to I<sub>t</sub>.
          </li>
          <li>
            <strong>Derated capacity I<sub>z</sub></strong> ={' '}
            I<sub>t</sub> × C<sub>a</sub> × C<sub>g</sub> × C<sub>i</sub> × C<sub>c</sub>.
            The cable complies on current rating when I<sub>z</sub> ≥ I<sub>n</sub>.
          </li>
          <li>
            <strong>Voltage drop</strong> — the mV/A/m figure for that size and cable type,
            multiplied by design current and route length, checked against 5% of nominal for
            general circuits (3% for lighting).
          </li>
        </ol>

        <h3>Why the answer is often bigger than the current rating suggests</h3>
        <p>
          On anything beyond a short run, voltage drop rather than current-carrying capacity
          is usually what fixes the size. A 4mm² cable comfortably carries 32A clipped direct,
          but over a long single-phase run it will breach the 5% limit and the compliant
          answer moves up a size. Both checks run on every candidate size here, so you can
          see which constraint is actually binding rather than sizing on current rating and
          discovering the problem later.
        </p>

        <h3>Installation reference methods</h3>
        <p>
          The reference method is the single input people most often get wrong, and it moves
          the tabulated rating more than anything else. These are the Appendix 4 methods the
          calculator supports:
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>BS7671 Appendix 4 installation reference methods</caption>
            <thead>
              <tr><th>Method</th><th style={{ textAlign: 'left' }}>Installation</th></tr>
            </thead>
            <tbody>
              {REFERENCE_METHODS.filter(m => SUPPORTED.includes(m.code)).map(m => (
                <tr key={m.code}>
                  <td>{m.code}</td>
                  <td style={{ textAlign: 'left' }}>{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Ambient temperature factors (C<sub>a</sub>)</h3>
        <p>
          Appendix 4 tabulated ratings assume 30°C ambient. Above that the cable carries less;
          below it, more. XLPE loses less than PVC because it runs to a 90°C conductor
          temperature rather than 70°C.
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Ambient temperature correction factor Ca — BS7671 Table 4B1</caption>
            <thead>
              <tr><th>Ambient °C</th><th>PVC (70°C)</th><th>XLPE (90°C)</th></tr>
            </thead>
            <tbody>
              {ambientTempFactors.map(f => (
                <tr key={f.temp}>
                  <td>{f.temp}</td>
                  <td>{f.pvc.toFixed(2)}</td>
                  <td>{f.xlpe.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Grouping factors (C<sub>g</sub>)</h3>
        <p>
          C<sub>g</sub> applies when the circuit shares a containment, tray or trench with
          other loaded circuits. A cable run on its own uses C<sub>g</sub> = 1.00. Grouping
          bites hard — six circuits bundled together cut the tabulated rating by roughly half.
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Grouping correction factor Cg — BS7671 Table 4C1</caption>
            <thead>
              <tr><th>Circuits in group</th><th>Cg</th></tr>
            </thead>
            <tbody>
              {groupingFactors.map(f => (
                <tr key={f.circuits}>
                  <td>{f.circuits}</td>
                  <td>{f.Cg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>What the calculator above does not cover</h3>
        <p>
          Fault current and the adiabatic check, motor cable sizing from kW, ABC overhead
          conductors, busbar sizing and PDF report export are part of the full workspace.
          Signing in is free and adds saved calculation history and the AI assistant on top
          of everything on this page.
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
        <Link to="/calculator/voltage-drop">
          <div className="label">Calculator</div>
          <div className="title">Voltage drop calculator →</div>
        </Link>
        <Link to="/calculator/shower-cable-size">
          <div className="label">Calculator</div>
          <div className="title">Electric shower cable size →</div>
        </Link>
        <Link to="/tables/bs7671-cable-current-rating-tables">
          <div className="label">Reference</div>
          <div className="title">Appendix 4 current rating tables →</div>
        </Link>
        <Link to="/guides/bs7671-cable-sizing-explained">
          <div className="label">Guide</div>
          <div className="title">BS7671 cable sizing explained →</div>
        </Link>
        <Link to="/pricing">
          <div className="label">Plans</div>
          <div className="title">Short circuit, motor, busbar →</div>
        </Link>
      </div>

      <Footer />
    </PageShell>
  )
}
