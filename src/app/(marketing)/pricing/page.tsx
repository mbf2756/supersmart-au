'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Metadata } from 'next'

const PLANS = [
  {
    key: 'free', name: 'Essential', price: 0, period: '', description: 'Explore your super health',
    features: ['Super health score', 'APRA performance test lookup', 'Fee drag calculator', 'Division 296 basic exposure', 'Fund comparison (top 3)'],
    cta: 'Get started free', ctaVariant: 'ghost',
  },
  {
    key: 'optimiser', name: 'Optimiser', price: 149, period: '/year', description: 'Everything you need to optimise',
    features: ['Everything in Free', 'Carry-forward cap tracker', 'Salary sacrifice optimiser', 'Spouse contribution analysis', 'Full fund comparison table', 'Division 296 full modeller', 'Cap expiry email alerts', 'PDF annual check-up report', 'Saved calculations history'],
    cta: 'Start Optimiser', ctaVariant: 'teal', popular: true,
  },
  {
    key: 'retirement', name: 'Retirement Planner', price: 299, period: '/year', description: 'For those approaching retirement',
    features: ['Everything in Optimiser', 'Transfer Balance Cap planner', 'TTR strategy calculator', 'Age Pension means-test model', 'Drawdown sequencing risk tool', 'Couple / joint planning'],
    cta: 'Start Retirement Planner', ctaVariant: 'primary',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planKey: string) {
    if (planKey === 'free') { router.push('/signup'); return }
    setLoading(planKey)
    const priceId = planKey === 'optimiser'
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_OPTIMISER_YEARLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_RETIREMENT_YEARLY
    if (!priceId) { router.push('/signup'); return }
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan: planKey }),
    })
    const { url, error } = await res.json()
    if (error) { router.push('/login'); return }
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-surface py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="font-mono text-xs text-teal tracking-widest uppercase mb-3">Pricing</div>
          <h1 className="text-4xl font-semibold text-navy mb-3 tracking-tight">Clear pricing, no surprises</h1>
          <p className="text-navy/60 text-lg">All plans include a general advice disclaimer. No financial advice — just powerful modelling tools.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.key} className={`bg-white rounded-2xl p-7 border relative ${plan.popular ? 'border-teal shadow-lg shadow-teal/10 ring-1 ring-teal/20' : 'border-black/10'}`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal text-navy text-xs font-bold px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-navy mb-1">{plan.name}</h2>
                <p className="text-sm text-navy/50 mb-3">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-medium text-navy">${plan.price}</span>
                  <span className="text-navy/40 text-sm">{plan.period}</span>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={loading === plan.key}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all disabled:opacity-60 ${
                  plan.ctaVariant === 'teal' ? 'bg-teal text-navy hover:bg-teal-dim' :
                  plan.ctaVariant === 'primary' ? 'bg-navy text-white hover:bg-navy-mid' :
                  'border border-black/10 text-navy hover:bg-surface'
                }`}
              >
                {loading === plan.key ? 'Loading…' : plan.cta}
              </button>
              <ul className="space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-navy/70">
                    <span className="text-teal mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-black/10 p-6 text-center">
          <h3 className="font-semibold text-navy mb-2">SMSF Analytics Add-on</h3>
          <p className="text-sm text-navy/60 mb-3">ETF overlap detection, TBAR deadlines, minimum pension tracking. Add to any paid plan.</p>
          <div className="font-mono text-2xl font-medium text-navy mb-4">+$199<span className="text-sm text-navy/40 font-sans">/year</span></div>
          <p className="text-xs text-navy/40">Add during checkout or from your Settings page</p>
        </div>

        <p className="text-center text-xs text-navy/40 mt-8 leading-relaxed max-w-lg mx-auto">
          All plans provide general financial information and modelling only. SuperSmart AU does not provide financial advice. Always consider whether information is appropriate for your personal circumstances.
        </p>
      </div>
    </div>
  )
}
