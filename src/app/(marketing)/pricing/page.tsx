'use client'
import React, { useState } from 'react'
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


// ─── GROWTH RATE IMPACT SECTION ──────────────────────────────────────────────
function fv(balance: number, contrib: number, rate: number, years: number): number {
  return balance * Math.pow(1 + rate, years) + contrib * ((Math.pow(1 + rate, years) - 1) / rate)
}

function fmt(n: number): string {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000)    return '$' + Math.round(n / 1000) + 'k'
  return '$' + Math.round(n).toLocaleString()
}

function GrowthImpactSection() {
  const [balance,  setBalance]  = useState(200000)
  const [contrib,  setContrib]  = useState(15000)
  const [years,    setYears]    = useState(20)
  const [baseRate, setBaseRate] = useState(7)

  const atBase  = fv(balance, contrib, baseRate / 100, years)
  const atPlus1 = fv(balance, contrib, (baseRate + 1) / 100, years)
  const diff    = atPlus1 - atBase
  const diffIncome = diff * 0.04

  const maxFV = fv(balance, contrib, (baseRate + 1) / 100, years)

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(15,30,60,0.08)', marginBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.45)', marginBottom: 8 }}>The 1% rule — why every percentage point matters</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0F1E3C' }}>
          Just 1% more annual return on your super adds{' '}
          <span style={{ color: '#00D4AA', fontFamily: 'monospace' }}>{fmt(diff)}</span>{' '}
          by retirement
        </div>
        <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginTop: 6 }}>
          That's{' '}<strong style={{ color: '#0F1E3C' }}>{fmt(diffIncome)}/yr</strong>{' '}more retirement income (4% drawdown) — adjust the sliders to see your scenario
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24, marginBottom: 28, padding: '20px 24px', background: 'rgba(15,30,60,0.03)', borderRadius: 14 }}>
        {[
          { label: 'Current balance', value: balance, min: 10000, max: 600000, step: 10000, set: setBalance, fmt: (v: number) => '$' + (v/1000).toFixed(0) + 'k' },
          { label: 'Annual contributions', value: contrib, min: 3000, max: 35000, step: 1000, set: setContrib, fmt: (v: number) => '$' + (v/1000).toFixed(0) + 'k/yr' },
          { label: 'Years to retirement', value: years, min: 5, max: 35, step: 1, set: setYears, fmt: (v: number) => v + ' yrs' },
          { label: 'Base return rate', value: baseRate, min: 4, max: 10, step: 0.5, set: setBaseRate, fmt: (v: number) => v + '% p.a.' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{s.fmt(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(+e.target.value)}
              style={{ width: '100%', accentColor: '#00D4AA' }} />
          </div>
        ))}
      </div>

      {/* Two-bar comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { label: `At ${baseRate}% p.a. (your fund today)`, value: atBase, color: '#534AB7', suffix: 'current strategy' },
          { label: `At ${baseRate + 1}% p.a. (optimised)`, value: atPlus1, color: '#00D4AA', suffix: '1% improvement' },
        ].map(bar => (
          <div key={bar.label} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 12, padding: '18px 20px', borderLeft: `3px solid ${bar.color}` }}>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>{bar.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 30, fontWeight: 600, color: bar.color }}>{fmt(bar.value)}</div>
            <div style={{ height: 6, background: 'rgba(15,30,60,0.08)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${(bar.value / maxFV) * 100}%`, height: '100%', background: bar.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 6 }}>
              = {fmt(bar.value * 0.04)}/yr retirement income (4% SWR)
            </div>
          </div>
        ))}
      </div>

      {/* Gap callout */}
      <div style={{ background: '#0F1E3C', borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            The difference over {years} years
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 600, color: '#00D4AA' }}>{fmt(diff)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            = {fmt(diffIncome)}/yr more in retirement · = {Math.round(diff / 149).toLocaleString()}× the cost of SmartSuper AU
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>SmartSuper AU costs{' '}
            <strong style={{ color: '#00D4AA' }}>$149/yr</strong>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            That's {fmt(diff / 149)}× your potential improvement
          </div>
        </div>
      </div>

      {/* Supporting stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
        {[
          { stat: '$85k+', desc: 'Extra at retirement from a 1% fee reduction over a 40-year career', src: 'MoneySmart calculator' },
          { stat: '$8,938', desc: 'Potential tax saving from one year\'s unused carry-forward concessional cap at 32.5% marginal rate', src: 'ATO carry-forward rules' },
          { stat: '84%', desc: 'Of active Australian super funds underperformed the market over 15 years after fees', src: 'SPIVA Scorecard Dec 2022' },
        ].map(item => (
          <div key={item.stat} style={{ textAlign: 'center', padding: '16px', background: 'rgba(15,30,60,0.03)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>{item.stat}</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.6, marginBottom: 4 }}>{item.desc}</div>
            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.35)' }}>{item.src}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; label: string; description: string} | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCheckingCoupon(true)
    setCouponError('')
    try {
      const res = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({ code, label: data.label, description: data.description })
        setCouponError('')
      } else {
        setCouponError(data.error || 'Invalid coupon code.')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    }
    setCheckingCoupon(false)
  }
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setCouponError('')
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'optimiser',
          couponCode: appliedCoupon?.code ?? null,
        }),
      })

      // Handle auth redirect
      if (res.status === 401) {
        router.push('/login?redirectTo=/pricing')
        return
      }

      const data = await res.json()

      if (data.error) {
        if (data.error.toLowerCase().includes('coupon')) {
          setCouponError(data.error)
        } else {
          setCheckoutError(data.error)
        }
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setCheckoutError('Network error — please try again.')
      setLoading(false)
    }
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
              {loading ? 'Loading…' : appliedCoupon ? `Start for ${appliedCoupon.label} →` : 'Start Subscriber plan'}
            </button>

            {/* Coupon code input */}
            {!appliedCoupon ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Have a coupon code?"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <button onClick={applyCoupon} disabled={checkingCoupon || !couponInput.trim()}
                    style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'rgba(0,212,170,0.2)', color: '#00D4AA', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: !couponInput.trim() ? 0.5 : 1 }}>
                    {checkingCoupon ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError && <div style={{ marginTop: 6, fontSize: 12, color: '#FCA5A5' }}>✗ {couponError}</div>}
              </div>
            ) : (
              <div style={{ marginBottom: 20, background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#00D4AA' }}>✓ {appliedCoupon.code} applied</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{appliedCoupon.description}</div>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponInput('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAID_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#00D4AA', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontWeight: f.highlight ? 600 : 400 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth rate impact calculator + stats */}
        <GrowthImpactSection />

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
