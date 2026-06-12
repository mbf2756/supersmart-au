'use client'
import { useState, useMemo } from 'react'
import { projectBalance, fmt, fmtShort, getMarginalRate } from '@/lib/calculations'

const BEST_INDEXED_FEE = 0.02   // Hostplus Indexed Shares
const ASFA_COMFORTABLE = 51000

// Build year-by-year projection data for chart
function buildProjectionData(
  balance: number, annualContrib: number,
  returnRate: number, years: number, feePct: number
) {
  const pts: number[] = []
  let b = balance
  for (let i = 0; i <= Math.min(years, 35); i++) {
    pts.push(b)
    b = (b + annualContrib) * (1 + returnRate / 100 - feePct / 100)
  }
  return pts
}

// SVG sparkline projection chart
function ProjectionChart({
  baseData, scenarioData, retirementYear, label
}: {
  baseData: number[]; scenarioData: number[]; retirementYear: number; label: string
}) {
  const w = 580, h = 160, pad = { l: 48, r: 16, t: 10, b: 28 }
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b
  const years = Math.max(baseData.length, scenarioData.length) - 1
  const maxVal = Math.max(...baseData, ...scenarioData) || 1

  function toX(i: number) { return pad.l + (i / years) * chartW }
  function toY(v: number) { return pad.t + chartH - (v / maxVal) * chartH }
  function makePath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
  }

  const checkpoints = [0, 5, 10, 15, 20, 25, 30, 35].filter(y => y <= years)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + chartH * (1 - f)} y2={pad.t + chartH * (1 - f)}
          stroke="rgba(15,30,60,0.06)" strokeWidth="1" />
      ))}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <text key={f} x={pad.l - 4} y={pad.t + chartH * (1 - f) + 3} textAnchor="end" fill="rgba(15,30,60,0.35)" fontSize="9">
          {fmtShort(maxVal * f)}
        </text>
      ))}
      {checkpoints.map(y => (
        <text key={y} x={toX(y)} y={h - 6} textAnchor="middle" fill="rgba(15,30,60,0.35)" fontSize="9">
          {y === 0 ? 'Now' : `+${y}yr`}
        </text>
      ))}
      {/* Retirement line */}
      {retirementYear <= years && (
        <>
          <line x1={toX(retirementYear)} x2={toX(retirementYear)} y1={pad.t} y2={pad.t + chartH}
            stroke="#534AB7" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          <text x={toX(retirementYear) + 4} y={pad.t + 10} fill="#534AB7" fontSize="9" opacity="0.6">retire</text>
        </>
      )}
      {/* Base line */}
      <path d={makePath(baseData)} fill="none" stroke="#534AB7" strokeWidth="2" strokeDasharray="5,3" opacity="0.5" />
      {/* Scenario area + line */}
      <path d={`${makePath(scenarioData)} L${toX(scenarioData.length - 1)},${pad.t + chartH} L${toX(0)},${pad.t + chartH} Z`}
        fill="url(#simGrad)" />
      <path d={makePath(scenarioData)} fill="none" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" />
      {/* End dots */}
      <circle cx={toX(Math.min(baseData.length - 1, years))} cy={toY(baseData[Math.min(baseData.length - 1, years)])} r="4" fill="#534AB7" />
      <circle cx={toX(Math.min(scenarioData.length - 1, years))} cy={toY(scenarioData[Math.min(scenarioData.length - 1, years)])} r="4" fill="#00D4AA" />
    </svg>
  )
}

type Preset = {
  label: string
  icon: string
  apply: (s: SimState) => Partial<SimState>
}

interface SimState {
  retirementAge: number
  monthlySS: number
  switchToIndexed: boolean
  extraWorkYears: number
  oneTimeContrib: number
  returnRate: number
}

const PRESETS: Preset[] = [
  { label: 'Retire at 60', icon: '⏰', apply: (s) => ({ retirementAge: 60 }) },
  { label: 'Add $200/month', icon: '💰', apply: (s) => ({ monthlySS: s.monthlySS + 200 }) },
  { label: 'Switch to indexed', icon: '📊', apply: (s) => ({ switchToIndexed: true }) },
  { label: 'Work 3 more years', icon: '💼', apply: (s) => ({ extraWorkYears: 3 }) },
  { label: 'Contribute $20k now', icon: '🚀', apply: (s) => ({ oneTimeContrib: 20000 }) },
]

