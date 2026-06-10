'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FREE_FEATURES = [
  { label: 'Super health score (5 dimensions)', included: true },
  { label: 'Fee analyser with 20-year projection', included: true },
  { label: 'Fund comparison — like-for-like', included: true },
  { label: 'Contributions overview', included: true },
  { label: 'APRA performance test status', included: true },
  { label: 'Basic Division 296 exposure check', included: true },
]

const PAID_FEATURES = [
  { label: 'Everything in Free', included: true, highlight: false },
  { label: 'Carry-forward concessional cap tracker', included: true, highlight: true },
  { label: 'Salary sacrifice optimiser + tax saving', included: true, highlight: true },
  { label: 'Division 296 full modeller ($3M threshold)', included: true, highlight: true },
  { label: 'Model ETF portfolios (Choiceplus, Member Direct, SMSF)', included: true, highlight: true },
  { label: 'Spouse analysis — tax offset + balance equalisation', included: true, highlight: false },
  { label: 'SMSF analytics — ETF overlap, TBAR, min. pension', included: true, highlight: false },
  { label: 'Annual cap expiry email alerts', included: true, highlight: true },
  { label: 'APRA results email digest (October each year)', included: true, highlight: false },
  { label: 'Saved calculations history', included: true, highlight: false },
]

const FAQ = [
  { q: 'Can I try before buying?', a: 'Yes — the Free tier includes the health score, fee analyser, and fund comparison with no time limit. Upgrade when you\'re ready to take action.' },
  { q: 'How is my profile data protected?', a: 'Your core financial details (salary, balance, fund) are locked to your account after first save. This ensures calculations are always personal to you. We never sell your data.' },
  { q: 'Is this financial advice?', a: 'No. SmartSuper AU is a modelling and educational tool. All calculations are illustrative estimates based on the information you enter and publicly available fund data. We always recommend consulting a licensed financial adviser before making major decisions.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel via your account settings at any time. You\'ll retain access until the end of your billing period.' },
  { q: 'Does my spouse need a separate account?', a: 'Yes — each person\'s super is unique. A separate account gives your spouse their own personalised health score, fee analysis, and action plan.' },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_OPTIMISER_YEARLY
    if (!priceId) { router.push('/login?redirectTo=/pricing'); return }
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan: 'optimiser' }),
    })
    const { url, error } = await res.json()
    if (error) { router.push('/login?redirectTo=/pricing'); return }
    window.location.href = url
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', padding: '60px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#00D4AA', marginBottom: 12 }}>
            Pricing
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 600, color: '#0F1E3C', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(15,30,60,0.55)', maxWidth: 480, margin: '0 auto' }}>
            Free tools to understand your super. One subscription to optimise it.
          </p>
        </div>

        {/* Two plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 64, maxWidth: 760, margin: '0 auto 64px' }}>

          {/* Free */}
          <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(15,30,60,0.1)' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Free</h2>
              <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginBottom: 20 }}>Understand your super health</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 500, color: '#0F1E3C' }}>$0</span>
                <span style={{ fontSize: 14, color: 'rgba(15,30,60,0.4)' }}>forever</span>
              </div>
            </div>
            <button onClick={() => router.push('/signup')}
              style={{ width: '100%', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#0F1E3C', border: '1.5px solid rgba(15,30,60,0.15)', marginBottom: 28 }}>
              Get started free
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FREE_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#00D4AA', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.5 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriber */}
          <div style={{ background: '#0F1E3C', borderRadius: 20, padding: '32px', border: 'none', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00D4AA', color: '#0F1E3C', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
              MOST POPULAR
            </div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 4 }}>Subscriber</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Take action and optimise</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 500, color: '#00D4AA' }}>$149</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/year</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Less than $3/week · Cancel anytime
              </div>
            </div>
            <button onClick={handleUpgrade} disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: '#00D4AA', color: '#0F1E3C', border: 'none', marginBottom: 28, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading…' : 'Start Subscriber plan'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAID_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: f.highlight ? '#00D4AA' : 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: f.highlight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)', fontWeight: f.highlight ? 500 : 400 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value proof bar */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px 32px', border: '1px solid rgba(15,30,60,0.08)', marginBottom: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginBottom: 20 }}>Why $149/year is a very easy decision</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { stat: '$85k+', desc: 'Extra at retirement from a 1% fee reduction over 40 years' },
              { stat: '$8,938', desc: 'Potential tax saving from using expiring carry-forward cap' },
              { stat: '84%', desc: 'Of active super funds underperform passive over 15 years' },
              { stat: '$344/yr', desc: 'Annual fee on $430k at Hostplus Indexed Shares — SmartSuper costs less' },
            ].map(item => (
              <div key={item.stat}>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>{item.stat}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto 48px' }}>
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, color: '#0F1E3C', marginBottom: 24 }}>Questions</div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(15,30,60,0.08)', marginBottom: 0 }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>{item.q}</span>
                <span style={{ fontSize: 18, color: 'rgba(15,30,60,0.3)', flexShrink: 0, marginLeft: 16 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.65)', lineHeight: 1.8, paddingBottom: 16 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleUpgrade} disabled={loading}
            style={{ background: '#0F1E3C', color: '#00D4AA', padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
            {loading ? 'Loading…' : 'Start Subscriber — $149/yr'}
          </button>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>
            Already have an account? <Link href="/login" style={{ color: '#0F1E3C', fontWeight: 500 }}>Sign in →</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
