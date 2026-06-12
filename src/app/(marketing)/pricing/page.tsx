'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FREE_FEATURES = [
  { label: 'Super health score — 5 dimensions, 0–100', star: true },
  { label: 'Fee analyser with 20-year fee drag projection', star: false },
  { label: 'Contributions overview + carry-forward alert', star: false },
  { label: 'APRA performance test status for your fund', star: false },
  { label: 'Basic Division 296 exposure check', star: false },
  { label: 'Profile locked to your data — no account sharing', star: false },
]

const FREE_NUDGES = [
  '📊 See exactly how your fund ranks against 40+ options',
  '⏰ 2020–21 carry-forward cap expires 30 June 2026 — check yours free',
  '💰 Most users find $3,000–$8,000 in missed tax savings on first login',
]

const PAID_FEATURES = [
  { label: 'Everything in Free', bold: false },
  { label: 'Fund comparison — like-for-like across all major funds', bold: true },
  { label: 'Carry-forward concessional cap tracker', bold: true },
  { label: 'Salary sacrifice optimiser + tax saving calculator', bold: true },
  { label: 'Division 296 full modeller ($3M threshold)', bold: true },
  { label: 'Model ETF portfolios (Choiceplus, Member Direct, SMSF)', bold: true },
  { label: 'Spouse analysis — tax offset + balance equalisation', bold: false },
  { label: 'SMSF analytics — ETF overlap, TBAR, min. pension', bold: false },
  { label: 'Annual cap expiry email alerts (before 30 June)', bold: true },
  { label: 'Saved calculations history', bold: false },
  { label: 'APRA results email digest (October — coming 2026)', bold: false },
]

const FAQ = [
  { q: 'Can I try before subscribing?', a: 'Yes — the Free tier includes the health score, fee analyser, and contributions overview with no time limit. Upgrade when you\'re ready to take action on your super.' },
  { q: 'What\'s the difference between yearly and quarterly?', a: 'Same features, same access. Yearly works out to $16.67/month (vs $20/month quarterly) — a 17% saving. Most members choose yearly for the saving and simplicity.' },
  { q: 'Can I switch between plans?', a: 'Yes. You can upgrade from quarterly to yearly at any time. Your billing date adjusts automatically via Stripe.' },
  { q: 'Is my profile data protected?', a: 'Your core financial details are locked to your account after first save. This protects your data and prevents account sharing.' },
  { q: 'Is this financial advice?', a: 'No. SmartSuper AU provides modelling tools and educational information — not financial advice. Always consider your personal circumstances.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel via account settings at any time. You retain access until the end of your billing period.' },
]

function fv(balance: number, contrib: number, rate: number, years: number): number {
  return balance * Math.pow(1 + rate, years) + contrib * ((Math.pow(1 + rate, years) - 1) / rate)
}
function fmt(n: number): string {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k'
  return '$' + Math.round(n).toLocaleString()
}

