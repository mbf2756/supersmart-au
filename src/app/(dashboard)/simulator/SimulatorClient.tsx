'use client'
import { useState, useMemo } from 'react'
import { projectBalance, fmt, fmtShort, getMarginalRate } from '@/lib/calculations'

const ASFA_COMFORTABLE = 51000
const ASFA_MODEST      = 31000

// ─── INVESTMENT PROFILES ────────────────────────────────────────────────────
// Each profile has a name, return rate, fee assumption, and description
const INVESTMENT_PROFILES = [
  {
    id: 'current',
    label: 'Your current option',
    icon: '📊',
    description: 'Your existing fund and option as entered in your profile',
    dynamic: true,   // uses sp.fund_fee_pct and current return assumption
  },
  {
    id: 'balanced',
    label: 'Balanced (active)',
    icon: '⚖️',
    returnRate: 7.5,
    fee: 0.57,
    description: 'Active balanced fund. ~60% growth assets, ~40% defensive. Typical of most industry fund defaults.',
    colour: '#8A9BB5',
  },
  {
    id: 'high-growth',
    label: 'High growth (active)',
    icon: '🚀',
    returnRate: 8.5,
    fee: 0.60,
    description: 'Active high growth fund. ~85% growth assets. Higher short-term volatility, stronger long-term compounding.',
    colour: '#534AB7',
  },
  {
    id: 'indexed-balanced',
    label: 'Indexed balanced',
    icon: '📈',
    returnRate: 7.8,
    fee: 0.08,
    description: 'Low-cost indexed balanced option. Similar return to active balanced but at a fraction of the fee.',
    colour: '#00D4AA',
  },
  {
    id: 'etf-heavy',
    label: 'ETF-heavy (SMSF/Choiceplus)',
    icon: '🏗️',
    returnRate: 9.0,
    fee: 0.15,
    description: 'Direct ETF portfolio (e.g. VGS + A200 + VAF). Higher potential returns, very low fees, maximum control.',
    colour: '#F59E0B',
  },
  {
    id: 'conservative',
    label: 'Conservative',
    icon: '🛡️',
    returnRate: 5.5,
    fee: 0.45,
    description: 'Lower risk, lower return. Suitable for members close to retirement or with low risk tolerance.',
    colour: '#10B981',
  },
]

// ─── RETIREMENT AGE SCENARIOS ────────────────────────────────────────────────
const RETIREMENT_AGES = [50, 55, 60, 65, 67, 70]

// ─── PROJECTION ENGINE ───────────────────────────────────────────────────────
function project(balance: number, annualContrib: number, returnRate: number, fee: number, years: number) {
  return projectBalance(balance, annualContrib, (returnRate - fee) / 100, Math.max(0, years))
}

function buildChartData(balance: number, annualContrib: number, returnRate: number, fee: number, maxYears: number) {
  const pts: number[] = []
  let b = balance
  for (let i = 0; i <= Math.min(maxYears, 40); i++) {
    pts.push(b)
    b = (b + annualContrib) * (1 + (returnRate - fee) / 100)
  }
  return pts
}

