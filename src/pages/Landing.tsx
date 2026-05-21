import { Link } from 'react-router-dom'
import { Zap, Shield, FileText, Clock, CheckCircle } from 'lucide-react'

const features = [
  { icon: Zap, title: 'LV Cable Sizing', desc: 'Full BS7671:2018+A2 compliant sizing with correction factors Ca, Cg, Ci, Cc.' },
  { icon: Shield, title: 'Voltage Drop', desc: 'Instant check against Section 525 limits — 3% lighting, 5% other circuits.' },
  { icon: CheckCircle, title: 'Short Circuit', desc: 'IPSSC calculation and adiabatic cable withstand check per BS7671.' },
  { icon: FileText, title: 'PDF Reports', desc: 'Export professional cable schedule PDFs for inclusion in project documentation.' },
  { icon: Clock, title: 'Calculation History', desc: 'All your saved calculations in one place — searchable and re-openable.' },
  { icon: Shield, title: 'Motor Sizing', desc: 'Derive design current from motor kW, efficiency and power factor automatically.' },
]

export default function Landing() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <Shield className="w-4 h-4" />
          BS7671:2018 + Amendment 2 Compliant
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Cable Size Calculator<br />
          <span className="text-blue-700">built for electrical engineers</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          LV cable sizing, voltage drop checks, fault current analysis and professional PDF reports — all in one tool, grounded in BS7671.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/calculator"
            className="bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors text-lg"
          >
            Open Calculator
          </Link>
          <Link
            to="/pricing"
            className="text-gray-600 font-medium px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Everything you need on site</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculation preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Full BS7671 calculation chain</h2>
            <p className="text-gray-500 mb-6">
              Every calculation follows the exact methodology from BS7671 Appendix 4 — correction factors, voltage drop tables, adiabatic checks, and prospective fault current — the same workflow used in professional engineering calculation sheets.
            </p>
            <ul className="space-y-3">
              {[
                'Tables 4D1–4E5 current ratings encoded',
                'Ambient temperature Ca (Table 4B1)',
                'Grouping factor Cg (Table 4C1)',
                'Thermal insulation Ci (Table 52.2)',
                'mV/A/m voltage drop from Appendix 4',
                'Adiabatic check: S = (IF × √t) / K',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-sm font-mono">
            <div className="text-gray-400 mb-2">// Cable sizing result</div>
            <div className="text-green-400">✓ Selected: <span className="text-white">50mm² XLPE 4C</span></div>
            <div className="text-gray-300 mt-3">Ib = 98.4 A (design current)</div>
            <div className="text-gray-300">In = 100 A (MCCB rating)</div>
            <div className="text-gray-300">Iz = 112.8 A (derated rating)</div>
            <div className="text-gray-300 mt-3">Ca = 0.96  (40°C ambient)</div>
            <div className="text-gray-300">Cg = 1.00  (ungrouped)</div>
            <div className="text-gray-300">Ci = 1.00  (no insulation)</div>
            <div className="text-gray-300 mt-3">VD = 2.14 V (1.07%)</div>
            <div className="text-gray-300">Max = 20V (5.0%) ✓</div>
            <div className="text-green-400 mt-3">→ BS7671 Compliant</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Start sizing cables today</h2>
          <p className="text-blue-200 mb-8">Free tier includes unlimited LV cable sizing and voltage drop checks.</p>
          <Link
            to="/calculator"
            className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Open Calculator — Free
          </Link>
        </div>
      </section>
    </div>
  )
}