export function SimulatorClient({
  superProfile: sp, subscription
}: { superProfile: any; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'

  const baseRetirementAge = sp?.target_retirement_age ?? 65
  const currentAge = sp?.age ?? 40
  const salary = sp?.salary ?? 0
  const balance = sp?.current_balance ?? 0
  const feePct = sp?.fund_fee_pct ?? 0.62
  const sgRate = sp?.employer_sg_rate ?? 12
  const sgContrib = salary * sgRate / 100

  const [sim, setSim] = useState<SimState>({
    retirementAge: baseRetirementAge,
    monthlySS: 0,
    switchToIndexed: false,
    extraWorkYears: 0,
    oneTimeContrib: 0,
    returnRate: 7,
  })

  function update(partial: Partial<SimState>) {
    setSim(prev => ({ ...prev, ...partial }))
  }

  // ── BASE scenario ─────────────────────────────────────────────────────────
  const baseYrs = Math.max(1, baseRetirementAge - currentAge)
  const baseData = useMemo(
    () => buildProjectionData(balance, sgContrib, sim.returnRate, baseYrs, feePct),
    [balance, sgContrib, sim.returnRate, baseYrs, feePct]
  )
  const baseBalance = projectBalance(balance, sgContrib, (sim.returnRate - feePct) / 100, baseYrs)
  const baseIncome = baseBalance * 0.04

  // ── SCENARIO ──────────────────────────────────────────────────────────────
  const scenarioRetirementAge = sim.retirementAge + sim.extraWorkYears
  const scenarioYrs = Math.max(1, scenarioRetirementAge - currentAge)
  const scenarioFee = sim.switchToIndexed ? BEST_INDEXED_FEE : feePct
  const scenarioAnnualContrib = sgContrib + sim.monthlySS * 12
  const scenarioStartBalance = balance + sim.oneTimeContrib

  const scenarioData = useMemo(
    () => buildProjectionData(scenarioStartBalance, scenarioAnnualContrib, sim.returnRate, scenarioYrs, scenarioFee),
    [scenarioStartBalance, scenarioAnnualContrib, sim.returnRate, scenarioYrs, scenarioFee]
  )
  const scenarioBalance = projectBalance(scenarioStartBalance, scenarioAnnualContrib, (sim.returnRate - scenarioFee) / 100, scenarioYrs)
  const scenarioIncome = scenarioBalance * 0.04

  // Deltas
  const balanceDelta = scenarioBalance - baseBalance
  const incomeDelta  = scenarioIncome - baseIncome
  const changed = sim.retirementAge !== baseRetirementAge || sim.monthlySS > 0 ||
    sim.switchToIndexed || sim.extraWorkYears !== 0 || sim.oneTimeContrib > 0

  // Tax saving from SS
  const marginal = getMarginalRate(salary)
  const ssTaxSaving = sim.monthlySS * 12 * (marginal - 0.15)

  const retirementYear = baseRetirementAge - currentAge

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 680, background: 'white', borderRadius: 20, padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>What-If Simulator</h3>
        <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Test retirement scenarios in real time. Retire at 60? Add $200/month? Switch to indexed? See the exact dollar impact instantly.
        </p>
        <a href="/pricing" style={{ display: 'inline-block', background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
          Upgrade to unlock →
        </a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* Preset buttons */}
      <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Quick presets — click to apply
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(preset => (
            <button key={preset.label} onClick={() => update(preset.apply(sim))}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: '1.5px solid rgba(15,30,60,0.15)', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0F1E3C', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#00D4AA'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,212,170,0.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,30,60,0.15)'; (e.currentTarget as HTMLElement).style.background = 'white' }}>
              <span>{preset.icon}</span>{preset.label}
            </button>
          ))}
          <button onClick={() => setSim({ retirementAge: baseRetirementAge, monthlySS: 0, switchToIndexed: false, extraWorkYears: 0, oneTimeContrib: 0, returnRate: 7 })}
            style={{ padding: '8px 14px', borderRadius: 20, border: '1.5px solid rgba(239,68,68,0.3)', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#EF4444' }}>
            Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 20 }}>

        {/* Controls */}
        <div style={{ background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 18 }}>Adjust your scenario</div>

          {/* Retirement age */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Retire at age
              </label>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: sim.retirementAge < baseRetirementAge ? '#EF4444' : sim.retirementAge > baseRetirementAge ? '#00D4AA' : '#0F1E3C' }}>
                {sim.retirementAge + sim.extraWorkYears}
              </span>
            </div>
            <input type="range" min={55} max={72} value={sim.retirementAge} onChange={e => update({ retirementAge: +e.target.value })}
              style={{ width: '100%', accentColor: '#534AB7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,30,60,0.35)', marginTop: 2 }}>
              <span>55 (early)</span><span>65 (standard)</span><span>72 (late)</span>
            </div>
          </div>

          {/* Monthly SS */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Add monthly sacrifice</label>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#00D4AA' }}>{fmt(sim.monthlySS)}/mo</span>
            </div>
            <input type="range" min={0} max={2000} step={50} value={sim.monthlySS} onChange={e => update({ monthlySS: +e.target.value })}
              style={{ width: '100%', accentColor: '#534AB7' }} />
            {sim.monthlySS > 0 && (
              <div style={{ fontSize: 11, color: '#065F46', marginTop: 3 }}>
                Tax saving: {fmt(Math.round(ssTaxSaving))} /yr at {(marginal * 100).toFixed(0)}% marginal rate
              </div>
            )}
          </div>

          {/* Work extra years */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Extra years working</label>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0F1E3C' }}>+{sim.extraWorkYears} yrs</span>
            </div>
            <input type="range" min={0} max={10} step={1} value={sim.extraWorkYears} onChange={e => update({ extraWorkYears: +e.target.value })}
              style={{ width: '100%', accentColor: '#534AB7' }} />
          </div>

          {/* One-time contribution */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
              One-time contribution now
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 12 }}>$</span>
              <input type="number" value={sim.oneTimeContrib || ''} onChange={e => update({ oneTimeContrib: +e.target.value })}
                placeholder="0"
                style={{ width: '100%', padding: '9px 10px 9px 22px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
          </div>

          {/* Switch to indexed toggle */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Switch to indexed</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 2 }}>{feePct}% → {BEST_INDEXED_FEE}%</div>
              </div>
              <button onClick={() => update({ switchToIndexed: !sim.switchToIndexed })}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: sim.switchToIndexed ? '#00D4AA' : 'rgba(15,30,60,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, transition: 'left 0.2s', left: sim.switchToIndexed ? 23 : 3 }} />
              </button>
            </div>
          </div>

          {/* Return rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Return assumption</label>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{sim.returnRate}%</span>
            </div>
            <input type="range" min={3} max={12} step={0.5} value={sim.returnRate} onChange={e => update({ returnRate: +e.target.value })}
              style={{ width: '100%', accentColor: '#534AB7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,30,60,0.35)', marginTop: 2 }}>
              <span>3% conservative</span><span>7% balanced</span><span>12% growth</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Base scenario', tag: 'Current path', balance: baseBalance, income: baseIncome, age: baseRetirementAge, color: '#534AB7', isBase: true },
              { label: 'Your scenario', tag: changed ? 'Modified' : 'Same as base', balance: scenarioBalance, income: scenarioIncome, age: scenarioRetirementAge, color: '#00D4AA', isBase: false },
            ].map(s => (
              <div key={s.label} style={{ background: s.isBase ? '#F8F9FA' : 'white', borderRadius: 14, padding: '16px 18px', border: `2px solid ${s.isBase ? 'rgba(15,30,60,0.1)' : '#00D4AA'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: s.isBase ? 'rgba(15,30,60,0.08)' : 'rgba(0,212,170,0.1)',
                    color: s.isBase ? 'rgba(15,30,60,0.5)' : '#065F46' }}>{s.tag}</span>
                </div>
                {[
                  { label: 'Retire at', value: `Age ${s.age}` },
                  { label: 'Balance at retirement', value: fmtShort(s.balance) },
                  { label: 'Annual income (4% SWR)', value: fmt(Math.round(s.income)) },
                  { label: 'vs ASFA Comfortable', value: s.income >= ASFA_COMFORTABLE ? '✓ Met' : `${fmt(Math.round(ASFA_COMFORTABLE - s.income))} gap` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>{r.label}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: s.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Delta callout */}
          {changed && (
            <div style={{ background: balanceDelta > 0 ? 'rgba(0,212,170,0.08)' : '#FEF2F2', border: `1px solid ${balanceDelta > 0 ? 'rgba(0,212,170,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 3 }}>Balance difference</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: balanceDelta > 0 ? '#00D4AA' : '#EF4444' }}>
                    {balanceDelta > 0 ? '+' : ''}{fmtShort(balanceDelta)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 3 }}>Annual income difference</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: incomeDelta > 0 ? '#00D4AA' : '#EF4444' }}>
                    {incomeDelta > 0 ? '+' : ''}{fmt(Math.round(incomeDelta))}/yr
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(15,30,60,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio projection</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 18, height: 2, background: '#534AB7' }} />
                  <span style={{ color: 'rgba(15,30,60,0.5)' }}>Base</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 18, height: 2.5, background: '#00D4AA', borderRadius: 2 }} />
                  <span style={{ color: 'rgba(15,30,60,0.5)' }}>Scenario</span>
                </div>
              </div>
            </div>
            <ProjectionChart
              baseData={baseData}
              scenarioData={scenarioData}
              retirementYear={retirementYear}
              label="projection"
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Projections use a constant {sim.returnRate}% gross return assumption. Indexed scenario uses {BEST_INDEXED_FEE}% fee (Hostplus Indexed Shares). Salary sacrifice tax savings use 2025–26 ATO marginal rates and do not include Medicare levy. All figures are illustrative — not financial advice.
      </div>
    </div>
  )
}
