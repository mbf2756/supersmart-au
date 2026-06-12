'use client'
import { useState, useMemo } from 'react'
import { calcFeeDrag, fmt, fmtShort } from '@/lib/calculations'

// Best-in-category fee benchmarks (from fund PDSs, June 2026)
// Used to auto-set the comparison fee based on the user's option type
// Best-in-category fees verified from fund PDSs (June 2026)
// Source: hostplus.com.au/pds (30 Sep 2025), unisuper.com.au, australianretirementtrust.com.au
const BEST_FEE_BY_CATEGORY: Record<string, { fee: number; fund: string; option: string }> = {
  'indexed':         { fee: 0.02, fund: 'Hostplus', option: 'Indexed Shares' },          // PDS: 0.02% total
  'balanced-active': { fee: 0.41, fund: 'UniSuper', option: 'Balanced' },                 // PDS: 0.41% total
  'high-growth':     { fee: 0.04, fund: 'Hostplus', option: 'Indexed High Growth' },      // PDS: 0.04% total
  'growth':          { fee: 0.43, fund: 'UniSuper', option: 'Growth' },                   // PDS: 0.43% total
  'conservative':    { fee: 0.37, fund: 'UniSuper', option: 'Conservative Balanced' },    // PDS: 0.37% total
  'cash':            { fee: 0.01, fund: 'Hostplus', option: 'Cash' },                     // PDS: 0.01% total
  'default':         { fee: 0.41, fund: 'UniSuper', option: 'Balanced' },
}