// ─── MINI PROJECTION CHART ───────────────────────────────────────────────────
function MiniChart({ datasets, retireAt, currentAge, height = 80 }: {
  datasets: { data: number[]; colour: string; label: string }[]
  retireAt: number
  currentAge: number
  height?: number
}) {
  const w = 280, h = height
  const pad = { l: 36, r: 8, t: 6, b: 18 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b
  const maxYears = Math.max(...datasets.map(d => d.data.length)) - 1
  const maxVal = Math.max(...datasets.flatMap(d => d.data)) || 1
  const retireYear = retireAt - currentAge

  function toX(i: number) { return pad.l + (i / maxYears) * cw }
  function toY(v: number) { return pad.t + ch - (v / maxVal) * ch }
  function makePath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid */}
      {[0.5, 1].map(f => (
        <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + ch * (1 - f)} y2={pad.t + ch * (1 - f)}
          stroke="rgba(15,30,60,0.06)" strokeWidth="1" />
      ))}
      {/* Y labels */}
      {[0.5, 1].map(f => (
        <text key={f} x={pad.l - 3} y={pad.t + ch * (1 - f) + 3} textAnchor="end"
          fill="rgba(15,30,60,0.3)" fontSize="8">{fmtShort(maxVal * f)}</text>
      ))}
      {/* Retire line */}
      {retireYear > 0 && retireYear <= maxYears && (
        <line x1={toX(retireYear)} x2={toX(retireYear)} y1={pad.t} y2={pad.t + ch}
          stroke="rgba(15,30,60,0.2)" strokeWidth="1" strokeDasharray="3,2" />
      )}
      {/* Lines */}
      {datasets.map((ds, i) => (
        <path key={i} d={makePath(ds.data)} fill="none" stroke={ds.colour}
          strokeWidth={i === 0 ? "1.5" : "2"} strokeDasharray={i === 0 ? "4,2" : "none"}
          strokeLinecap="round" opacity={i === 0 ? 0.5 : 1} />
      ))}
      {/* X labels */}
      {[0, Math.floor(maxYears / 2), maxYears].map(y => (
        <text key={y} x={toX(y)} y={h - 4} textAnchor="middle" fill="rgba(15,30,60,0.3)" fontSize="8">
          {y === 0 ? 'Now' : `+${y}yr`}
        </text>
      ))}
    </svg>
  )
}

// ─── LARGE COMPARISON CHART ───────────────────────────────────────────────────
function ComparisonChart({ datasets, retireAt, currentAge }: {
  datasets: { data: number[]; colour: string; label: string; dashed?: boolean }[]
  retireAt: number
  currentAge: number
}) {
  const w = 860, h = 200
  const pad = { l: 56, r: 16, t: 12, b: 28 }
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b
  const maxYears = Math.max(...datasets.map(d => d.data.length)) - 1
  const maxVal = Math.max(...datasets.flatMap(d => d.data)) || 1
  const retireYear = retireAt - currentAge

  function toX(i: number) { return pad.l + (i / maxYears) * cw }
  function toY(v: number) { return pad.t + ch - (v / maxVal) * ch }
  function makePath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  }

  const gridVals = [0.25, 0.5, 0.75, 1]
  const checkpoints = [0, 5, 10, 15, 20, 25, 30, 35, 40].filter(y => y <= maxYears)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {gridVals.map(f => (
        <g key={f}>
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + ch * (1 - f)} y2={pad.t + ch * (1 - f)}
            stroke="rgba(15,30,60,0.06)" strokeWidth="1" />
          <text x={pad.l - 4} y={pad.t + ch * (1 - f) + 3} textAnchor="end"
            fill="rgba(15,30,60,0.35)" fontSize="9">{fmtShort(maxVal * f)}</text>
        </g>
      ))}
      {retireYear > 0 && retireYear <= maxYears && (
        <>
          <line x1={toX(retireYear)} x2={toX(retireYear)} y1={pad.t} y2={pad.t + ch}
            stroke="#534AB7" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" />
          <text x={toX(retireYear) + 4} y={pad.t + 10} fill="#534AB7" fontSize="9" opacity="0.5">retire</text>
        </>
      )}
      {datasets.map((ds, i) => (
        <path key={i} d={makePath(ds.data)} fill="none" stroke={ds.colour}
          strokeWidth={ds.dashed ? 1.5 : 2.5} strokeDasharray={ds.dashed ? "5,3" : "none"}
          strokeLinecap="round" opacity={ds.dashed ? 0.5 : 1} />
      ))}
      {checkpoints.map(y => (
        <text key={y} x={toX(y)} y={h - 5} textAnchor="middle" fill="rgba(15,30,60,0.35)" fontSize="9">
          {y === 0 ? 'Now' : `+${y}yr`}
        </text>
      ))}
    </svg>
  )
}

