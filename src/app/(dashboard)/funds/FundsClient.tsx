'use client'
import { useState } from 'react'
import { fmt } from '@/lib/calculations'

const FUNDS = [
  { name: 'UniSuper Balanced', type: 'Industry', ret7: 9.1, fee: 0.36, apra: 'passed', abbr: 'US' },
  { name: 'Australian Retirement Trust', type: 'Industry', ret7: 8.9, fee: 0.44, apra: 'passed', abbr: 'ART' },
  { name: 'AustralianSuper Balanced', type: 'Industry', ret7: 8.7, fee: 0.51, apra: 'passed', abbr: 'AS' },
  { name: 'Hostplus Balanced', type: 'Industry', ret7: 8.4, fee: 0.78, apra: 'passed', abbr: 'HP', isCurrent: true },
  { name: 'Aware Super High Growth', type: 'Industry', ret7: 8.2, fee: 0.58, apra: 'passed', abbr: 'AW' },
  { name: 'Cbus MySuper Growth', type: 'Industry', ret7: 8.0, fee: 0.57, apra: 'passed', abbr: 'CB' },
  { name: 'Rest Core Strategy', type: 'Industry', ret7: 7.9, fee: 0.62, apra: 'passed', abbr: 'RE' },
  { name: 'BT Super MySuper', type: 'Retail', ret7: 6.8, fee: 1.24, apra: 'failed', abbr: 'BT' },
]

export function FundsClient() {
  const [balance, setBalance] = useState(287450)
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = FUNDS.filter(f => typeFilter === 'all' || f.type.toLowerCase() === typeFilter)
  const current = FUNDS.find(f => f.isCurrent)!
  const best = FUNDS[0]

  const card = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Filter card */}
        <div style={card}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>
              Fund type
            </label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontSize: 13, color: '#0F1E3C', background: 'white', outline: 'none' }}>
              <option value="all">All funds</option>
              <option value="industry">Industry funds</option>
              <option value="retail">Retail funds</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>
              Balance for fee calculation
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
              <input type="number" value={balance} onChange={e => setBalance(+e.target.value)}
                style={{ width: '100%', paddingLeft: 28, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Your fund summary */}
        <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px', color: 'white' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Comparing your fund</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{current.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{current.fee}% p.a. · {current.ret7}% 7-yr return</div>
          <div style={{ display: 'flex', gap: 28 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#EF4444' }}>+{(current.fee - best.fee).toFixed(2)}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>vs best-fee fund</div>
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#F59E0B' }}>−{(best.ret7 - current.ret7).toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>vs top-return fund</div>
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#EF4444' }}>−{fmt((current.fee - best.fee) * balance / 100)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>extra fees p.a.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fund table */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>
          Top MySuper balanced options — ranked by 7-year net return
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {['#', 'Fund', 'Type', '7-yr return', 'Fee %', `Fee $ (${fmt(balance)})`, 'APRA 2025'].map(h => (
                  <th key={h} style={{ textAlign: h === '#' || h === 'Fund' ? 'left' : 'right', padding: '6px 10px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((fund, i) => (
                <tr key={fund.name} style={{
                  borderBottom: '1px solid rgba(15,30,60,0.05)',
                  background: fund.isCurrent ? 'rgba(0,212,170,0.04)' : 'transparent',
                  outline: fund.isCurrent ? '1px solid rgba(0,212,170,0.25)' : 'none',
                }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.3)', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 500, color: '#0F1E3C' }}>
                    {fund.name}
                    {fund.isCurrent && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(0,212,170,0.1)', color: '#065F46', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>YOUR FUND</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', color: 'rgba(15,30,60,0.5)', fontSize: 11 }}>{fund.type}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 500, color: fund.ret7 >= 8.5 ? '#00D4AA' : fund.ret7 >= 7.5 ? '#0F1E3C' : '#D97706' }}>{fund.ret7}%</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: fund.fee <= 0.50 ? '#00D4AA' : fund.fee <= 0.80 ? '#0F1E3C' : '#EF4444', fontWeight: fund.fee > 0.80 ? 500 : 400 }}>{fund.fee}%</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: fund.fee <= 0.50 ? '#00D4AA' : fund.fee <= 0.80 ? '#0F1E3C' : '#EF4444' }}>{fmt(fund.fee / 100 * balance)}/yr</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: fund.apra === 'passed' ? 'rgba(0,212,170,0.1)' : '#FEF2F2',
                      color: fund.apra === 'passed' ? '#065F46' : '#991B1B',
                    }}>
                      {fund.apra === 'passed' ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        Fund return and fee data sourced from publicly available APRA and fund disclosure statements as at June 2026. Returns are after investment fees and tax. Past performance is not a reliable indicator of future performance. This comparison does not constitute a recommendation to switch funds.
      </div>
    </div>
  )
}