function GrowthImpactSection() {
  const [balance, setBalance] = useState(200000)
  const [contrib, setContrib] = useState(15000)
  const [years, setYears] = useState(20)
  const [baseRate, setBaseRate] = useState(7)
  const atBase = fv(balance, contrib, baseRate / 100, years)
  const atPlus1 = fv(balance, contrib, (baseRate + 1) / 100, years)
  const diff = atPlus1 - atBase
  const maxVal = fv(balance, contrib, (baseRate + 1) / 100, years)

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(15,30,60,0.08)', marginBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.45)', marginBottom: 8 }}>The 1% rule — why every percentage point matters</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0F1E3C' }}>
          Just 1% more annual return adds{' '}
          <span style={{ color: '#00D4AA', fontFamily: 'monospace' }}>{fmt(diff)}</span> by retirement
        </div>
        <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginTop: 6 }}>
          = <strong style={{ color: '#0F1E3C' }}>{fmt(diff * 0.04)}/yr</strong> more retirement income · adjust sliders for your scenario
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 24, padding: '20px', background: 'rgba(15,30,60,0.03)', borderRadius: 12 }}>
        {[
          { label: 'Balance', value: balance, min: 10000, max: 600000, step: 10000, set: setBalance, fmt: (v: number) => '$' + (v/1000).toFixed(0) + 'k' },
          { label: 'Annual contributions', value: contrib, min: 3000, max: 35000, step: 1000, set: setContrib, fmt: (v: number) => '$' + (v/1000).toFixed(0) + 'k/yr' },
          { label: 'Years to retirement', value: years, min: 5, max: 35, step: 1, set: setYears, fmt: (v: number) => v + ' yrs' },
          { label: 'Base return rate', value: baseRate, min: 4, max: 10, step: 0.5, set: setBaseRate, fmt: (v: number) => v + '%' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{s.fmt(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(+e.target.value)} style={{ width: '100%', accentColor: '#00D4AA' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: `At ${baseRate}% p.a.`, value: atBase, color: '#534AB7' },
          { label: `At ${baseRate + 1}% p.a. (optimised)`, value: atPlus1, color: '#00D4AA' },
        ].map(bar => (
          <div key={bar.label} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 12, padding: '16px 18px', borderLeft: `3px solid ${bar.color}` }}>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>{bar.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: bar.color }}>{fmt(bar.value)}</div>
            <div style={{ height: 5, background: 'rgba(15,30,60,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${(bar.value / maxVal) * 100}%`, height: '100%', background: bar.color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 6 }}>= {fmt(bar.value * 0.04)}/yr income (4% SWR)</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Difference over {years} years</div>
          <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 600, color: '#00D4AA' }}>{fmt(diff)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>= {fmt(diff * 0.04)}/yr more income · = {Math.round(diff / 200).toLocaleString()}× the cost of SmartSuper AU</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#00D4AA', fontWeight: 700 }}>SmartSuper AU from $60/quarter</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Less than a single coffee per week</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 16 }}>
        {[
          { stat: '$85k+', desc: 'Extra at retirement from a 1% fee reduction over a 40-year career', src: 'MoneySmart' },
          { stat: '$8,938', desc: 'Potential tax saving from one year\'s unused carry-forward cap at 32.5% marginal rate', src: 'ATO' },
          { stat: '84%', desc: 'Of active Australian super funds underperformed the market over 15 years after fees', src: 'SPIVA Dec 2022' },
        ].map(item => (
          <div key={item.stat} style={{ textAlign: 'center', padding: '14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: '#0F1E3C', marginBottom: 5 }}>{item.stat}</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.6, marginBottom: 3 }}>{item.desc}</div>
            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.35)' }}>{item.src}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<'yearly' | 'quarterly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; label: string; description: string } | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const yearlyPrice = 200
  const quarterlyPrice = 60
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2)
  const quarterlyMonthly = (quarterlyPrice / 3).toFixed(2)

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
      } else {
        setCouponError(data.error || 'Invalid coupon code.')
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    }
    setCheckingCoupon(false)
  }

  async function handleUpgrade() {
    setLoading(true)
    setCouponError('')
    setCheckoutError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'optimiser', billing, couponCode: appliedCoupon?.code ?? null }),
      })
      if (res.status === 401) { router.push('/login?redirectTo=/pricing'); return }
      const data = await res.json()
      if (data.error) {
        if (data.error.toLowerCase().includes('coupon')) setCouponError(data.error)
        else setCheckoutError(data.error)
        setLoading(false)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setCheckoutError('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', padding: '60px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#00D4AA', marginBottom: 12 }}>Pricing</div>
          <h1 style={{ fontSize: 36, fontWeight: 600, color: '#0F1E3C', marginBottom: 12, letterSpacing: '-0.02em' }}>Simple, honest pricing</h1>
          <p style={{ fontSize: 16, color: 'rgba(15,30,60,0.55)', maxWidth: 480, margin: '0 auto' }}>
            Free tools to understand your super. One subscription to optimise it.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 4, display: 'flex', gap: 4, border: '1px solid rgba(15,30,60,0.1)' }}>
            {(['yearly', 'quarterly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                  background: billing === b ? '#0F1E3C' : 'transparent',
                  color: billing === b ? 'white' : 'rgba(15,30,60,0.5)',
                }}>
                {b === 'yearly' ? (
                  <span>Yearly <span style={{ fontSize: 11, background: 'rgba(0,212,170,0.2)', color: '#065F46', padding: '2px 7px', borderRadius: 10, marginLeft: 6, fontWeight: 600 }}>Save 17%</span></span>
                ) : 'Quarterly'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48, maxWidth: 800, margin: '0 auto 48px' }}>

          {/* Free */}
          <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid rgba(15,30,60,0.1)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Free</h2>
            <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginBottom: 20 }}>Understand your super health</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 500, color: '#0F1E3C' }}>$0</span>
              <span style={{ fontSize: 14, color: 'rgba(15,30,60,0.4)' }}>forever</span>
            </div>

            {/* Nudge box */}
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              {FREE_NUDGES.map(n => (
                <div key={n} style={{ fontSize: 12, color: '#065F46', lineHeight: 1.6, marginBottom: 4 }}>{n}</div>
              ))}
            </div>

            <button onClick={() => router.push('/signup')}
              style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#0F1E3C', border: '1.5px solid rgba(15,30,60,0.2)', marginBottom: 24 }}>
              Get started free →
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {FREE_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#00D4AA', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.5, fontWeight: f.star ? 500 : 400 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriber */}
          <div style={{ background: '#0F1E3C', borderRadius: 20, padding: 32, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00D4AA', color: '#0F1E3C', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
              {billing === 'yearly' ? 'BEST VALUE' : 'MOST FLEXIBLE'}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 4 }}>Subscriber</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Take action and optimise</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 42, fontWeight: 500, color: '#00D4AA' }}>
                ${billing === 'yearly' ? yearlyPrice : quarterlyPrice}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/{billing === 'yearly' ? 'year' : 'quarter'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              ${billing === 'yearly' ? yearlyMonthly : quarterlyMonthly}/month ·{' '}
              {billing === 'yearly' ? 'Billed annually · Cancel anytime' : 'Billed quarterly · Cancel anytime'}
            </div>

            {checkoutError && (
              <div style={{ marginBottom: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>
                ⚠ {checkoutError}
              </div>
            )}

            <button onClick={handleUpgrade} disabled={loading}
              style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', background: '#00D4AA', color: '#0F1E3C', border: 'none', marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading…' : appliedCoupon ? `Start for ${appliedCoupon.label}` : `Start ${billing === 'yearly' ? 'Yearly' : 'Quarterly'} plan →`}
            </button>

            {/* Coupon */}
            {!appliedCoupon ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    placeholder="Have a coupon code?"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
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
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAID_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#00D4AA', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', fontWeight: f.bold ? 600 : 400 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <GrowthImpactSection />

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto 48px' }}>
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, color: '#0F1E3C', marginBottom: 24 }}>Questions</div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>{item.q}</span>
                <span style={{ fontSize: 18, color: 'rgba(15,30,60,0.3)', flexShrink: 0, marginLeft: 16 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.65)', lineHeight: 1.8, paddingBottom: 16 }}>{item.a}</div>}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={handleUpgrade} disabled={loading}
            style={{ background: '#0F1E3C', color: '#00D4AA', padding: '14px 40px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
            {loading ? 'Loading…' : `Start Subscriber — $${billing === 'yearly' ? yearlyPrice + '/yr' : quarterlyPrice + '/qtr'} →`}
          </button>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>
            Already have an account? <Link href="/login" style={{ color: '#0F1E3C', fontWeight: 500 }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