// ─── SCENARIO RESULT CARD ────────────────────────────────────────────────────
function ScenarioCard({
  label, icon, colour, retirementBalance, annualIncome,
  yearsToRetire, asfaGap, isBase, isBest, extraVsBase,
  description
}: {
  label: string; icon: string; colour: string
  retirementBalance: number; annualIncome: number
  yearsToRetire: number; asfaGap: number
  isBase?: boolean; isBest?: boolean; extraVsBase?: number
  description?: string
}) {
  const meetsComfortable = annualIncome >= ASFA_COMFORTABLE
  const meetsModest      = annualIncome >= ASFA_MODEST

  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: `2px solid ${isBest ? colour : isBase ? 'rgba(15,30,60,0.1)' : 'rgba(15,30,60,0.08)'}`,
      padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      {isBest && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: colour, color: 'white',
          fontSize: 9, fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: 8,
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best outcome</div>
      )}
      {isBase && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(15,30,60,0.12)',
          color: 'rgba(15,30,60,0.5)', fontSize: 9, fontWeight: 700, padding: '3px 10px',
          borderBottomLeftRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current path</div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1E3C', lineHeight: 1.2 }}>{label}</span>
      </div>

      {description && (
        <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.5, marginBottom: 10 }}>
          {description}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: colour, marginBottom: 2, lineHeight: 1 }}>
        {fmtShort(retirementBalance)}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 10 }}>at retirement</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'rgba(15,30,60,0.6)' }}>Annual income (4% SWR)</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: meetsComfortable ? '#00D4AA' : meetsModest ? '#F59E0B' : '#EF4444' }}>
            {fmt(Math.round(annualIncome))}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'rgba(15,30,60,0.6)' }}>ASFA Comfortable</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: meetsComfortable ? '#00D4AA' : '#EF4444' }}>
            {meetsComfortable ? '✓ Met' : `−${fmt(Math.round(asfaGap))}`}
          </span>
        </div>
        {extraVsBase !== undefined && extraVsBase !== 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid rgba(15,30,60,0.06)', paddingTop: 4, marginTop: 2 }}>
            <span style={{ color: 'rgba(15,30,60,0.6)' }}>vs current path</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: extraVsBase > 0 ? '#00D4AA' : '#EF4444' }}>
              {extraVsBase > 0 ? '+' : ''}{fmtShort(extraVsBase)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function SimulatorClient({ superProfile: sp, subscription }: {
  superProfile: any; subscription: any
}) {
  const isPaid = subscription?.plan !== 'free'

  const currentAge      = sp?.age ?? 40
  const balance         = sp?.current_balance ?? 0
  const salary          = sp?.salary ?? 0
  const feePct          = sp?.fund_fee_pct ?? 0.62
  const sgRate          = sp?.employer_sg_rate ?? 12
  const defaultRetire   = sp?.target_retirement_age ?? 65
  const fundOption      = sp?.fund_option ?? 'Balanced'
  const sgContrib       = salary * sgRate / 100

  // Estimate current return based on fund option
  const opt = fundOption.toLowerCase()
  const currentReturn = opt.includes('indexed') ? 7.8 : opt.includes('high growth') ? 8.5 : opt.includes('conservative') ? 5.5 : 7.5

  // ── View mode ───────────────────────────────────────────────────────────
  type ViewMode = 'retirement-age' | 'investment' | 'combined' | 'custom'
  const [viewMode, setViewMode] = useState<ViewMode>('custom')

  // ── Custom simulator state ───────────────────────────────────────────
  const [customRetireAge,  setCustomRetireAge]  = useState(defaultRetire)
  const [customMonthlySS,  setCustomMonthlySS]  = useState(0)
  const [customReturnRate, setCustomReturnRate] = useState(currentReturn)
  const [customFee,        setCustomFee]        = useState(feePct)
  const [customOneTime,    setCustomOneTime]    = useState(0)
  const [switchIndexed,    setSwitchIndexed]    = useState(false)

  // ── Retirement age scenarios ─────────────────────────────────────────
  const retirementAgeResults = useMemo(() =>
    RETIREMENT_AGES.filter(age => age > currentAge).map(retireAge => {
      const yrs = retireAge - currentAge
      const bal = project(balance, sgContrib, currentReturn, feePct, yrs)
      return { retireAge, yrs, bal, income: bal * 0.04 }
    }),
    [balance, sgContrib, currentReturn, feePct, currentAge]
  )

  // ── Investment profile scenarios ─────────────────────────────────────
  const investmentResults = useMemo(() =>
    INVESTMENT_PROFILES.map(prof => {
      const returnRate = prof.dynamic ? currentReturn : prof.returnRate!
      const fee        = prof.dynamic ? feePct : prof.fee!
      const yrs        = defaultRetire - currentAge
      const bal        = project(balance, sgContrib, returnRate, fee, Math.max(1, yrs))
      return { ...prof, bal, income: bal * 0.04, returnRate, fee, yrs }
    }),
    [balance, sgContrib, currentReturn, feePct, currentAge, defaultRetire]
  )

  // ── Combined best case ───────────────────────────────────────────────
  const combinedScenarios = useMemo(() => {
    const base = project(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire - currentAge))
    return [
      {
        id: 'base', label: 'Current path', icon: '📊', colour: '#8A9BB5',
        desc: `${fundOption} · retire at ${defaultRetire} · no salary sacrifice`,
        bal: base,
      },
      {
        id: 'retire-later', label: `Work 3 more years (retire ${defaultRetire + 3})`, icon: '💼', colour: '#534AB7',
        desc: `Same fund and contributions, retire at ${defaultRetire + 3} instead`,
        bal: project(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire + 3 - currentAge)),
      },
      {
        id: 'max-ss', label: 'Maximise salary sacrifice', icon: '💰', colour: '#00D4AA',
        desc: `Add up to $1,500/month SS · retire at ${defaultRetire}`,
        bal: project(balance, sgContrib + 18000, currentReturn, feePct, Math.max(1, defaultRetire - currentAge)),
      },
      {
        id: 'indexed', label: 'Switch to indexed option', icon: '📈', colour: '#F59E0B',
        desc: `Same returns, but 0.08% fee instead of ${feePct}%`,
        bal: project(balance, sgContrib, 7.8, 0.08, Math.max(1, defaultRetire - currentAge)),
      },
      {
        id: 'best', label: 'All three combined', icon: '⭐', colour: '#EF4444',
        desc: `Indexed fund + max SS + retire ${defaultRetire + 3}`,
        bal: project(balance, sgContrib + 18000, 7.8, 0.08, Math.max(1, defaultRetire + 3 - currentAge)),
      },
    ].map(s => ({ ...s, income: s.bal * 0.04, gap: Math.max(0, ASFA_COMFORTABLE - s.bal * 0.04) }))
  }, [balance, sgContrib, currentReturn, feePct, defaultRetire, currentAge, fundOption])

  // ── Custom scenario ──────────────────────────────────────────────────
  const customResult = useMemo(() => {
    const effectiveFee = switchIndexed ? 0.08 : customFee
    const effectiveReturn = switchIndexed ? 7.8 : customReturnRate
    const yrs = Math.max(1, customRetireAge - currentAge)
    const startBalance = balance + customOneTime
    const bal = project(startBalance, sgContrib + customMonthlySS * 12, effectiveReturn, effectiveFee, yrs)
    const base = project(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire - currentAge))
    return { bal, income: bal * 0.04, gap: Math.max(0, ASFA_COMFORTABLE - bal * 0.04), delta: bal - base }
  }, [balance, sgContrib, currentReturn, feePct, currentAge, defaultRetire,
    customRetireAge, customMonthlySS, customReturnRate, customFee, customOneTime, switchIndexed])

  // ── Chart data for comparison chart ─────────────────────────────────
  const chartDatasets = useMemo(() => {
    if (viewMode === 'retirement-age') {
      return RETIREMENT_AGES.filter(a => a > currentAge).map((age, i) => {
        const colours = ['#8A9BB5','#10B981','#F59E0B','#534AB7','#00D4AA','#EF4444']
        return {
          data: buildChartData(balance, sgContrib, currentReturn, feePct, age - currentAge),
          colour: colours[i % colours.length],
          label: `Retire ${age}`,
          dashed: age === defaultRetire,
        }
      })
    }
    if (viewMode === 'investment') {
      return INVESTMENT_PROFILES.map((prof, i) => {
        const r = prof.dynamic ? currentReturn : prof.returnRate!
        const f = prof.dynamic ? feePct : prof.fee!
        return {
          data: buildChartData(balance, sgContrib, r, f, Math.max(1, defaultRetire - currentAge)),
          colour: prof.dynamic ? '#8A9BB5' : prof.colour!,
          label: prof.label,
          dashed: prof.dynamic,
        }
      })
    }
    if (viewMode === 'combined') {
      return combinedScenarios.map(s => ({
        data: buildChartData(balance, sgContrib + (s.id === 'max-ss' || s.id === 'best' ? 18000 : 0),
          s.id === 'indexed' || s.id === 'best' ? 7.8 : currentReturn,
          s.id === 'indexed' || s.id === 'best' ? 0.08 : feePct,
          s.id === 'retire-later' || s.id === 'best' ? defaultRetire + 3 - currentAge : Math.max(1, defaultRetire - currentAge)),
        colour: s.colour, label: s.label, dashed: s.id === 'base',
      }))
    }
    // custom
    return [
      { data: buildChartData(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire - currentAge)), colour: '#8A9BB5', label: 'Current path', dashed: true },
      { data: buildChartData(balance + customOneTime, sgContrib + customMonthlySS * 12, switchIndexed ? 7.8 : customReturnRate, switchIndexed ? 0.08 : customFee, Math.max(1, customRetireAge - currentAge)), colour: '#00D4AA', label: 'Your scenario', dashed: false },
    ]
  }, [viewMode, balance, sgContrib, currentReturn, feePct, currentAge, defaultRetire,
    combinedScenarios, customRetireAge, customMonthlySS, customReturnRate, customFee, customOneTime, switchIndexed])

  const baseBalance = project(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire - currentAge))

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 680, background: 'white', borderRadius: 20, padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔮</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Advanced Modelling</h3>
        <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Compare every retirement age, investment option, and contribution strategy side by side. See exactly which combination gives you the best outcome.
        </p>
        <a href="/pricing" style={{ display: 'inline-block', background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
          Upgrade to unlock →
        </a>
      </div>
    )
  }

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }
  const tabBtn = (mode: ViewMode, label: string) => (
    <button onClick={() => setViewMode(mode)}
      style={{ padding: '8px 18px', borderRadius: 20, border: `1.5px solid ${viewMode === mode ? '#0F1E3C' : 'rgba(15,30,60,0.15)'}`, background: viewMode === mode ? '#0F1E3C' : 'white', color: viewMode === mode ? '#00D4AA' : 'rgba(15,30,60,0.6)', fontSize: 13, fontWeight: viewMode === mode ? 700 : 400, cursor: 'pointer' }}>
      {label}
    </button>
  )

  return (
    <div style={{ maxWidth: 1060 }}>

      {/* Profile context strip */}
      <div style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Balance', value: fmt(balance) },
          { label: 'Fund', value: `${sp?.fund_name ?? '—'} · ${fundOption}` },
          { label: 'SG contributions', value: `${fmt(sgContrib)}/yr` },
          { label: 'Current retirement target', value: `Age ${defaultRetire}` },
          { label: 'Years remaining', value: `${Math.max(0, defaultRetire - currentAge)} years` },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#0F1E3C' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabBtn('custom', '🔧 Custom build')}
        {tabBtn('retirement-age', '🕐 Retirement age')}
        {tabBtn('investment', '📊 Investment option')}
        {tabBtn('combined', '⭐ Combined scenarios')}
      </div>

      {/* ── RETIREMENT AGE TAB ──────────────────────────────────────────── */}
      {viewMode === 'retirement-age' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>What if I retire at a different age?</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              Keeping your current fund and contributions — only changing when you stop working. Based on {currentReturn}% return at {feePct}% fee.
            </div>
          </div>

          {/* Chart */}
          <div style={{ ...c, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Portfolio growth to each retirement age
            </div>
            <ComparisonChart datasets={chartDatasets} retireAt={defaultRetire} currentAge={currentAge} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {chartDatasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 16, height: 2.5, background: ds.colour, borderRadius: 2, opacity: ds.dashed ? 0.5 : 1 }} />
                  <span style={{ color: 'rgba(15,30,60,0.55)' }}>{ds.label}{ds.dashed ? ' (current target)' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {retirementAgeResults.map((r, i) => {
              const colours = ['#EF4444','#F97316','#F59E0B','#534AB7','#00D4AA','#10B981']
              const isCurrent = r.retireAge === defaultRetire
              const isBest = r.bal === Math.max(...retirementAgeResults.map(x => x.bal))
              return (
                <ScenarioCard key={r.retireAge}
                  label={`Retire at ${r.retireAge}`}
                  icon={r.retireAge <= 55 ? '🏖️' : r.retireAge <= 60 ? '⛱️' : r.retireAge <= 65 ? '🏡' : '👴'}
                  colour={colours[i]}
                  retirementBalance={r.bal}
                  annualIncome={r.income}
                  yearsToRetire={r.yrs}
                  asfaGap={Math.max(0, ASFA_COMFORTABLE - r.income)}
                  isBase={isCurrent}
                  isBest={isBest && !isCurrent}
                  extraVsBase={r.bal - project(balance, sgContrib, currentReturn, feePct, Math.max(1, defaultRetire - currentAge))}
                />
              )
            })}
          </div>

          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(15,30,60,0.03)', borderRadius: 10, fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7 }}>
            💡 <strong>Key insight:</strong> Every extra year of work adds contributions AND removes a year of drawdown, compounding significantly. The difference between retiring at 60 vs 65 is typically larger than most people expect.
          </div>
        </div>
      )}

      {/* ── INVESTMENT OPTION TAB ───────────────────────────────────────── */}
      {viewMode === 'investment' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>What if I change my investment option?</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              Keeping your retirement age ({defaultRetire}) and contributions the same — only changing the investment strategy.
              Return and fee assumptions are indicative industry averages.
            </div>
          </div>

          {/* Chart */}
          <div style={{ ...c, marginBottom: 16 }}>
            <ComparisonChart datasets={chartDatasets} retireAt={defaultRetire} currentAge={currentAge} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
              {chartDatasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 16, height: 2.5, background: ds.colour, borderRadius: 2, opacity: ds.dashed ? 0.5 : 1 }} />
                  <span style={{ color: 'rgba(15,30,60,0.55)' }}>{ds.label}{ds.dashed ? ' (current)' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Investment profile table */}
          <div style={c}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              All investment options compared — retire at {defaultRetire}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Option','Return est.','Fee','Retire balance','Annual income','vs current','ASFA gap'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h === 'Option' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investmentResults.map((r, i) => {
                  const isCurrent = r.dynamic
                  const isBest = r.bal === Math.max(...investmentResults.map(x => x.bal))
                  const delta = r.bal - investmentResults[0].bal
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: isBest ? `${r.colour}0a` : isCurrent ? 'rgba(15,30,60,0.02)' : 'transparent' }}>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>{r.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1E3C' }}>
                              {r.label}
                              {isCurrent && <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>YOURS</span>}
                              {isBest && <span style={{ marginLeft: 6, fontSize: 9, background: `${r.colour}20`, color: r.colour, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>BEST</span>}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.45)', marginTop: 1 }}>{r.description}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: '#534AB7', fontWeight: 600 }}>{r.returnRate.toFixed(1)}%</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.fee <= 0.15 ? '#00D4AA' : r.fee <= 0.50 ? '#0F1E3C' : '#D97706' }}>{r.fee.toFixed(2)}%</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 600, color: r.colour }}>{fmtShort(r.bal)}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.income >= ASFA_COMFORTABLE ? '#00D4AA' : '#0F1E3C' }}>{fmt(Math.round(r.income))}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: delta > 0 ? '#00D4AA' : delta < 0 ? '#EF4444' : 'rgba(15,30,60,0.4)', fontWeight: delta !== 0 ? 600 : 400 }}>
                        {isCurrent ? '—' : delta > 0 ? `+${fmtShort(delta)}` : fmtShort(delta)}
                      </td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.income >= ASFA_COMFORTABLE ? '#00D4AA' : '#EF4444' }}>
                        {r.income >= ASFA_COMFORTABLE ? '✓ Met' : `−${fmt(Math.round(ASFA_COMFORTABLE - r.income))}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6 }}>
              Return estimates are indicative based on long-run historical averages. Past performance does not predict future returns. Fee assumptions are representative industry averages — your actual fees may differ.
            </div>
          </div>
        </div>
      )}

      {/* ── COMBINED SCENARIOS TAB ──────────────────────────────────────── */}
      {viewMode === 'combined' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>What if I combine multiple strategies?</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              Each scenario stacks on top of the current path. The last row combines everything to show the maximum possible improvement.
            </div>
          </div>

          <div style={{ ...c, marginBottom: 16 }}>
            <ComparisonChart datasets={chartDatasets} retireAt={defaultRetire} currentAge={currentAge} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {combinedScenarios.map((s, i) => (
              <ScenarioCard key={s.id}
                label={s.label} icon={s.icon} colour={s.colour}
                retirementBalance={s.bal} annualIncome={s.income}
                yearsToRetire={defaultRetire - currentAge}
                asfaGap={s.gap}
                isBase={s.id === 'base'}
                isBest={s.id === 'best'}
                extraVsBase={s.id === 'base' ? 0 : s.bal - combinedScenarios[0].bal}
                description={s.desc}
              />
            ))}
          </div>

          {/* Summary insight */}
          {(() => {
            const base = combinedScenarios[0]
            const best = combinedScenarios[combinedScenarios.length - 1]
            const gain = best.bal - base.bal
            return (
              <div style={{ marginTop: 16, background: '#0F1E3C', borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Maximum improvement opportunity
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                  Combining all three strategies could add <span style={{ color: '#00D4AA' }}>{fmtShort(gain)}</span> to your retirement balance
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  That's {fmt(Math.round(best.income))} vs {fmt(Math.round(base.income))} in annual retirement income — a difference of {fmt(Math.round(best.income - base.income))}/year using a 4% safe withdrawal rate.
                  {best.income >= ASFA_COMFORTABLE && base.income < ASFA_COMFORTABLE && ` This closes your gap to the ASFA Comfortable standard.`}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── CUSTOM BUILD TAB ────────────────────────────────────────────── */}
      {viewMode === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          {/* Controls */}
          <div style={c}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 18 }}>Build your scenario</div>

            {/* Preset buttons */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quick presets</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Retire at 55', fn: () => { setCustomRetireAge(55) } },
                  { label: 'Retire at 60', fn: () => { setCustomRetireAge(60) } },
                  { label: 'Switch to indexed', fn: () => { setSwitchIndexed(true); setCustomReturnRate(7.8); setCustomFee(0.08) } },
                  { label: 'Add $500/mo SS', fn: () => { setCustomMonthlySS(500) } },
                  { label: 'Contribute $20k', fn: () => { setCustomOneTime(20000) } },
                  { label: 'Reset', fn: () => { setCustomRetireAge(defaultRetire); setCustomMonthlySS(0); setCustomReturnRate(currentReturn); setCustomFee(feePct); setCustomOneTime(0); setSwitchIndexed(false) } },
                ].map(p => (
                  <button key={p.label} onClick={p.fn}
                    style={{ padding: '5px 10px', borderRadius: 14, border: '1px solid rgba(15,30,60,0.15)', background: 'white', fontSize: 11, fontWeight: 500, color: p.label === 'Reset' ? '#EF4444' : '#0F1E3C', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Retirement age', min: Math.max(55, currentAge + 1), max: 75, step: 1, val: customRetireAge, set: setCustomRetireAge, fmt: (v: number) => `Age ${v}` },
              { label: 'Monthly salary sacrifice', min: 0, max: 2500, step: 50, val: customMonthlySS, set: setCustomMonthlySS, fmt: (v: number) => `${fmt(v)}/mo` },
              { label: 'Annual return assumption', min: 3, max: 12, step: 0.5, val: customReturnRate, set: setCustomReturnRate, fmt: (v: number) => `${v}%`, disabled: switchIndexed },
              { label: 'Annual fee assumption', min: 0.01, max: 2, step: 0.01, val: customFee, set: setCustomFee, fmt: (v: number) => `${v}%`, disabled: switchIndexed },
            ].map(ctrl => (
              <div key={ctrl.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: ctrl.disabled ? 'rgba(15,30,60,0.3)' : 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ctrl.label}</label>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: ctrl.disabled ? 'rgba(15,30,60,0.3)' : '#534AB7' }}>{ctrl.fmt(ctrl.val)}</span>
                </div>
                <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.val}
                  disabled={ctrl.disabled}
                  onChange={e => ctrl.set(+e.target.value)}
                  style={{ width: '100%', accentColor: '#534AB7', opacity: ctrl.disabled ? 0.3 : 1 }} />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>One-time contribution now</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 12 }}>$</span>
                <input type="number" value={customOneTime || ''} onChange={e => setCustomOneTime(+e.target.value)} placeholder="0"
                  style={{ width: '100%', padding: '8px 10px 8px 22px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0F1E3C' }}>Switch to indexed fund</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 1 }}>Sets return 7.8%, fee 0.08%</div>
              </div>
              <button onClick={() => { setSwitchIndexed(!switchIndexed); if (!switchIndexed) { setCustomReturnRate(7.8); setCustomFee(0.08) } else { setCustomReturnRate(currentReturn); setCustomFee(feePct) }}}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: switchIndexed ? '#00D4AA' : 'rgba(15,30,60,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'left 0.2s', left: switchIndexed ? 23 : 3 }} />
              </button>
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Chart */}
            <div style={c}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 16, height: 2, background: '#8A9BB5' }} /><span style={{ color: 'rgba(15,30,60,0.5)' }}>Current path</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 16, height: 2.5, background: '#00D4AA', borderRadius: 2 }} /><span style={{ color: 'rgba(15,30,60,0.5)' }}>Your scenario</span>
                </div>
              </div>
              <ComparisonChart datasets={chartDatasets} retireAt={customRetireAge} currentAge={currentAge} />
            </div>

            {/* Comparison cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ScenarioCard
                label="Current path" icon="📊" colour="#8A9BB5"
                retirementBalance={baseBalance} annualIncome={baseBalance * 0.04}
                yearsToRetire={defaultRetire - currentAge}
                asfaGap={Math.max(0, ASFA_COMFORTABLE - baseBalance * 0.04)}
                isBase
              />
              <ScenarioCard
                label="Your scenario" icon="⚡" colour="#00D4AA"
                retirementBalance={customResult.bal} annualIncome={customResult.income}
                yearsToRetire={customRetireAge - currentAge}
                asfaGap={customResult.gap}
                isBest={customResult.bal > baseBalance}
                extraVsBase={customResult.delta}
              />
            </div>

            {/* Delta callout */}
            {customResult.delta !== 0 && (
              <div style={{ background: customResult.delta > 0 ? 'rgba(0,212,170,0.08)' : '#FEF2F2', border: `1px solid ${customResult.delta > 0 ? 'rgba(0,212,170,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Balance difference', value: `${customResult.delta > 0 ? '+' : ''}${fmtShort(customResult.delta)}`, colour: customResult.delta > 0 ? '#00D4AA' : '#EF4444' },
                  { label: 'Annual income difference', value: `${customResult.delta > 0 ? '+' : ''}${fmt(Math.round((customResult.income - baseBalance * 0.04)))}`, colour: customResult.delta > 0 ? '#00D4AA' : '#EF4444' },
                  { label: 'ASFA Comfortable', value: customResult.income >= ASFA_COMFORTABLE ? '✓ Met' : `${fmt(Math.round(customResult.gap))} gap`, colour: customResult.income >= ASFA_COMFORTABLE ? '#00D4AA' : '#EF4444' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: s.colour }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Projections use constant annual return assumptions and do not account for market volatility, inflation, tax changes, or fees outside of the investment fee shown. ASFA Comfortable standard {new Date().getFullYear()}: ${ASFA_COMFORTABLE.toLocaleString()}/yr for a single person. Return estimates for investment profiles are indicative long-run averages — actual returns will vary significantly year to year. Not financial advice.
      </div>
    </div>
  )
}
