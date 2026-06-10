'use client'
import { useState, useMemo } from 'react'
import { calcSalarySacrificeSaving, getMarginalRate, calcConcessionalCap, fmt } from '@/lib/calculations'

export function SalaryClient({ superProfile: sp }: { superProfile: any }) {
  const [salary, setSalary] = useState(sp?.salary ?? 0)
  const [monthly, setMonthly] = useState(500)
  const [sgRate, setSgRate] = useState(sp?.employer_sg_rate ?? 12)

  const result = useMemo(() => calcSalarySacrificeSaving(salary, monthly), [salary, monthly])
  const capInfo = useMemo(() => calcConcessionalCap(salary, sgRate, monthly * 12), [salary, sgRate, monthly])
  const marginal = getMarginalRate(salary)
  const maxMonthly = Math.ceil(capInfo.headroom / 12)

  const tableAmounts = [250, 500, 750, 1000, maxMonthly].filter((v, i, a) => a.indexOf(v) === i && v > 0)

  const card = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const label = { display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }
  const input = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Calculator */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 20 }}>
            Salary sacrifice calculator
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Gross salary</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
              <input type="number" value={salary} onChange={e => setSalary(+e.target.value)} style={{ ...input, paddingLeft: 28 }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={label}>Monthly sacrifice</label>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: '#0F1E3C' }}>{fmt(monthly)}/mo</span>
            </div>
            <input type="range" min={0} max={Math.max(maxMonthly, 2500)} step={50}
              value={monthly} onChange={e => setMonthly(+e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>SG rate %</label>
            <input type="number" value={sgRate} step={0.5} onChange={e => setSgRate(+e.target.value)} style={input} />
          </div>

          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Salary sacrifice impact</div>
            {[
              { label: 'Annual sacrifice', value: fmt(result.annual), color: 'white' },
              { label: 'Tax saving vs no sacrifice', value: fmt(result.taxSaving), color: '#00D4AA' },
              { label: 'Take-home pay reduction', value: fmt(result.takeHomeCost) + '/yr', color: '#F59E0B' },
              { label: 'Extra into super', value: fmt(result.annual), color: '#00D4AA' },
              { label: 'Remaining cap headroom', value: fmt(capInfo.headroom), color: 'white' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tax table */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>
            Marginal rate &amp; tax benefit
          </div>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 16 }}>
            Salary sacrifice is taxed at <strong style={{ color: '#0F1E3C' }}>15%</strong> in super instead of your marginal rate of{' '}
            <strong style={{ color: '#0F1E3C' }}>{(marginal * 100).toFixed(0)}%</strong>. The difference is your saving.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {['$/month', 'Annual', 'Tax saving', 'Take-home cost'].map(h => (
                  <th key={h} style={{ textAlign: h === '$/month' ? 'left' : 'right', padding: '6px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableAmounts.map(amt => {
                const r = calcSalarySacrificeSaving(salary, amt)
                const isMax = amt === maxMonthly
                return (
                  <tr key={amt} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: isMax ? 'rgba(0,212,170,0.05)' : 'transparent' }}>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: isMax ? '#00D4AA' : '#0F1E3C', fontWeight: isMax ? 500 : 400 }}>
                      {fmt(amt)}{isMax ? ' (max)' : ''}
                    </td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: '#0F1E3C', textAlign: 'right' }}>{fmt(r.annual)}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: '#00D4AA', textAlign: 'right' }}>{fmt(r.taxSaving)}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.6)', textAlign: 'right' }}>{fmt(r.takeHomeCost)}/yr</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {result.div293Risk && (
            <div style={{ marginTop: 16, background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 500, color: '#78350F', marginBottom: 4, fontSize: 13 }}>⚠ Division 293 applies</div>
              <div style={{ fontSize: 12, color: '#78350F', opacity: 0.9 }}>Your income exceeds $250,000. An additional 15% tax applies to concessional contributions — salary sacrifice may still be worthwhile but the tax benefit is reduced.</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', marginTop: 20, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        Tax calculations use 2025–26 ATO individual income tax rates. Does not account for Medicare levy, HECS/HELP, or other deductions. Salary sacrifice must be agreed with your employer before the income is earned. General information only.
      </div>
    </div>
  )
}
