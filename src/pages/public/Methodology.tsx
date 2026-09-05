import { Link } from 'react-router-dom'
import PageShell from '../../components/public/PageShell'
import Footer from '../../components/Footer'
import Faq from '../../components/public/Faq'
import { STANDARD_CSA_SIZES } from '../../data/cableTables'
import { AP4_TABLES } from '../../data/appendix4'
import { ambientTempFactors, groupingFactors } from '../../data/correctionFactors'

/**
 * "How this is calculated" — the trust page.
 *
 * A calculator asking professionals for money has to say what standard it
 * implements, what it covers, and — more importantly — what it does not.
 * The counts below are read from the live data files so this page cannot claim
 * coverage the engine does not have.
 */

const METHOD_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

/** Read straight off the live data so this page can't claim coverage it lacks. */
const TABLES = AP4_TABLES.map(t => ({
  id: t.id,
  label: t.title,
  rows: t.rows,
  methods: METHOD_KEYS.filter(k => t.rows.some(r => r.ratings[k])),
}))

const FAQ_ITEMS = [
  {
    q: 'Which edition of BS7671 does the engine implement?',
    a: 'BS7671:2018+A2 — the IET Wiring Regulations 18th Edition incorporating Amendment 2 (2022). Current ratings come from Appendix 4, voltage drop from Section 525 and Table 4Ab, and correction factors from Tables 4B1, 4C1 and 52.2.',
  },
  {
    q: 'Has the engine been independently verified against the standard?',
    a: 'No independent third party has certified it. The tables are transcribed from BS7671:2018+A2 Appendix 4 and the worked examples on the verification page are produced by the live engine with every arithmetic step shown, so you can check each step against your own copy of the standard. That is a reproducibility claim, not a certification claim, and we would rather state it plainly than imply more.',
  },
  {
    q: 'What is deliberately not implemented?',
a: 'Aluminium conductors — the 4H and 4J series tables are not yet transcribed, so the calculator sizes copper only. Ring final circuits are sized as radials. Also excluded: harmonic derating for triplen-heavy loads, soil thermal resistivity other than the Appendix 4 default, mineral-insulated cable, circuits over 1000 V, and any discrimination or earth fault loop impedance study. Where a case falls outside the implemented scope the calculator says so rather than returning an approximate answer.',
  },
  {
    q: 'Does it replace a competent designer?',
    a: 'No, and it is not intended to. It performs the Appendix 4 selection arithmetic quickly and shows its working. Choosing the installation method, establishing the design current after diversity, confirming the ambient temperature and deciding what is grouped with what all remain design decisions. The designer signing the certificate remains responsible under BS7671.',
  },
  {
    q: 'Where does the data actually live?',
    a: 'In the application source, and mirrored to a database that the app loads at start-up so corrections can be applied without a redeploy. The published reference tables on this site render from the same arrays the calculator reads, so what you see and what it computes cannot drift apart.',
  },
]

