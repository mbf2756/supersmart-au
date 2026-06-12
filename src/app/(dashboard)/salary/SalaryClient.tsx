'use client'
import { useState, useMemo } from 'react'
import { calcSalarySacrificeSaving, getMarginalRate, calcConcessionalCap, projectBalance, fmt, fmtShort } from '@/lib/calculations'

// Project super balance with and without salary sacrifice
function projectWithSS(balance: number, sgContrib: number, ssAnnual: number, returnRate: number, years: number) {
  const without = projectBalance(balance, sgContrib, returnRate / 100, years)
  const with_ss = projectBalance(balance, sgContrib + ssAnnual, returnRate / 100, years)
  return { without, with_ss, gain: with_ss - without }
}

// Tax brackets for visual
const TAX_BRACKETS = [
  { min: 0,       max: 18200,  rate: 0,    label: '$0 – $18,200',       colour: '#00D4AA' },
  { min: 18201,   max: 45000,  rate: 0.19, label: '$18,201 – $45,000',  colour: '#10B981' },
  { min: 45001,   max: 120000, rate: 0.325,label: '$45,001 – $120,000', colour: '#F59E0B' },
  { min: 120001,  max: 180000, rate: 0.37, label: '$120,001 – $180,000',colour: '#F97316' },
  { min: 180001,  max: Infinity,rate: 0.45,label: '$180,001+',          colour: '#EF4444' },
]

