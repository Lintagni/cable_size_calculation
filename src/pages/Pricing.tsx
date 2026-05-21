import { CheckCircle, X, Sparkles } from 'lucide-react'
import { usePlanStore } from '../store/planStore'

const tiers = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    description: 'For occasional use and exploring the tool.',
    cta: 'Get Started',
    ctaStyle: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
    planValue: 'free' as const,
    features: [
      { label: 'LV cable sizing (5/day)',           included: true  },
      { label: 'Voltage drop check',                included: true  },
      { label: 'AI circuit assistant (10/month)',   included: true  },
      { label: 'Calculation history (last 5)',      included: true  },
      { label: 'Short circuit calculation',         included: false },
      { label: 'Motor cable sizing',                included: false },
      { label: 'Aluminium cable sizing',            included: false },
      { label: 'PDF report export',                 included: false },
      { label: 'ABC cable calculator',              included: false },
      { label: 'Busbar sizing',                     included: false },
    ],
  },
  {
    name: 'Pro',
    price: '£9.99',
    period: '/month',
    description: 'For practising engineers who need the full BS7671 toolset.',
    cta: 'Start Free Trial',
    ctaStyle: 'bg-blue-700 text-white hover:bg-blue-800',
    highlight: true,
    planValue: 'pro' as const,
    badge: 'Most Popular',
    badgeStyle: 'bg-blue-700 text-white',
    features: [
      { label: 'LV cable sizing (unlimited)',       included: true  },
      { label: 'Voltage drop check',                included: true  },
      { label: 'AI circuit assistant (200/month)',  included: true  },
      { label: 'Calculation history (unlimited)',   included: true  },
      { label: 'Short circuit calculation',         included: true  },
      { label: 'Motor cable sizing',                included: true  },
      { label: 'Aluminium cable sizing',            included: true  },
      { label: 'PDF report export',                 included: true  },
      { label: 'ABC cable calculator',              included: false },
      { label: 'Busbar sizing',                     included: false },
    ],
  },
  {
    name: 'Business',
    price: '£29.99',
    period: '/month',
    description: 'For design firms and consultancies needing every tool.',
    cta: 'Contact Sales',
    ctaStyle: 'bg-purple-700 text-white hover:bg-purple-800',
    planValue: 'business' as const,
    badge: 'Full Suite',
    badgeStyle: 'bg-purple-700 text-white',
    features: [
      { label: 'Everything in Pro',                    included: true  },
      { label: 'AI circuit assistant (2,000 credits/mo)', included: true  },
      { label: 'ABC cable calculator (NFC 33-209)',     included: true  },
      { label: 'Busbar sizing (Cu & Al)',               included: true  },
      { label: 'Multi-user team access',               included: true  },
      { label: 'API access',                           included: true  },
      { label: 'Priority support',                     included: true  },
      { label: 'Custom branding on reports',           included: true  },
      { label: '',                                     included: false, spacer: true },
      { label: '',                                     included: false, spacer: true },
    ],
  },
]

export default function Pricing() {
  const { setPlan } = usePlanStore()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Start free. Upgrade when you need the full toolkit.
        </p>
      </div>

      {/* AI quota comparison strip */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          AI Circuit Assistant credits per month:
        </div>
        <div className="flex items-center gap-8">
          <div>
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">10</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Free</div>
          </div>
          <div className="text-gray-300 dark:text-gray-700">→</div>
          <div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">200</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pro</div>
          </div>
          <div className="text-gray-300 dark:text-gray-700">→</div>
          <div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">2000</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Business</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map(tier => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-8 relative flex flex-col ${
              tier.name === 'Business'
                ? 'border-purple-400 dark:border-purple-700 shadow-lg shadow-purple-100 dark:shadow-purple-900/30'
                : tier.highlight
                  ? 'border-blue-500 dark:border-blue-600 shadow-lg shadow-blue-100 dark:shadow-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-800`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`${tier.badgeStyle} text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap`}>
                  {tier.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{tier.name}</h2>
                {tier.name === 'Pro' && <Sparkles className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{tier.period}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{tier.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((f, i) => f.spacer ? (
                <li key={i} className="h-5" />
              ) : (
                <li key={f.label} className="flex items-center gap-3 text-sm">
                  {f.included
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <X className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  }
                  <span className={f.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setPlan(tier.planValue)}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${tier.ctaStyle}`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8">
        All prices ex-VAT. Cancel anytime. 7-day free trial on Pro and Business.
      </p>
    </div>
  )
}