export default function Methodology() {
  return (
    <PageShell
      crumbs={[{ label: 'Home', to: '/' }, { label: 'How it calculates' }]}
      eyebrow="Methodology"
      title="How CableCalc Calculates"
      intro="The standard it implements, the tables it reads, the arithmetic it performs — and, just as importantly, what it deliberately leaves out."
    >
      <article className="article">
        <h2>The standard</h2>
        <p>
          The engine implements <strong>BS7671:2018+A2</strong> — the IET Wiring Regulations
          18th Edition incorporating Amendment 2, published 2022. Three parts of it do the work:
        </p>
        <ul>
          <li>
            <strong>Appendix 4</strong> — current-carrying capacity tables and the mV/A/m
            voltage drop columns.
          </li>
          <li>
            <strong>Regulation 433.1.1</strong> — the coordination requirement
            I<sub>b</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub> that the size must satisfy.
          </li>
          <li>
            <strong>Section 525</strong> — the voltage drop limits, 3% for lighting and 5% for
            everything else, measured from the origin of the installation.
          </li>
        </ul>

        <h2>Tables implemented</h2>
        <p>
          Eight current-rating tables are loaded, covering both conductor materials, both
          insulation types and both cable configurations. Row counts and available reference
          methods are read from the live data, so this table cannot overstate what is
          actually there:
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>BS7671 Appendix 4 current-rating tables implemented</caption>
            <thead>
              <tr><th>Table</th><th style={{ textAlign: 'left' }}>Covers</th><th>Sizes</th><th>Methods</th></tr>
            </thead>
            <tbody>
              {TABLES.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td style={{ textAlign: 'left' }}>{t.label}</td>
                  <td>{t.rows.length}</td>
                  <td>{t.methods.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Selection steps through the sizes each table publishes (copper, 1 mm² to{' '}
          {STANDARD_CSA_SIZES.at(-1)} mm²), in order, taking the first that passes both
          checks. Every method has two columns — one two-core cable on single phase, one
          three- or four-core cable on three phase — and the calculator reads the column
          matching the phase count you enter. Correction factors come from{' '}
          {ambientTempFactors.length} ambient temperature rows (Table 4B1) and{' '}
          {groupingFactors.length} grouping rows (Table 4C1); ambient temperatures between
          tabulated points are linearly interpolated.
        </p>

        <h2>The arithmetic</h2>
        <p>For each candidate size, in this order:</p>
        <ol>
          <li>
            Read the tabulated rating I<sub>t</sub> from the table and column matching the
            conductor, insulation, configuration and reference method.
          </li>
          <li>
            Compute the combined correction factor
            C<sub>a</sub> × C<sub>g</sub> × C<sub>i</sub> × C<sub>c</sub>.
          </li>
          <li>
            Derate: I<sub>z</sub> = I<sub>t</sub> × combined factor × parallel circuits.
            Accept on capacity when I<sub>z</sub> ≥ I<sub>n</sub>.
          </li>
          <li>
            Compute voltage drop from the mV/A/m figure for that size:
            V<sub>d</sub> = mV/A/m × I<sub>b</sub> × L ÷ 1000. Accept when V<sub>d</sub> is
            within the Section 525 limit.
          </li>
          <li>Take the first size that passes both. If none does, report why.</li>
        </ol>
        <p>
          The <Link to="/verification">verification page</Link> runs this sequence on real
          cases with every intermediate number printed, so each step can be checked against
          your own copy of the standard.
        </p>

        <h2>What is not implemented</h2>
        <p>
          Being specific about the boundary matters more than the feature list. The engine
          does <strong>not</strong> cover:
        </p>
        <ul>
          <li>
            <strong>Aluminium conductors.</strong> The Appendix 4 aluminium tables (the 4H
            and 4J series) have not been transcribed yet, so the calculator sizes copper
            only. Earlier versions of this site did offer aluminium, but the figures sat
            under table IDs belonging to armoured copper and were not trustworthy, so the
            option has been withdrawn rather than left in place. This is the largest
            outstanding gap.
          </li>
          <li>
            <strong>Single-core free-air arrangements.</strong> Method F is read from the
            touching columns — two cables flat for single phase, three cables trefoil for
            three phase, the lower of the published pair. The "spaced by one diameter"
            columns and their horizontal/vertical split are not modelled.
          </li>
          <li>
            <strong>Ring final circuits.</strong> Sized as radials. BS7671 treats a ring as a
            special case fed from both ends; the engine does not model that, so a ring
            entered here will size larger than the regulations require.
          </li>
          <li>Harmonic derating for loads with significant triplen content.</li>
          <li>Soil thermal resistivity other than the Appendix 4 default for buried methods.</li>
          <li>Mineral-insulated cable, and any cable type outside Tables 4D/4E.</li>
          <li>Circuits above 1000 V AC.</li>
          <li>
            Earth fault loop impedance, disconnection times, discrimination and selectivity
            studies. The adiabatic check in the full calculator sizes a conductor against a
            fault current you supply; it does not establish that fault current for you.
          </li>
          <li>Diversity. Design current is an input, not something the calculator derives.</li>
        </ul>

        <h2>Correction — September 2026</h2>
        <p>
          The rating data was re-transcribed from BS7671:2018+A2 on 5 September 2026 after
          three defects were found in the previous set. Table identities were wrong (multicore
          data sat under 4D1A, which is the single-core table; aluminium sat under
          4D3A/4D4A, which are armoured copper). Appendix 4's two columns per method — one
          two-core cable on single phase, one three- or four-core cable on three phase — had
          been collapsed into a single figure, so <strong>three-phase circuits were rated
          against the single-phase column and came out up to 15% optimistic</strong>. And no
          table carried the buried Method D columns, so buried runs could not be sized at all.
        </p>
        <p>
          All three are fixed. If you produced a three-phase design with this calculator
          before that date, re-run it — the corrected figures are more conservative and may
          call for a larger conductor. Buried and armoured cable (Tables 4D4A and 4E4A,
          Method D) now works for the first time.
        </p>

        <h2>Responsibility</h2>
        <p>
          This is a design aid. It performs the Appendix 4 selection arithmetic and shows its
          working so the result can be checked rather than trusted. Establishing the design
          current, choosing the installation method, confirming the ambient temperature and
          deciding what is grouped with what are all design decisions, and the person signing
          the certificate remains responsible for them under BS7671. Every report the
          calculator exports carries that statement and a space for the designer and checker.
        </p>
      </article>

      <div style={{ marginTop: 40 }}>
        <Faq items={FAQ_ITEMS} />
      </div>

      <div className="related-pages">
        <Link to="/verification">
          <div className="label">Evidence</div>
          <div className="title">Worked examples, step by step →</div>
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