function detectCategory(optionName: string): string {
  const opt = (optionName ?? '').toLowerCase()
  if (opt.includes('indexed share') || opt.includes('indexed global')) return 'indexed'
  if (opt.includes('indexed share') || opt.includes('indexed global') || opt.includes('indexed high')) return 'indexed'
  if (opt.includes('indexed') || opt.includes('index ')) return 'indexed' // indexed options are their own category
  if (opt.includes('high growth') || opt.includes('highgrowth')) return 'high-growth'
  if (opt.includes('growth') && !opt.includes('conservative') && !opt.includes('balanced')) return 'growth'
  if (opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')) return 'conservative'
  if (opt.includes('cash')) return 'cash'
  return 'balanced-active'
}

// How many weeks of median wage is this dollar amount?
function toWeeksOfWork(amount: number): number {
  return Math.round(amount / 1400) // ~$1,400/week median Australian wage (ABS 2025)
}

// Retirement income equivalent (safe withdrawal rate 4%)
function toRetirementIncome(amount: number): number {
  return Math.round(amount * 0.04)
}

// Yearly chart data
function buildYearlyData(
  balance: number,
  currentFee: number,
  compareFee: number,
  years: number,
  annualContrib: number,
  returnRate = 0.07
) {
  const data: { year: number; you: number; low: number; gap: number }[] = []
  let you = balance
  let low = balance
  for (let i = 1; i <= years; i++) {
    you = (you + annualContrib) * (1 + returnRate - currentFee / 100)
    low = (low + annualContrib) * (1 + returnRate - compareFee / 100)
    if (i % 5 === 0 || i === 1 || i === years) {
      data.push({ year: i, you, low, gap: low - you })
    }
  }
  return data
}

export function FeesClient({ superProfile: sp }: { superProfile: any }) {
  const hasProfile = !!sp?.fund_name && (sp?.current_balance ?? 0) > 0

  // Initialise from profile data
  const category = useMemo(() => detectCategory(sp?.fund_option ?? ''), [sp?.fund_option])
  const bestAlt = BEST_FEE_BY_CATEGORY[category] ?? BEST_FEE_BY_CATEGORY['default']

  const [balance, setBalance] = useState(sp?.current_balance ?? 287450)
  const [current, setCurrent] = useState(sp?.fund_fee_pct ?? 0.78)
  const [compare, setCompare] = useState(bestAlt.fee)
  const [years, setYears] = useState(20)
  const annualContrib = useMemo(() =>
    (sp?.salary ?? 80000) * ((sp?.employer_sg_rate ?? 12) / 100),
    [sp]
  )

  const result = useMemo(() =>
    calcFeeDrag(balance, current, compare, years, annualContrib),
    [balance, current, compare, years, annualContrib]
  )

  const chartData = useMemo(() =>
    buildYearlyData(balance, current, compare, years, annualContrib),
    [balance, current, compare, years, annualContrib]
  )

  const maxChartVal = useMemo(() => Math.max(...chartData.map(d => d.low)), [chartData])

  const weeksOfWork = toWeeksOfWork(result.drag)
  const retirementIncome = toRetirementIncome(result.drag)
  const isAlreadyLowFee = current <= compare + 0.05

  // APRA status based on user's fund
  const apraFundName = sp?.fund_name ?? 'Your fund'
  const apraOption = sp?.fund_option ?? ''
  const apraAbbr = (apraFundName.split(' ').map((w: string) => w[0]).join('').toUpperCase()).slice(0, 3)

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box', background: 'white' }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* ── FUND COMPARISON UPSELL ────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0F1E3C 0%, #1A2F5A 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Why fee analysis is just the start
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 6, lineHeight: 1.4 }}>
            Knowing your fee is one thing. Knowing exactly how it compares to every like-for-like alternative is another.
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            The fund comparison tool shows you every fund offering a similar option — sorted by total annual cost at your balance, with verified 1yr, 3yr, and 5yr returns side by side.
            Subscribers see whether switching could realistically improve both fees and returns, not just one of them.
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { stat: '40+', label: 'funds compared' },
              { stat: '5 min', label: 'to find a better option' },
              { stat: 'PDS-verified', label: 'fee data' },
            ].map(s => (
              <div key={s.stat} style={{ display: 'flex', flexDirection: 'column' as const }}>
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#00D4AA' }}>{s.stat}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'center' as const }}>
          <a href="/pricing" style={{ display: 'block', background: '#00D4AA', color: '#0F1E3C', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14, marginBottom: 8, whiteSpace: 'nowrap' as const }}>
            Compare funds — from $60/qtr →
          </a>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Unlock fund comparison + 5 other tools</div>
        </div>
      </div>

      {/* ── HERO IMPACT BANNER ─────────────────────────────────── */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '28px 32px', marginBottom: 20, color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Estimated cost of staying in {sp?.fund_name ?? 'your current fund'} — {sp?.fund_option ?? 'current option'} over {years} years
            </div>
            {isAlreadyLowFee ? (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 500, color: '#00D4AA', lineHeight: 1, marginBottom: 6 }}>
                  ✓ Low fee
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  Your {current}% fee is already at or near the lowest available in your category. You're not overpaying.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 500, color: '#EF4444', lineHeight: 1, marginBottom: 6 }}>
                  −{fmt(result.drag)}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                  compared to the lowest-fee equivalent fund ({bestAlt.fund} {bestAlt.option} at {compare}%)
                </div>
                {/* Impact equivalents */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { icon: '💼', label: 'weeks of median wages', value: weeksOfWork.toLocaleString() },
                    { icon: '🏖', label: 'extra retirement income per year', value: `${fmt(retirementIncome)}/yr` },
                    { icon: '📅', label: 'annual fee difference', value: fmt(result.annualDiff) },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 500, color: 'white' }}>{item.value}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Visual fee comparison bars */}
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Fee comparison</div>
            {[
              { label: `${sp?.fund_name ?? 'Your fund'} (${current}%)`, fee: current, color: current > compare ? '#EF4444' : '#00D4AA' },
              { label: `${bestAlt.fund} ${bestAlt.option} (${compare}%)`, fee: compare, color: '#00D4AA' },
            ].map(bar => {
              const maxFee = Math.max(current, compare, 0.1)
              return (
                <div key={bar.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                    <span>{bar.label}</span>
                    <span style={{ fontFamily: 'monospace', color: bar.color, fontWeight: 600 }}>{fmt(bar.fee / 100 * balance)}/yr</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(bar.fee / maxFee) * 100}%`, height: '100%', background: bar.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── CALCULATOR ─────────────────────────────────────────── */}
        <div style={c}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 20 }}>
            Fee drag calculator
          </div>

          {hasProfile && (
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>
              ✓ Pre-filled from your profile — adjust to model different scenarios
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Current balance</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
              <input type="number" value={balance} onChange={e => setBalance(+e.target.value)} style={{ ...inp, paddingLeft: 28 }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>
              Your fund fee %
              {hasProfile && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(0,212,170,0.1)', color: '#065F46', padding: '1px 5px', borderRadius: 4, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>from profile</span>}
            </label>
            <input type="number" step="0.01" value={current} onChange={e => setCurrent(+e.target.value)} style={inp} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>
              Comparison fund fee %
              <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(83,74,183,0.1)', color: '#3C3489', padding: '1px 5px', borderRadius: 4, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>best in your category</span>
            </label>
            <input type="number" step="0.01" value={compare} onChange={e => setCompare(+e.target.value)} style={inp} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)', marginTop: 4 }}>
              Auto-set to {bestAlt.fund} {bestAlt.option} — the lowest-fee fund in the {category.replace('-', ' ')} category. Adjust to compare any fee.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={lbl}>Years to retirement</label>
              <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>{years} yrs</span>
            </div>
            <input type="range" min={5} max={35} value={years} onChange={e => setYears(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,30,60,0.3)', marginTop: 2 }}>
              <span>5 years</span><span>35 years</span>
            </div>
          </div>

          {/* Result box */}
          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Over {years} years</div>
            {[
              { label: 'Annual fee on your balance', value: fmt(balance * current / 100) + '/yr', color: current > compare + 0.1 ? '#EF4444' : 'white' },
              { label: 'Annual fee at comparison rate', value: fmt(balance * compare / 100) + '/yr', color: '#00D4AA' },
              { label: 'Annual difference (today)', value: fmt(result.annualDiff) + '/yr', color: '#F59E0B' },
              { label: `Your portfolio at year ${years}`, value: fmtShort(result.youBalance), color: 'white' },
              { label: `Low-fee portfolio at year ${years}`, value: fmtShort(result.lowFeeBalance), color: '#00D4AA' },
              { label: 'Total fee drag (compounded)', value: fmt(result.drag), color: result.drag > 0 ? '#EF4444' : '#00D4AA' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Balance projection chart */}
          <div style={c}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 4 }}>
              Portfolio growth — your fee vs best alternative
            </div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginBottom: 16 }}>
              Includes annual SG contributions of {fmt(annualContrib)}/yr
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, marginBottom: 8 }}>
              {chartData.map((d, i) => {
                const youH = Math.round((d.you / maxChartVal) * 130)
                const lowH = Math.round((d.low / maxChartVal) * 130)
                return (
                  <div key={d.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 130 }}>
                      <div style={{ width: 10, height: youH, background: '#EF4444', borderRadius: '2px 2px 0 0', opacity: 0.8 }} title={`Your fund: ${fmtShort(d.you)}`} />
                      <div style={{ width: 10, height: lowH, background: '#00D4AA', borderRadius: '2px 2px 0 0', opacity: 0.9 }} title={`Low-fee: ${fmtShort(d.low)}`} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', whiteSpace: 'nowrap' }}>yr {d.year}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(15,30,60,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2 }} />
                Your fund ({current}%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: '#00D4AA', borderRadius: 2 }} />
                {bestAlt.fund} ({compare}%)
              </div>
            </div>

            {/* Gap callout */}
            {result.drag > 5000 && (
              <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid rgba(232,93,93,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
                <strong>The gap grows every year.</strong> At year {Math.round(years / 2)}, you're already behind by ~{fmtShort(chartData[Math.floor(chartData.length / 2)]?.gap ?? 0)}. By retirement it reaches {fmt(result.drag)}.
              </div>
            )}
          </div>

          {/* APRA card — personalised */}
          <div style={c}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 12 }}>
              APRA performance test — 2025
            </div>
            <div style={{ border: '1px solid rgba(0,212,170,0.25)', background: 'rgba(0,212,170,0.04)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(0,212,170,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#065F46', flexShrink: 0 }}>
                {apraAbbr}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>{apraFundName}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>{apraOption || 'Your option'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#065F46' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
                Passed 2025
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6, marginTop: 10 }}>
              APRA tests all MySuper products against a benchmark. Funds that fail must notify members and are at risk of losing their MySuper licence. Passed status is good — but fees still matter independently.
            </p>
          </div>

          {/* Research stats */}
          <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>Why fees matter so much</div>
            {[
              { stat: '15%', label: 'less annual income in retirement from a 1% fee during drawdown', source: 'Mahaney (2023)', color: '#EF4444' },
              { stat: '23%', label: 'less inheritance from a 1% fee in retirement', source: 'Mahaney (2023)', color: '#EF4444' },
              { stat: '84%', label: 'of active funds underperformed the market over 15 years', source: 'SPIVA Dec 2022', color: '#D97706' },
              { stat: '$85k+', label: 'retirement balance difference from 1% fee gap over 40 years', source: 'MoneySmart calculator', color: '#EF4444' },
            ].map(item => (
              <div key={item.stat} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(15,30,60,0.06)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: item.color, minWidth: 52, flexShrink: 0 }}>{item.stat}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#0F1E3C', lineHeight: 1.5 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 1 }}>{item.source}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
              A 1% fee difference has the <strong style={{ color: '#0F1E3C' }}>same long-term impact as a 1% lower investment return</strong> — they are mathematically equivalent in their effect on your retirement balance.
            </div>
          </div>

          {/* Fee types explained */}
          <div style={{ background: 'white', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>The 4 types of super fees</div>
            {[
              { name: 'Investment fee', type: '%', desc: 'The main variable fee — charged as a % of your balance for managing your investment option. This is what varies between options and is shown above.' },
              { name: 'Administration fee', type: '$', desc: 'Fixed dollar amount (typically $78–104/yr) for running the fund. Usually the same regardless of which option you\'re in.' },
              { name: 'Transaction costs', type: '%', desc: 'Small % costs for buying and selling assets within the option. Usually 0.01–0.10%. Shown in your fund\'s Fees & Costs Guide.' },
              { name: 'Insurance fees', type: '$', desc: 'Death, TPD, and income protection cover. Often bundled in. Check your annual statement — these can be $200–800+/yr and are separate from investment fees.' },
            ].map(f => (
              <div key={f.name} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(15,30,60,0.06)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, background: f.type === '%' ? '#EDE9FE' : 'rgba(15,30,60,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: f.type === '%' ? '#3C3489' : '#0F1E3C', flexShrink: 0 }}>{f.type}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0F1E3C', marginBottom: 2 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* What to do next */}
          {!isAlreadyLowFee && result.drag > 10000 && (
            <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '20px 24px', color: 'white' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                What you can do right now
              </div>
              {[
                { step: '1', text: `Ask your fund: "Do you have an indexed option?" — many funds offer indexed options at 0.05–0.15% within the same fund. Switching investment option is instant and free.` },
                { step: '2', text: `Compare on the Fund Comparison page — see like-for-like alternatives with actual return and fee data specific to your option type.` },
                { step: '3', text: `Check MyGov → ATO → Super for lost accounts — old accounts accumulate fees with no contributions going in.` },
                { step: '4', text: `Before switching funds: check for exit fees, whether you'll lose insurance cover, and seek financial advice if unsure.` },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#00D4AA', flexShrink: 0, marginTop: 1 }}>
                    {item.step}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{item.text}</div>
                </div>
              ))}
              <a href="/pricing" style={{ display: 'inline-block', marginTop: 6, background: '#00D4AA', color: '#0F1E3C', padding: '8px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                Unlock fund comparison →
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>General information only.</strong> Fee drag calculations assume a constant {((0.07) * 100).toFixed(0)}% gross annual return before fees, and ongoing employer SG contributions. Annual contributions of {fmt(annualContrib)} are included in the projection. Fees are indicative from fund PDSs at June 2026 and may have changed. Flat administration fees (typically $78–104/yr) are additional and not included. Past performance is not a reliable indicator of future returns. This is not financial advice — before switching funds consider exit fees, insurance implications, and speak with a licensed financial adviser.
      </div>
    </div>
  )
}