export function SalaryClient({ superProfile: sp }: { superProfile: any }) {
  const [salary,   setSalary]   = useState(sp?.salary ?? 0)
  const [monthly,  setMonthly]  = useState(500)
  const [sgRate,   setSgRate]   = useState(sp?.employer_sg_rate ?? 12)
  const [balance,  setBalance]  = useState(sp?.current_balance ?? 0)
  const [age,      setAge]      = useState(sp?.age ?? 40)
  const [returnRate,setReturnRate] = useState(7)

  const annual      = monthly * 12
  const sgContrib   = salary * (sgRate / 100)
  const result      = useMemo(() => calcSalarySacrificeSaving(salary, monthly), [salary, monthly])
  const capInfo     = useMemo(() => calcConcessionalCap(salary, sgRate, annual), [salary, sgRate, annual])
  const marginal    = getMarginalRate(salary)
  const maxMonthly  = Math.ceil(capInfo.headroom / 12)
  const yearsToRetire = Math.max(1, 65 - age)
  const projection  = useMemo(() => projectWithSS(balance, sgContrib, annual, returnRate, yearsToRetire), [balance, sgContrib, annual, returnRate, yearsToRetire])

  // Effective tax rate on SS vs normal income
  const superTaxRate    = 0.15
  const taxRateSaved    = marginal - superTaxRate
  const div293Applies   = salary > 250_000
  const effectiveSSTax  = div293Applies ? superTaxRate + 0.15 : superTaxRate // Div293 adds 15%

  // "Cost to you" — what you actually give up in take-home for every $1 into super
  const netCostPerDollar = 1 - (marginal - effectiveSSTax)

  // Table amounts
  const tableAmounts = [250, 500, 750, 1000, maxMonthly]
    .filter((v, i, a) => a.indexOf(v) === i && v > 0 && v <= maxMonthly + 500)

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 5 }
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }

  function PI({ val, setVal }: { val: number; setVal: (v: number) => void }) {
    return (
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 12 }}>$</span>
        <input type="number" value={val || ''} onChange={e => setVal(+e.target.value)} style={{ ...inp, paddingLeft: 24 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* ── WHAT IS SALARY SACRIFICE ─────────────────────────────────── */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '20px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          How salary sacrifice works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 4 }}>The core idea</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Instead of receiving part of your salary as cash (taxed at up to 45%), you redirect it straight into super — where it's taxed at just <strong style={{ color: '#00D4AA' }}>15%</strong>. The difference is your tax saving.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 4 }}>The mechanism</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Your employer reduces your gross salary by the sacrifice amount and pays it to your super fund. It counts as an employer contribution — the 15% contributions tax applies, but not income tax or Medicare levy.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 4 }}>The limit</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              All concessional contributions (employer SG + salary sacrifice) must stay within the <strong style={{ color: '#00D4AA' }}>$30,000/yr cap</strong>. Going over triggers excess tax. This calculator shows your remaining headroom.
            </div>
          </div>
        </div>
      </div>

      {/* ── YOUR TAX POSITION ─────────────────────────────────────────── */}
      {salary > 0 && (
        <div style={{ ...c, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 16 }}>Your tax position at {fmt(salary)}/yr salary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Your marginal rate', value: `${(marginal * 100).toFixed(0)}%`, sub: 'Top rate on next $1 earned', colour: marginal >= 0.37 ? '#EF4444' : marginal >= 0.325 ? '#F59E0B' : '#00D4AA' },
              { label: 'Super contributions tax', value: '15%', sub: 'Flat rate inside super', colour: '#00D4AA' },
              { label: 'Your tax saving rate', value: `${(taxRateSaved * 100).toFixed(0)}%`, sub: div293Applies ? 'Reduced — Div 293 applies' : 'Per dollar sacrificed', colour: taxRateSaved > 0.15 ? '#00D4AA' : '#F59E0B' },
              { label: 'Cost per $1 into super', value: `${(netCostPerDollar * 100).toFixed(0)}¢`, sub: 'Your actual out-of-pocket cost', colour: '#534AB7' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.07)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: s.colour, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Tax bracket visual */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Australian income tax brackets 2025–26 — your bracket highlighted
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAX_BRACKETS.map(b => {
                const isYours = salary > b.min && salary <= b.max
                return (
                  <div key={b.label} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: isYours ? 700 : 400, border: `1.5px solid ${isYours ? b.colour : 'rgba(15,30,60,0.08)'}`, background: isYours ? b.colour : 'transparent', color: isYours ? 'white' : 'rgba(15,30,60,0.5)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace' }}>{(b.rate * 100).toFixed(0)}%</span>
                    <span style={{ opacity: 0.8 }}>{b.label}</span>
                    {isYours && <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.3)', padding: '1px 5px', borderRadius: 10 }}>YOU</span>}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 6 }}>
              Salary sacrifice redirects income from your {(marginal * 100).toFixed(0)}% bracket → 15% super contributions tax = <strong style={{ color: '#0F1E3C' }}>{(taxRateSaved * 100).toFixed(0)}¢ saved per dollar sacrificed</strong>
              {div293Applies && <span style={{ marginLeft: 6, color: '#F97316' }}>⚠ Division 293 applies — extra 15% on contributions reduces this to {((marginal - 0.30) * 100).toFixed(0)}¢</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CALCULATOR ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Inputs */}
        <div style={c}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 18 }}>Calculate your saving</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Gross salary</label>
              <PI val={salary} setVal={setSalary} />
            </div>
            <div>
              <label style={lbl}>Employer SG rate %</label>
              <input type="number" value={sgRate} step={0.5} onChange={e => setSgRate(+e.target.value)} style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={lbl}>Monthly salary sacrifice</label>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: monthly >= maxMonthly * 0.9 ? '#00D4AA' : '#534AB7' }}>{fmt(monthly)}/mo</span>
            </div>
            <input type="range" min={0} max={Math.max(maxMonthly, 2500)} step={50}
              value={monthly} onChange={e => setMonthly(+e.target.value)}
              style={{ width: '100%', accentColor: '#534AB7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(15,30,60,0.35)', marginTop: 3 }}>
              <span>$0</span>
              <span>Max: {fmt(maxMonthly)}/mo ({fmt(capInfo.headroom)} cap headroom)</span>
            </div>
          </div>

          {/* Cap bar */}
          {salary > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Concessional cap usage</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: capInfo.headroom < 1000 ? '#EF4444' : '#0F1E3C' }}>
                  {fmt(capInfo.totalUsed)} / $30,000
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(15,30,60,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, display: 'flex' }}>
                  <div style={{ width: `${Math.min(100, (capInfo.sgAmount / 30000) * 100)}%`, background: '#534AB7', transition: 'width 0.3s' }} title={`SG: ${fmt(capInfo.sgAmount)}`} />
                  <div style={{ width: `${Math.min(100 - (capInfo.sgAmount / 30000) * 100, (annual / 30000) * 100)}%`, background: '#00D4AA', transition: 'width 0.3s' }} title={`SS: ${fmt(annual)}`} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: 'rgba(15,30,60,0.45)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#534AB7' }} />SG {fmt(capInfo.sgAmount)}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: 'rgba(15,30,60,0.45)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#00D4AA' }} />Salary sacrifice {fmt(annual)}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: capInfo.headroom < 1000 ? '#EF4444' : 'rgba(15,30,60,0.45)' }}>
                  Remaining {fmt(capInfo.headroom)}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Impact of sacrificing {fmt(monthly)}/month
            </div>
            {[
              { label: 'Annual sacrifice amount', value: fmt(annual), sub: null, colour: 'white' },
              { label: 'Tax saving per year', value: fmt(result.taxSaving), sub: `${(marginal * 100).toFixed(0)}% → 15% = ${(taxRateSaved * 100).toFixed(0)}% saving rate`, colour: '#00D4AA' },
              { label: 'Take-home pay reduction', value: fmt(result.takeHomeCost) + '/yr', sub: `= ${fmt(result.takeHomeCost / 12)}/month less in hand`, colour: '#F59E0B' },
              { label: 'Extra into super', value: fmt(annual) + '/yr', sub: 'Grows tax-free inside super', colour: '#00D4AA' },
              { label: 'Cap headroom remaining', value: fmt(capInfo.headroom), sub: capInfo.headroom < 500 ? '⚠ Nearly at cap' : 'Until $30,000 concessional limit', colour: capInfo.headroom < 500 ? '#EF4444' : 'rgba(255,255,255,0.6)' },
            ].map(r => (
              <div key={r.label} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: r.colour }}>{r.value}</span>
                </div>
                {r.sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{r.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Payslip comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={c}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Monthly payslip — before vs after</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginBottom: 16 }}>
              What changes each month when you salary sacrifice {fmt(monthly)}/mo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Without salary sacrifice', items: [
                  { k: 'Gross salary', v: fmt(salary / 12) + '/mo' },
                  { k: 'Income tax (est.)', v: `−${fmt(salary * marginal / 12)}/mo`, red: true },
                  { k: 'Take-home (est.)', v: fmt((salary - salary * marginal) / 12) + '/mo', bold: true },
                  { k: 'Extra to super', v: '$0', muted: true },
                ]},
                { label: `With ${fmt(monthly)}/mo sacrifice`, items: [
                  { k: 'Gross salary', v: fmt(salary / 12) + '/mo' },
                  { k: 'Income tax (est.)', v: `−${fmt((salary - annual) * marginal / 12)}/mo`, red: true },
                  { k: 'Take-home (est.)', v: fmt(((salary - annual) - (salary - annual) * marginal) / 12) + '/mo', bold: true, green: true },
                  { k: 'Extra to super', v: `+${fmt(monthly)}/mo`, green: true },
                ]},
              ].map(col => (
                <div key={col.label} style={{ background: 'rgba(15,30,60,0.02)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.07)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{col.label}</div>
                  {col.items.map(item => (
                    <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                      <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)' }}>{item.k}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: (item as any).bold ? 700 : 500, color: (item as any).red ? '#EF4444' : (item as any).green ? '#00D4AA' : '#0F1E3C' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: 'rgba(0,212,170,0.06)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#065F46', lineHeight: 1.6 }}>
              Net effect: You receive <strong>{fmt(result.takeHomeCost / 12)}/month less</strong> in take-home pay, but <strong>{fmt(monthly)}/month more</strong> goes into super — a tax saving of <strong>{fmt(result.taxSaving / 12)}/month</strong> that would otherwise go to the ATO.
            </div>
          </div>

          {/* Div 293 warning */}
          {div293Applies && (
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#78350F', marginBottom: 6 }}>⚠ Division 293 applies to you</div>
              <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
                Your income exceeds $250,000. The ATO charges an additional 15% tax on concessional contributions (on top of the 15% contributions tax), bringing the effective rate to 30%.
                Salary sacrifice is still worth considering — 30% vs your 47% marginal rate is still a 17% saving — but the benefit is reduced.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LONG-TERM COMPOUNDING IMPACT ─────────────────────────────── */}
      {salary > 0 && balance > 0 && annual > 0 && (
        <div style={{ ...c, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>Long-term compounding impact</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
                {fmt(monthly)}/month sacrifice over {yearsToRetire} years to age 65 at {returnRate}% annual return
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>Return rate:</span>
              <input type="range" min={3} max={10} step={0.5} value={returnRate}
                onChange={e => setReturnRate(+e.target.value)}
                style={{ width: 100, accentColor: '#534AB7' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#534AB7', minWidth: 28 }}>{returnRate}%</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
            {[
              { label: 'Super without salary sacrifice', value: fmtShort(projection.without), sub: 'SG contributions only', colour: '#534AB7', dark: false },
              { label: 'Super with salary sacrifice', value: fmtShort(projection.with_ss), sub: `SG + ${fmt(monthly)}/month extra`, colour: '#00D4AA', dark: false },
              { label: 'Extra at retirement from SS', value: fmtShort(projection.gain), sub: 'Additional balance from sacrificing', colour: '#0F1E3C', dark: true },
            ].map(s => (
              <div key={s.label} style={{ background: s.dark ? '#0F1E3C' : `rgba(${s.colour === '#00D4AA' ? '0,212,170' : '83,74,183'},0.06)`, borderRadius: 14, padding: '16px 18px', border: `1px solid ${s.dark ? '#0F1E3C' : `rgba(${s.colour === '#00D4AA' ? '0,212,170' : '83,74,183'},0.15)`}` }}>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: s.dark ? '#00D4AA' : s.colour, marginBottom: 4, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.dark ? 'white' : '#0F1E3C', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: s.dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,30,60,0.45)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.7 }}>
            That's <strong style={{ color: '#0F1E3C' }}>{fmtShort(projection.gain * 0.04)}/year more retirement income</strong> using a 4% safe withdrawal rate — from sacrificing just {fmt(monthly)}/month (which only costs {fmt(result.takeHomeCost / 12)}/month after tax savings).
          </div>
        </div>
      )}

      {/* ── COMPARISON TABLE ─────────────────────────────────────────── */}
      <div style={{ ...c, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Compare different sacrifice amounts</div>
        <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginBottom: 16 }}>
          All amounts below your cap limit of {fmt(maxMonthly)}/month remaining
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
              {['/Month','/Year','Tax saved/yr','Take-home cost/yr','Net cost/mo','Cap used',''].map(h => (
                <th key={h} style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h === '/Month' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableAmounts.map(amt => {
              const r = calcSalarySacrificeSaving(salary, amt)
              const cap = calcConcessionalCap(salary, sgRate, amt * 12)
              const isSelected = amt === monthly
              const isMax = amt === maxMonthly
              return (
                <tr key={amt}
                  onClick={() => setMonthly(amt)}
                  style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', cursor: 'pointer', background: isSelected ? 'rgba(83,74,183,0.05)' : isMax ? 'rgba(0,212,170,0.04)' : 'transparent' }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(15,30,60,0.02)')}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = isMax ? 'rgba(0,212,170,0.04)' : 'transparent')}>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 600, color: isSelected ? '#534AB7' : isMax ? '#00D4AA' : '#0F1E3C', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {fmt(amt)}/mo
                    {isMax && <span style={{ fontSize: 9, background: 'rgba(0,212,170,0.15)', color: '#065F46', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>MAX CAP</span>}
                    {isSelected && <span style={{ fontSize: 9, background: 'rgba(83,74,183,0.15)', color: '#3C3489', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>SELECTED</span>}
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: 'rgba(15,30,60,0.7)' }}>{fmt(r.annual)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: '#00D4AA', fontWeight: 600 }}>{fmt(r.taxSaving)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: 'rgba(15,30,60,0.6)' }}>{fmt(r.takeHomeCost)}</td>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', textAlign: 'right', color: '#534AB7', fontWeight: 600 }}>{fmt(r.takeHomeCost / 12)}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <div style={{ width: 60, height: 4, background: 'rgba(15,30,60,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (cap.totalUsed / 30000) * 100)}%`, height: '100%', background: cap.totalUsed >= 29000 ? '#EF4444' : '#534AB7', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(15,30,60,0.5)', minWidth: 28 }}>{((cap.totalUsed / 30000) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <button onClick={() => setMonthly(amt)}
                      style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, border: `1px solid ${isSelected ? '#534AB7' : 'rgba(15,30,60,0.15)'}`, background: isSelected ? '#534AB7' : 'white', color: isSelected ? 'white' : 'rgba(15,30,60,0.5)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {isSelected ? 'Selected' : 'Use this'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── SUGGESTED ACTIONS ─────────────────────────────────────────── */}
      <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 12 }}>Suggested next steps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {annual > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span>✓</span>
              <span>Contact your HR or payroll team and ask to set up a salary sacrifice arrangement of <strong>{fmt(monthly)}/month</strong> into super. This must be agreed <em>before</em> you earn the income — you can't do it retrospectively.</span>
            </div>
          )}
          {capInfo.headroom > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span>✓</span>
              <span>You have <strong>{fmt(capInfo.headroom)} of cap headroom</strong> remaining this year. Sacrificing up to <strong>{fmt(maxMonthly)}/month</strong> keeps you within the $30,000 concessional cap.</span>
            </div>
          )}
          {result.taxSaving > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span>✓</span>
              <span>At your salary, every $1,000 sacrificed saves you approximately <strong>{fmt(taxRateSaved * 1000)}</strong> in tax. The break-even compared to just investing the take-home pay is typically within 3–4 years.</span>
            </div>
          )}
          {capInfo.headroom > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span>✓</span>
              <span>Check whether your employer also offers salary packaging for other items (laptops, electric vehicles, work-related expenses) — these reduce the income that even SG and salary sacrifice is calculated on.</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Tax calculations use 2025–26 ATO individual income tax rates and do not account for Medicare levy (2%), HECS/HELP repayments, offsets, or other deductions. Salary sacrifice must be agreed with your employer before the income is earned — you cannot sacrifice income you have already received. Concessional cap is $30,000 for 2025–26. Projections use a flat {returnRate}% annual return assumption and are illustrative only. Seek advice from a licensed tax adviser before implementing a salary sacrifice arrangement.
      </div>
    </div>
  )
}
