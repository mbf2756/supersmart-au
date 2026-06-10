'use client'
import { useState, useMemo } from 'react'
import { calcDiv296Exposure, yearsToThreshold, projectBalance, fmt, DIV296_THRESHOLD } from '@/lib/calculations'

export function Div296Client() {
  const [balance, setBalance] = useState(287450)
  const [annualContrib, setAnnualContrib] = useState(30000)
  const [returnRate, setReturnRate] = useState(7)
  const [age, setAge] = useState(46)

  const proj65 = useMemo(() => projectBalance(balance, annualContrib, returnRate / 100, Math.max(0, 65 - age)), [balance, annualContrib, returnRate, age])
  const yrsToThresh = useMemo(() => yearsToThreshold(balance, annualContrib, returnRate / 100, DIV296_THRESHOLD), [balance, annualContrib, returnRate])
  const exposure = useMemo(() => calcDiv296Exposure(balance), [balance])

  const label = { display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }
  const input = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }
  const card = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <span>ℹ</span>
        <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
          <strong>Division 296 tax commences 1 July 2026.</strong> An additional 15% tax applies to super earnings attributable to balances above $3 million. First assessments after 30 June 2027.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Calculator */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 20 }}>
            Division 296 exposure calculator
          </div>

          {[
            { lbl: 'Total super balance (today)', val: balance, set: setBalance, prefix: true },
            { lbl: 'Annual contributions (total)', val: annualContrib, set: setAnnualContrib, prefix: true },
          ].map(f => (
            <div key={f.lbl} style={{ marginBottom: 14 }}>
              <label style={label}>{f.lbl}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
                <input type="number" value={f.val} onChange={e => f.set(+e.target.value)}
                  style={{ ...input, paddingLeft: 28 }} />
              </div>
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={label}>Assumed annual return</label>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: '#0F1E3C' }}>{returnRate}%</span>
            </div>
            <input type="range" min={3} max={12} step={0.5} value={returnRate}
              onChange={e => setReturnRate(+e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Your age</label>
            <input type="number" value={age} onChange={e => setAge(+e.target.value)} style={input} />
          </div>

          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Your Division 296 exposure</div>
            {[
              { label: 'Est. balance at age 65', value: fmt(proj65), color: 'white' },
              { label: 'Years until $3M threshold', value: yrsToThresh ? `${yrsToThresh} years` : '25+ years away', color: '#00D4AA' },
              { label: 'Current exposure', value: exposure.exposed ? fmt(exposure.annualTax) + '/yr' : 'Not exposed', color: exposure.exposed ? '#EF4444' : '#00D4AA' },
              { label: 'Status', value: exposure.exposed ? '⚠ Monitor closely' : '✓ Not currently exposed', color: exposure.exposed ? '#F59E0B' : '#00D4AA' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold summary */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>
            Threshold summary
          </div>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
            Division 296 applies proportionally — only the earnings attributable to the balance above $3M are taxed at the additional 15%.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {['Balance range', 'Effective rate', 'Indexed'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { range: 'Under $3M', rate: '15%', rateColor: '#00D4AA', indexed: 'N/A' },
                { range: '$3M – $10M', rate: '30%', rateColor: '#D97706', indexed: '+$150k CPI' },
                { range: 'Above $10M', rate: '40%', rateColor: '#EF4444', indexed: '+$500k CPI' },
              ].map(r => (
                <tr key={r.range} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                  <td style={{ padding: '10px 8px', color: '#0F1E3C' }}>{r.range}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 500, color: r.rateColor }}>{r.rate}</td>
                  <td style={{ padding: '10px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{r.indexed}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!exposure.exposed && (
            <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 500, color: '#065F46', marginBottom: 4, fontSize: 13 }}>✓ Not currently exposed</div>
              <div style={{ fontSize: 12, color: '#065F46', opacity: 0.9 }}>
                Based on a balance of {fmt(balance)}, you are not currently exposed to Division 296. Continue monitoring as your balance grows.
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', marginTop: 20, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        Division 296 modelling is based on the Treasury Laws Amendment (Better Targeted Superannuation Concessions) Bill 2025, commencing 1 July 2026. Projections are illustrative estimates only. Not financial advice.
      </div>
    </div>
  )
}
