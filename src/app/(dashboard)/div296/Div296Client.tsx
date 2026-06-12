'use client'
import { useState, useMemo } from 'react'
import { calcDiv296Exposure, yearsToThreshold, fmt, fmtShort, DIV296_THRESHOLD } from '@/lib/calculations'

const THRESHOLD = 3_000_000

// Project year-by-year with optional contribution changes
function buildProjection(balance: number, annualContrib: number, returnRate: number, maxYears = 30) {
  const rows: { year: number; balance: number; aboveThreshold: number; taxEstimate: number }[] = []
  let bal = balance
  for (let i = 1; i <= maxYears; i++) {
    bal = (bal + annualContrib) * (1 + returnRate / 100)
    const above = Math.max(0, bal - THRESHOLD)
    const proportionAbove = above > 0 ? above / bal : 0
    const earnings = bal * returnRate / 100
    const attributable = earnings * proportionAbove
    const tax = attributable * 0.15
    rows.push({ year: i, balance: bal, aboveThreshold: above, taxEstimate: tax })
    if (i > 10 && bal < THRESHOLD * 0.5) break // stop early if far from threshold
  }
  return rows
}

export function Div296Client({ superProfile: sp }: { superProfile: any }) {
  const [balance,      setBalance]      = useState(sp?.current_balance ?? 0)
  const [annualContrib,setAnnualContrib]= useState(
    sp ? Math.round((sp.salary ?? 0) * ((sp.employer_sg_rate ?? 12) / 100)) : 0
  )
  const [returnRate,   setReturnRate]   = useState(7)
  const [age,          setAge]          = useState(sp?.age ?? 40)
  const [showFullTable,setShowFullTable]= useState(false)

  const currentExposure = useMemo(() => calcDiv296Exposure(balance, returnRate / 100), [balance, returnRate])
  const yrsToThresh     = useMemo(() => yearsToThreshold(balance, annualContrib, returnRate / 100, THRESHOLD), [balance, annualContrib, returnRate])
  const projection      = useMemo(() => buildProjection(balance, annualContrib, returnRate, 35), [balance, annualContrib, returnRate])

  // Find year of first exposure
  const firstExposureYear = projection.find(r => r.aboveThreshold > 0)
  const retirementYear    = Math.max(0, 65 - age)
  const balanceAt65       = projection.find(r => r.year === retirementYear)?.balance ?? balance

  // Total tax over 10 years from now (if applicable in future)
  const tenYearTax = projection.slice(0, 10).reduce((s, r) => s + r.taxEstimate, 0)

  // Status classification
  const status = balance >= THRESHOLD
    ? 'exposed'
    : balance >= 2_500_000
    ? 'watch-high'
    : balance >= 2_000_000
    ? 'watch'
    : balance >= 1_500_000
    ? 'monitor'
    : 'safe'

  const statusConfig = {
    exposed:    { label: '⚠ Currently exposed',       bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)',   text: '#7F1D1D', badge: '#EF4444' },
    'watch-high':{ label: '⚠ Getting close — take action', bg: '#FEF2F2', border: 'rgba(239,68,68,0.15)', text: '#7F1D1D', badge: '#F97316' },
    watch:      { label: '⏰ On watch — review annually', bg: '#FFFBEB', border: 'rgba(245,158,11,0.25)', text: '#78350F', badge: '#F59E0B' },
    monitor:    { label: '📊 Monitor as balance grows', bg: '#FFFBEB', border: 'rgba(245,158,11,0.15)', text: '#78350F', badge: '#F59E0B' },
    safe:       { label: '✓ Not currently exposed',   bg: 'rgba(0,212,170,0.06)', border: 'rgba(0,212,170,0.2)', text: '#065F46', badge: '#00D4AA' },
  }[status]

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }

  // Visual balance tracker
  const pctToThreshold = Math.min(100, (balance / THRESHOLD) * 100)
  const trackColour = balance >= THRESHOLD ? '#EF4444' : balance >= 2_500_000 ? '#F97316' : balance >= 2_000_000 ? '#F59E0B' : '#00D4AA'

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* ── WHO THIS APPLIES TO ──────────────────────────────────────── */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '22px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          What is Division 296?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 5 }}>The problem being solved</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Super earnings are currently taxed at 15% — a major concession vs income tax rates of up to 45%. The government decided this concession is excessive for very large balances.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 5 }}>Who it applies to</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Anyone whose <strong style={{ color: '#00D4AA' }}>Total Super Balance exceeds $3 million</strong> on 30 June each year. This includes all your super accounts combined — accumulation, pension, SMSF. Commences 1 July 2026.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 5 }}>What it costs you</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              An <strong style={{ color: '#00D4AA' }}>additional 15% tax</strong> on earnings attributable to the portion above $3M. Not on the full balance — only the proportion above $3M. If your balance is $4M, only 25% of earnings are affected.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 32 }}>
          {[
            { label: 'Commences', value: '1 July 2026' },
            { label: 'First tax assessed', value: 'After 30 June 2027' },
            { label: 'Threshold (not indexed)', value: '$3,000,000' },
            { label: 'Extra tax rate', value: '15% on affected earnings' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#00D4AA', fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INPUTS + STATUS ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Inputs */}
        <div style={c}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 18 }}>Your details</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 5, display: 'block' }}>
              Total super balance — all accounts combined
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
              <input type="number" value={balance} onChange={e => setBalance(+e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 26px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>Include all accumulation + pension accounts across all funds</div>
          </div>

          {/* Progress bar to threshold */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Distance to $3M threshold</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: trackColour }}>{pctToThreshold.toFixed(0)}% of threshold</span>
            </div>
            <div style={{ height: 10, background: 'rgba(15,30,60,0.08)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${pctToThreshold}%`, height: '100%', background: trackColour, borderRadius: 5, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(15,30,60,0.35)' }}>{fmt(balance)}</span>
              <span style={{ fontSize: 10, color: 'rgba(15,30,60,0.35)' }}>$3,000,000 threshold</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 5, display: 'block' }}>Annual contributions</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
                <input type="number" value={annualContrib} onChange={e => setAnnualContrib(+e.target.value)}
                  style={{ width: '100%', padding: '9px 10px 9px 24px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 5, display: 'block' }}>Your age</label>
              <input type="number" value={age} onChange={e => setAge(+e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)' }}>Assumed annual return</label>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{returnRate}%</span>
            </div>
            <input type="range" min={3} max={12} step={0.5} value={returnRate}
              onChange={e => setReturnRate(+e.target.value)}
              style={{ width: '100%', accentColor: '#534AB7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,30,60,0.35)', marginTop: 2 }}>
              <span>3% (conservative)</span><span>7% (balanced)</span><span>12% (high growth)</span>
            </div>
          </div>
        </div>

        {/* Status + current exposure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Status card */}
          <div style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{balance >= THRESHOLD ? '⚠' : balance >= 2_000_000 ? '⏰' : '✓'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: statusConfig.text }}>{statusConfig.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                {
                  label: 'Current status',
                  value: balance >= THRESHOLD ? 'Exposed now' : balance >= 2_500_000 ? `${fmt(THRESHOLD - balance)} to threshold` : 'Not exposed',
                  colour: balance >= THRESHOLD ? '#EF4444' : balance >= 2_500_000 ? '#F97316' : '#00D4AA'
                },
                {
                  label: 'Years to threshold',
                  value: balance >= THRESHOLD ? 'Already there' : yrsToThresh ? `~${yrsToThresh} years` : '25+ years',
                  colour: balance >= THRESHOLD ? '#EF4444' : yrsToThresh && yrsToThresh < 10 ? '#F59E0B' : '#00D4AA'
                },
                {
                  label: 'Est. balance at 65',
                  value: fmt(balanceAt65),
                  colour: balanceAt65 >= THRESHOLD ? '#EF4444' : '#0F1E3C'
                },
                {
                  label: 'Will exceed $3M at 65?',
                  value: balanceAt65 >= THRESHOLD ? '⚠ Yes' : '✓ No',
                  colour: balanceAt65 >= THRESHOLD ? '#EF4444' : '#00D4AA'
                },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: s.colour }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Current tax exposure (if applicable) */}
          {currentExposure.exposed ? (
            <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7F1D1D', marginBottom: 12 }}>⚠ How your tax is calculated today</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Your total balance', value: fmt(balance), note: 'All accounts combined' },
                  { label: 'Amount above $3M threshold', value: fmt(currentExposure.excessBalance!), note: `${((currentExposure.excessBalance! / balance) * 100).toFixed(1)}% of your total balance` },
                  { label: 'Estimated earnings (at ' + returnRate + '%)', value: fmt(balance * returnRate / 100) + '/yr', note: 'Gross investment return' },
                  { label: 'Taxable earnings (attributable portion)', value: fmt(currentExposure.attributableEarnings!) + '/yr', note: `${((currentExposure.excessBalance! / balance) * 100).toFixed(1)}% of total earnings` },
                  { label: 'Additional 15% tax (Division 296)', value: fmt(currentExposure.annualTax) + '/yr', note: 'On top of existing 15% earnings tax', highlight: true },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: r.highlight ? '8px 12px' : '5px 0', borderBottom: r.highlight ? 'none' : '1px solid rgba(239,68,68,0.08)', background: r.highlight ? 'rgba(239,68,68,0.08)' : 'transparent', borderRadius: r.highlight ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#7F1D1D' }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(127,29,29,0.6)', marginTop: 1 }}>{r.note}</div>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: r.highlight ? 700 : 500, color: r.highlight ? '#EF4444' : '#7F1D1D', flexShrink: 0, marginLeft: 12 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(15,30,60,0.03)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 10 }}>📐 How the calculation works (example)</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.8, marginBottom: 12 }}>
                Example: Balance of <strong>$4,000,000</strong> at a 7% return:
              </div>
              {[
                { step: '1', desc: 'Amount above threshold', calc: '$4,000,000 − $3,000,000', result: '= $1,000,000 excess' },
                { step: '2', desc: 'Proportion above threshold', calc: '$1,000,000 ÷ $4,000,000', result: '= 25% of balance' },
                { step: '3', desc: 'Total earnings for the year', calc: '$4,000,000 × 7%', result: '= $280,000 earnings' },
                { step: '4', desc: 'Attributable earnings (25%)', calc: '$280,000 × 25%', result: '= $70,000 affected' },
                { step: '5', desc: 'Division 296 tax at 15%', calc: '$70,000 × 15%', result: '= $10,500/yr extra tax', highlight: true },
              ].map(r => (
                <div key={r.step} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(15,30,60,0.05)', alignItems: 'center', background: r.highlight ? 'rgba(239,68,68,0.05)' : 'transparent', borderRadius: r.highlight ? 6 : 0, paddingLeft: r.highlight ? 8 : 0 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: r.highlight ? 'rgba(239,68,68,0.12)' : 'rgba(83,74,183,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: r.highlight ? '#EF4444' : '#534AB7', flexShrink: 0 }}>{r.step}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: '#0F1E3C' }}>{r.desc}</span>
                    <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginLeft: 6 }}>{r.calc}</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: r.highlight ? 700 : 500, color: r.highlight ? '#EF4444' : '#0F1E3C', flexShrink: 0 }}>{r.result}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── YEAR-BY-YEAR PROJECTION ───────────────────────────────────── */}
      <div style={{ ...c, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>Year-by-year projection</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              At {returnRate}% annual return with {fmt(annualContrib)}/yr contributions
              {firstExposureYear ? ` · Threshold crossed around year ${firstExposureYear.year}` : ' · Threshold not reached within 35 years at these settings'}
            </div>
          </div>
          <button onClick={() => setShowFullTable(!showFullTable)}
            style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(15,30,60,0.15)', background: 'white', cursor: 'pointer', color: '#0F1E3C' }}>
            {showFullTable ? 'Show key years' : 'Show all years'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {['Year','Your age','Projected balance','Amount above $3M','% of balance above threshold','Est. extra tax / yr','Status'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: h === 'Year' || h === 'Your age' || h === 'Status' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projection
                .filter((r, i) => showFullTable ? true : (i < 5 || r.year % 5 === 0 || (firstExposureYear && Math.abs(r.year - firstExposureYear.year) <= 2) || r.year === retirementYear))
                .slice(0, showFullTable ? 35 : 14)
                .map(r => {
                  const isRetirement = r.year === retirementYear
                  const isExposed    = r.aboveThreshold > 0
                  const isFirstYear  = firstExposureYear && r.year === firstExposureYear.year
                  return (
                    <tr key={r.year} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: isFirstYear ? 'rgba(239,68,68,0.05)' : isRetirement ? 'rgba(83,74,183,0.05)' : isExposed ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                      <td style={{ padding: '9px 10px', color: '#0F1E3C', fontWeight: isRetirement || isFirstYear ? 600 : 400 }}>
                        Year {r.year}
                        {isRetirement && <span style={{ marginLeft: 6, fontSize: 9, background: '#EDE9FE', color: '#3C3489', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>RETIRE</span>}
                        {isFirstYear && <span style={{ marginLeft: 6, fontSize: 9, background: '#FEF2F2', color: '#991B1B', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>THRESHOLD</span>}
                      </td>
                      <td style={{ padding: '9px 10px', color: 'rgba(15,30,60,0.6)' }}>{age + r.year}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.balance >= THRESHOLD ? '#EF4444' : '#0F1E3C', fontWeight: r.balance >= THRESHOLD ? 600 : 400 }}>{fmtShort(r.balance)}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.aboveThreshold > 0 ? '#EF4444' : 'rgba(15,30,60,0.3)' }}>{r.aboveThreshold > 0 ? fmtShort(r.aboveThreshold) : '—'}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.aboveThreshold > 0 ? '#D97706' : 'rgba(15,30,60,0.3)' }}>{r.aboveThreshold > 0 ? `${((r.aboveThreshold / r.balance) * 100).toFixed(0)}%` : '—'}</td>
                      <td style={{ padding: '9px 10px', fontFamily: 'monospace', textAlign: 'right', color: r.taxEstimate > 0 ? '#EF4444' : 'rgba(15,30,60,0.3)', fontWeight: r.taxEstimate > 0 ? 600 : 400 }}>{r.taxEstimate > 0 ? fmt(r.taxEstimate) : '—'}</td>
                      <td style={{ padding: '9px 10px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
                          background: r.aboveThreshold > 0 ? '#FEF2F2' : 'rgba(0,212,170,0.08)',
                          color: r.aboveThreshold > 0 ? '#991B1B' : '#065F46' }}>
                          {r.aboveThreshold > 0 ? '⚠ Exposed' : '✓ Under threshold'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── WHAT YOU CAN DO ──────────────────────────────────────────── */}
      {(balance >= 1_500_000 || (firstExposureYear && firstExposureYear.year <= 20)) && (
        <div style={{ ...c, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 14 }}>Strategies to reduce Division 296 exposure</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '⚖️', title: 'Contribution splitting with spouse', desc: 'Redirect up to 85% of your annual concessional contributions to your spouse\'s fund. Keeps your balance lower while the money stays in super. Most effective strategy for couples.', link: '/spouse', linkLabel: 'Open spouse analysis →' },
              { icon: '🏦', title: 'Withdraw and reinvest outside super', desc: 'Once you\'ve met a condition of release, withdrawing amounts above $3M and investing in your own name (or a family trust) avoids the 15% additional tax, though you lose super\'s concessional tax environment on earnings.', link: null, linkLabel: null },
              { icon: '🛑', title: 'Stop or reduce contributions', desc: 'If your balance is already near $3M, voluntary contributions above the SG rate accelerate when you\'ll cross the threshold. Consider whether additional contributions are still tax-effective.', link: '/contributions', linkLabel: 'Open contributions →' },
              { icon: '🏠', title: 'Downsizer contributions (if 55+)', desc: 'You might prefer to keep downsizer contributions in a spouse\'s lower-balance account rather than your own. This grows the lower balance rather than adding to an already large balance.', link: '/spouse', linkLabel: 'See spouse page →' },
            ].map(item => (
              <div key={item.title} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(15,30,60,0.07)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 5 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: item.link ? 8 : 0 }}>{item.desc}</div>
                    {item.link && (
                      <a href={item.link} style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, textDecoration: 'none' }}>{item.linkLabel}</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Division 296 modelling is based on the Treasury Laws Amendment (Better Targeted Superannuation Concessions) Bill 2025, commencing 1 July 2026. The $3M threshold is not indexed to inflation. Projections assume a constant {returnRate}% annual return and ongoing contributions — actual results will vary. Earnings tax calculations are illustrative; actual tax depends on your fund's reported earnings. Before making decisions about your super, seek advice from a licensed financial adviser or tax agent.
      </div>
    </div>
  )
}
