'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calcSuperScore, calcFeeDrag, projectBalance, fmt, fmtShort } from '@/lib/calculations'
import type { SuperProfile, Subscription } from '@/types'

interface Props {
  profile: Record<string, unknown> | null
  superProfile: SuperProfile | null
  subscription: Subscription | null
  profileIsEmpty?: boolean
}

// ─── MINI SPARKLINE ──────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const w = 120, h = height
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  }).join(' ')
  const area = `M0,${h} L${data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  }).join(' L')} L${w},${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── PROJECTION CHART ────────────────────────────────────────────────────────
function ProjectionChart({ balance, annualContrib, years, feePct, bestFeePct }: {
  balance: number; annualContrib: number; years: number; feePct: number; bestFeePct: number
}) {
  const w = 560, h = 180, pad = { l: 48, r: 16, t: 16, b: 32 }
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b

  const checkpoints = Array.from({ length: years + 1 }, (_, i) => i).filter(
    y => y % Math.ceil(years / 6) === 0 || y === years
  )

  // Build year-by-year data for both scenarios
  const yourData: number[] = [], bestData: number[] = [], spouseData: number[] = []
  let yb = balance, bb = balance, sb = balance
  for (let i = 0; i <= years; i++) {
    yourData.push(yb)
    bestData.push(bb)
    spouseData.push(sb)
    yb = (yb + annualContrib) * (1 + 0.07 - feePct / 100)
    bb = (bb + annualContrib) * (1 + 0.07 - bestFeePct / 100)
    sb = (sb + annualContrib * 0.5) * (1 + 0.07 - feePct / 100)
  }

  const maxVal = Math.max(...bestData, ...yourData)

  function toX(year: number) { return pad.l + (year / years) * chartW }
  function toY(val: number) { return pad.t + chartH - (val / maxVal) * chartH }

  function makePath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
  }
  function makeArea(data: number[]) {
    const line = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' L ')
    return `M${toX(0)},${toY(0)} L${line} L${toX(years)},${toY(0)} Z`
  }

  const finalYour = yourData[years], finalBest = bestData[years]
  const gap = finalBest - finalYour

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="gBest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gYour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#534AB7" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#534AB7" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + chartH * (1 - f)} y2={pad.t + chartH * (1 - f)}
          stroke="rgba(15,30,60,0.06)" strokeWidth="1" />
      ))}

      {/* Year labels */}
      {checkpoints.map(y => (
        <text key={y} x={toX(y)} y={h - 8} textAnchor="middle" fill="rgba(15,30,60,0.35)" fontSize="9">
          {y === 0 ? 'Now' : `+${y}yr`}
        </text>
      ))}

      {/* Y axis labels */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <text key={f} x={pad.l - 4} y={pad.t + chartH * (1 - f) + 3} textAnchor="end" fill="rgba(15,30,60,0.35)" fontSize="9">
          {fmtShort(maxVal * f)}
        </text>
      ))}

      {/* Area fills */}
      <path d={makeArea(bestData)} fill="url(#gBest)" />
      <path d={makeArea(yourData)} fill="url(#gYour)" />

      {/* Lines */}
      <path d={makePath(bestData)} fill="none" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" />
      <path d={makePath(yourData)} fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeDasharray="5,3" />

      {/* End labels */}
      <circle cx={toX(years)} cy={toY(finalBest)} r="4" fill="#00D4AA" />
      <text x={toX(years) - 4} y={toY(finalBest) - 8} textAnchor="end" fill="#00D4AA" fontSize="10" fontWeight="600">
        {fmtShort(finalBest)}
      </text>

      {gap > 10000 && (
        <>
          <circle cx={toX(years)} cy={toY(finalYour)} r="3" fill="#534AB7" />
          <text x={toX(years) - 4} y={toY(finalYour) + 16} textAnchor="end" fill="#534AB7" fontSize="10">
            {fmtShort(finalYour)}
          </text>
          {/* Gap annotation */}
          <line x1={toX(years) + 8} y1={toY(finalYour)} x2={toX(years) + 8} y2={toY(finalBest)}
            stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,2" />
          <text x={toX(years) + 12} y={(toY(finalYour) + toY(finalBest)) / 2 + 3}
            fill="#EF4444" fontSize="9" fontWeight="600">
            -{fmtShort(gap)}
          </text>
        </>
      )}
    </svg>
  )
}

// ─── LOCKED PREMIUM CARD ─────────────────────────────────────────────────────
function LockedCard({ title, teaser, icon, href }: { title: string; teaser: string; icon: string; href: string }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push('/pricing')}
      style={{
        background: 'white', borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(15,30,60,0.1)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,212,170,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* blur overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)', zIndex: 1, borderRadius: 16 }} />
      {/* content behind blur */}
      <div style={{ opacity: 0.4 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 28, color: '#00D4AA', marginBottom: 4 }}>$XX,XXX</div>
        <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 8 }}>{teaser}</div>
        <div style={{ height: 32, background: 'rgba(15,30,60,0.06)', borderRadius: 6 }} />
      </div>
      {/* overlay badge */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{title}</div>
        <div style={{ background: '#0F1E3C', color: '#00D4AA', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>
          Unlock with Optimiser →
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function DashboardClient({ superProfile, profileIsEmpty, subscription }: Props) {
  const router = useRouter()
  const sp = superProfile
  const isPaid = subscription?.plan && subscription.plan !== 'free'

  const score = useMemo(() => {
    if (!sp || profileIsEmpty) return null
    return calcSuperScore({
      fundFeePct: sp.fund_fee_pct ?? 0.78,
      apraStatus: 'passed',
      investmentOption: sp.fund_option ?? 'Balanced',
      age: sp.age ?? 40,
      hasCarryForwardUnused: true,
      accountCount: sp.account_count ?? 1,
      salary: sp.salary ?? 80000,
      makingVoluntaryContribs: false,
      netReturnRank: 'mid',
    })
  }, [sp, profileIsEmpty])

  const yrs = Math.max(1, (sp?.target_retirement_age ?? 65) - (sp?.age ?? 40))
  const annualContrib = (sp?.salary ?? 0) * ((sp?.employer_sg_rate ?? 12) / 100)
  const balance = sp?.current_balance ?? 0
  const feePct = sp?.fund_fee_pct ?? 0
  const bestFeePct = feePct > 0.10 ? 0.04 : feePct  // best indexed equiv

  const projBalance = useMemo(() => projectBalance(balance, annualContrib, 0.07 - feePct / 100, yrs), [balance, annualContrib, feePct, yrs])
  const projBest    = useMemo(() => projectBalance(balance, annualContrib, 0.07 - bestFeePct / 100, yrs), [balance, annualContrib, bestFeePct, yrs])
  const feeDrag     = useMemo(() => feePct > bestFeePct + 0.05 ? calcFeeDrag(balance, feePct, bestFeePct, yrs, annualContrib) : null, [balance, feePct, bestFeePct, yrs, annualContrib])

  // Projection data for sparklines
  const projData = useMemo(() => {
    const pts: number[] = []
    let b = balance
    for (let i = 0; i <= Math.min(yrs, 20); i++) {
      pts.push(b)
      b = (b + annualContrib) * (1 + 0.07 - feePct / 100)
    }
    return pts
  }, [balance, annualContrib, feePct, yrs])

  // Weekly cost equivalent of fees
  const annualFeeDollars = balance * feePct / 100
  const weeksEquiv = Math.round(annualFeeDollars / 1400)

  // Retirement income estimate (4% SWR)
  const retirementIncome = projBalance * 0.04
  const ageBreakEven = sp?.age ? 67 : null

  // Arc gauge
  const arcLen = 251.3
  const arcOffset = score ? arcLen - (arcLen * score.total / 100) : arcLen
  const gaugeColor = score
    ? score.total >= 80 ? '#00D4AA' : score.total >= 65 ? '#F59E0B' : score.total >= 45 ? '#F97316' : '#EF4444'
    : '#ccc'

  if (profileIsEmpty || !sp) {
    return (
      <div style={{ maxWidth: 900 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>⬡</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Set up your super profile</h2>
          <p style={{ fontSize: 14, color: 'rgba(15,30,60,0.6)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Enter your fund, balance, and salary to unlock your personalised health score and see the exact dollar cost of your current setup.
          </p>
          <button onClick={() => router.push('/settings')}
            style={{ background: '#00D4AA', color: '#0F1E3C', padding: '12px 32px', borderRadius: 12, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            Set up my profile →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>

      {/* ── URGENT ALERT ─────────────────────────────────────────── */}
      {balance < 500000 && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 600, color: '#7F1D1D', fontSize: 14, marginBottom: 3 }}>Your 2020–21 carry-forward cap expires 30 June 2026</div>
            <div style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>
              Up to $27,500 in unused concessional cap will be permanently lost if not used before EOFY.
              That's a potential tax saving of <strong>${Math.round(27500 * 0.325).toLocaleString()}</strong> at the 32.5% marginal rate.
              {' '}<span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => router.push('/contributions')}>See Contributions →</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP STATS ROW ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Balance */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.45)', marginBottom: 6 }}>Super balance</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: '#0F1E3C', lineHeight: 1 }}>{fmt(balance)}</div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 5 }}>{sp.fund_name} · {sp.fund_option}</div>
          <div style={{ marginTop: 10, height: 36 }}>
            <Sparkline data={projData.slice(0, 8)} color="#534AB7" height={36} />
          </div>
        </div>

        {/* Annual SG */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.45)', marginBottom: 6 }}>Employer SG (annual)</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: '#0F1E3C', lineHeight: 1 }}>{fmt(annualContrib)}</div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 5 }}>{sp.employer_sg_rate ?? 12}% of {fmt(sp.salary ?? 0)} from 1 Jul 2025</div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.45)' }}>= {fmt(annualContrib / 26)}/fortnight added</div>
        </div>

        {/* Annual fee cost */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: feePct > 0.5 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(15,30,60,0.1)', position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.45)', marginBottom: 6 }}>Annual fee cost</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: feePct > 0.5 ? '#EF4444' : '#0F1E3C', lineHeight: 1 }}>{fmt(annualFeeDollars)}</div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 5 }}>{feePct}% of {fmt(balance)}</div>
          <div style={{ marginTop: 10, fontSize: 11, color: feePct > 0.5 ? '#EF4444' : 'rgba(15,30,60,0.45)' }}>
            ≈ {weeksEquiv} weeks of median wages/yr
          </div>
        </div>

        {/* Projected */}
        <div style={{ background: '#0F1E3C', borderRadius: 14, padding: '18px 20px', border: 'none' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Projected at {sp.target_retirement_age ?? 65}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: '#00D4AA', lineHeight: 1 }}>{fmtShort(projBalance)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>At 7% p.a. · current contributions</div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            = {fmt(retirementIncome)}/yr retirement income (4% SWR)
          </div>
        </div>
      </div>

      {/* ── SCORE + BREAKDOWN ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, marginBottom: 20 }}>

        {/* Gauge */}
        <div style={{ background: 'white', borderRadius: 16, padding: '28px 20px', border: '1px solid rgba(15,30,60,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 180 100" style={{ width: 180, height: 100, overflow: 'visible' }}>
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path d="M 12 94 A 78 78 0 0 1 168 94" fill="none" stroke="rgba(15,30,60,0.08)" strokeWidth="12" strokeLinecap="round" />
            {/* Fill */}
            <path d="M 12 94 A 78 78 0 0 1 168 94" fill="none" stroke="url(#arcGrad)" strokeWidth="12"
              strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcOffset} />
            {/* Score ticks */}
            {[0, 20, 40, 60, 80, 100].map(v => {
              const angle = (v / 100) * Math.PI
              const r = 78, cx = 90, cy = 94
              const x = cx - r * Math.cos(angle)
              const y = cy - r * Math.sin(angle)
              return <circle key={v} cx={x} cy={y} r="2" fill="white" opacity="0.6" />
            })}
          </svg>
          <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 500, color: '#0F1E3C', lineHeight: 1, marginTop: -12 }}>
            {score?.total ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)', marginTop: 2 }}>out of 100</div>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, letterSpacing: '0.06em',
            background: score?.total >= 80 ? 'rgba(0,212,170,0.1)' : score?.total >= 65 ? '#FFFBEB' : score?.total >= 45 ? 'rgba(249,115,22,0.1)' : '#FEF2F2',
            color: score?.total >= 80 ? '#065F46' : score?.total >= 65 ? '#92400E' : score?.total >= 45 ? '#9A3412' : '#991B1B',
          }}>
            {score?.label ?? '—'}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
            Better than <strong style={{ color: '#0F1E3C' }}>
              {score?.total >= 80 ? '85%' : score?.total >= 65 ? '65%' : score?.total >= 45 ? '42%' : '18%'}
            </strong> of Australian super members
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)' }}>Score breakdown</div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>5 dimensions · 100 pts total</div>
          </div>
          {score?.breakdown.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
              {/* Status icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
                background: item.status === 'good' ? 'rgba(0,212,170,0.1)' : item.status === 'ok' ? '#FFFBEB' : '#FEF2F2',
                color: item.status === 'good' ? '#065F46' : item.status === 'ok' ? '#92400E' : '#991B1B',
              }}>
                {item.status === 'good' ? '✓' : item.status === 'ok' ? '~' : '✗'}
              </div>
              {/* Label */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginTop: 1 }}>{item.sublabel}</div>
              </div>
              {/* Bar + Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: '#ECEAE4', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.6s ease',
                    width: `${(item.score / item.maxScore) * 100}%`,
                    background: item.status === 'good' ? '#00D4AA' : item.status === 'ok' ? '#F97316' : '#EF4444',
                  }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, width: 40, textAlign: 'right',
                  color: item.status === 'good' ? '#00D4AA' : item.status === 'ok' ? '#D97706' : '#EF4444'
                }}>{item.score}/{item.maxScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROJECTION CHART ──────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 4 }}>
              Portfolio projection — {yrs} years to retirement
            </div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)' }}>
              Current fee path vs lowest-cost equivalent option
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 20, height: 2.5, background: '#00D4AA', borderRadius: 2 }} />
              <span style={{ color: 'rgba(15,30,60,0.6)' }}>Lowest-fee option ({bestFeePct.toFixed(2)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 20, height: 2, background: '#534AB7', borderRadius: 2, borderTop: '2px dashed #534AB7' }} />
              <span style={{ color: 'rgba(15,30,60,0.6)' }}>Your current fund ({feePct}%)</span>
            </div>
          </div>
        </div>

        <ProjectionChart
          balance={balance}
          annualContrib={annualContrib}
          years={Math.min(yrs, 25)}
          feePct={feePct}
          bestFeePct={bestFeePct}
        />

        {feeDrag && feeDrag.drag > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 24, background: '#FEF2F2', borderRadius: 10, padding: '12px 16px' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 2 }}>Fee drag over {yrs} yrs</div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#EF4444' }}>−{fmt(feeDrag.drag)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 2 }}>Annual fee difference today</div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#D97706' }}>{fmt(feeDrag.annualDiff)}/yr</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 2 }}>Lost retirement income (4% SWR)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#EF4444' }}>−{fmt(feeDrag.drag * 0.04)}/yr</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <button onClick={() => router.push('/fees')}
                style={{ background: '#0F1E3C', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                See full fee analysis →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── INSIGHTS ROW ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>
          Personalised insights
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Insight 1 — Fee drag in real terms */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: feeDrag?.drag > 20000 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Fee reality check</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>
            {fmt(annualFeeDollars)}/yr
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>
            That's <strong>{fmt(annualFeeDollars / 12)}/month</strong> leaving your super silently.
            {feePct > 0.15
              ? ` At ${feePct}%, you could pay as little as ${fmt(balance * bestFeePct / 100)}/yr in the same category.`
              : ' You\'re already in one of the lowest-fee options available.'}
          </div>
          <button onClick={() => router.push('/fees')} style={{ marginTop: 10, background: 'rgba(15,30,60,0.06)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#0F1E3C', cursor: 'pointer' }}>
            Fee analyser →
          </button>
        </div>

        {/* Insight 2 — Retirement income */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Retirement income est.</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: '#00D4AA', marginBottom: 4 }}>
            {fmt(retirementIncome)}/yr
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>
            Based on {fmtShort(projBalance)} at {sp.target_retirement_age ?? 65} using a 4% safe withdrawal rate.
            {retirementIncome < 50000 ? ' You may need to supplement with the Age Pension.' : ' Comfortably above the ASFA Comfortable standard ($47k/yr for singles).'}
          </div>
          <button onClick={() => router.push('/contributions')} style={{ marginTop: 10, background: 'rgba(15,30,60,0.06)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#0F1E3C', cursor: 'pointer' }}>
            Boost contributions →
          </button>
        </div>

        {/* Insight 3 — Option alignment */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Option alignment</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: yrs > 15 ? '#00D4AA' : '#D97706', marginBottom: 4 }}>
            {yrs} yrs left
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>
            {yrs > 20
              ? `With ${yrs} years until retirement, you have the ability to sustain a growth or high-growth option through multiple market cycles.`
              : yrs > 10
              ? `${yrs} years gives you time to recover from market volatility, but start planning a gradual de-risking strategy.`
              : `With ${yrs} years to go, consider whether your current option is appropriate for your risk capacity.`
            }
          </div>
          <button onClick={() => router.push('/funds')} style={{ marginTop: 10, background: 'rgba(15,30,60,0.06)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: '#0F1E3C', cursor: 'pointer' }}>
            Compare options →
          </button>
        </div>
      </div>

      {/* ── PREMIUM LOCKED FEATURES ───────────────────────────────── */}
      {!isPaid && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)' }}>
              Premium insights — unlock with Optimiser ($149/yr)
            </div>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,30,60,0.08)' }} />
            <button onClick={() => router.push('/pricing')}
              style={{ background: '#00D4AA', color: '#0F1E3C', padding: '7px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Unlock all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <LockedCard
              title="Salary sacrifice optimiser"
              teaser="Max tax saving before 30 June"
              icon="💼"
              href="/contributions"
            />
            <LockedCard
              title="Division 296 modeller"
              teaser="Your exposure above $3M threshold"
              icon="📊"
              href="/div296"
            />
            <LockedCard
              title="Spouse contribution strategy"
              teaser="Tax offset + balance equalisation"
              icon="👫"
              href="/spouse"
            />
          </div>

          {/* Upgrade CTA banner */}
          <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                You're leaving money on the table
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 520 }}>
                SmartSuper AU Optimiser unlocks salary sacrifice modelling, carry-forward tracker, Division 296 tax calculator, spouse contribution strategy, SMSF analytics, and cap expiry alerts.
                {feeDrag?.drag > 0 && ` Based on your profile, there's a potential ${fmt(feeDrag.drag)} improvement opportunity over ${yrs} years.`}
                {' '}For $149/yr — less than your fund charges you every {Math.max(1, Math.round(149 / (annualFeeDollars || 149)))} weeks in fees.
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button onClick={() => router.push('/pricing')}
                style={{ background: '#00D4AA', color: '#0F1E3C', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Upgrade for $149/yr →
              </button>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6 }}>Cancel anytime</div>
            </div>
          </div>
        </>
      )}

      {/* ── QUICK ACTIONS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Fee analyser', sub: 'See your fee drag', href: '/fees', icon: '💸' },
          { label: 'Fund comparison', sub: 'Like-for-like peers', href: '/funds', icon: '🏆' },
          { label: 'Contributions', sub: 'Carry-forward tracker', href: '/contributions', icon: '📅' },
          { label: 'Edit profile', sub: 'Update your details', href: '/settings', icon: '⚙️' },
        ].map(a => (
          <button key={a.href} onClick={() => router.push(a.href)}
            style={{ background: 'white', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00D4AA'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,170,0.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,30,60,0.1)'; (e.currentTarget as HTMLElement).style.background = 'white' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{a.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ borderRadius: 12, padding: '12px 16px', fontSize: 11, lineHeight: 1.7, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)' }}>
        <strong style={{ color: 'rgba(15,30,60,0.7)' }}>General information only.</strong> This score is a modelled estimate based on information you have entered and publicly available fund data. It does not take into account your personal financial objectives, situation or needs and is not financial advice. Scores and projections are illustrative — past fund performance is not indicative of future returns.
      </div>
    </div>
  )
}
