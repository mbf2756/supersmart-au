'use client'
import { useState } from 'react'
import { fmt } from '@/lib/calculations'

const DEFAULT_HOLDINGS = [
  { ticker: 'VGS', value: 180000, asset_class: 'global_equity' },
  { ticker: 'NDQ', value: 150000, asset_class: 'us_tech' },
  { ticker: 'A200', value: 80000, asset_class: 'aus_equity' },
  { ticker: 'BGBL', value: 50000, asset_class: 'global_equity' },
  { ticker: 'VAP', value: 40000, asset_class: 'property' },
]

const OVERLAP_PAIRS: Record<string, { overlaps: string[]; reason: string }> = {
  'VGS+BGBL': { overlaps: ['VGS', 'BGBL'], reason: 'Both track MSCI World ex-AU — ~95% underlying overlap. Consider removing BGBL.' },
  'VGS+IVV': { overlaps: ['VGS', 'IVV'], reason: 'VGS is global ex-AU; IVV is US-only. Heavy US tech duplication.' },
  'A200+VAS': { overlaps: ['A200', 'VAS'], reason: 'Both track ASX 200/300. No diversification benefit from holding both.' },
  'NDQ+VGS': { overlaps: ['NDQ', 'VGS'], reason: 'NDQ adds heavy Nasdaq concentration on top of tech already in VGS.' },
}

export function SmsfClient({ holdings: initialHoldings, subscription }: { holdings: any[]; subscription: any }) {
  const isPaid = subscription?.plan === 'optimiser' || subscription?.plan === 'retirement' || subscription?.add_ons?.includes('smsf')
  const [holdings] = useState(initialHoldings.length > 0 ? initialHoldings : DEFAULT_HOLDINGS)

  const total = holdings.reduce((s, h) => s + (h.value || 0), 0)
  const detectedOverlaps = Object.entries(OVERLAP_PAIRS).filter(([, { overlaps }]) => {
    const tickers = holdings.map((h: any) => h.ticker)
    return overlaps.every(t => tickers.includes(t))
  })

  const card = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const sectionLabel = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...card, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>SMSF Analytics</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.7 }}>
            ETF overlap detection, TBAR deadline tracking, and minimum pension calculations. Available on the Optimiser plan.
          </p>
          <a href="/pricing" style={{ background: '#00D4AA', color: '#0F1E3C', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Upgrade — from $60/quarter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {detectedOverlaps.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <div style={{ color: '#78350F', fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{detectedOverlaps.length} ETF overlap{detectedOverlaps.length > 1 ? 's' : ''} detected</div>
            <div style={{ opacity: 0.85 }}>{detectedOverlaps[0][1].reason}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Holdings */}
        <div style={card}>
          <div style={sectionLabel}>SMSF holdings — sample portfolio</div>
          <p style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginBottom: 14 }}>Update your holdings in Settings → SMSF Portfolio</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {['ETF', 'Value', 'Allocation', 'Class'].map(h => (
                  <th key={h} style={{ textAlign: h === 'ETF' ? 'left' : 'right', padding: '6px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h: any) => {
                const pct = total > 0 ? (h.value / total) * 100 : 0
                const hasOverlap = detectedOverlaps.some(([, { overlaps }]) => overlaps.includes(h.ticker))
                return (
                  <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: hasOverlap ? '#FFFBEB' : 'transparent' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 500, color: '#0F1E3C' }}>
                      {h.ticker}
                      {hasOverlap && <span style={{ marginLeft: 6, fontSize: 9, background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>OVERLAP</span>}
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#0F1E3C', textAlign: 'right' }}>{fmt(h.value)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ width: 48, height: 4, background: 'rgba(15,30,60,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#0F1E3C', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(15,30,60,0.7)', minWidth: 28 }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)', textAlign: 'right' }}>{h.asset_class?.replace('_', ' ')}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid rgba(15,30,60,0.1)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 500, color: '#0F1E3C' }}>Total</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#0F1E3C', textAlign: 'right' }}>{fmt(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* TBAR */}
          <div style={card}>
            <div style={sectionLabel}>TBAR deadline tracker</div>
            <p style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
              Transfer Balance Account Reports must be lodged within 28 days of each quarter end.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Quarter end', 'TBAR due', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Status' ? 'right' : 'left', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { qtr: '30 Jun 2026', due: '28 Jul 2026', status: 'due-soon' },
                  { qtr: '30 Sep 2026', due: '28 Oct 2026', status: 'upcoming' },
                  { qtr: '31 Dec 2026', due: '28 Jan 2027', status: 'upcoming' },
                ].map(r => (
                  <tr key={r.qtr} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                    <td style={{ padding: '9px 8px', color: '#0F1E3C' }}>{r.qtr}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 12, color: r.status === 'due-soon' ? '#D97706' : 'rgba(15,30,60,0.6)', fontWeight: r.status === 'due-soon' ? 500 : 400 }}>{r.due}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: r.status === 'due-soon' ? '#FEF3C7' : 'rgba(15,30,60,0.06)', color: r.status === 'due-soon' ? '#92400E' : 'rgba(15,30,60,0.5)' }}>
                        {r.status === 'due-soon' ? 'Due soon' : 'Not yet due'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Min pension */}
          <div style={card}>
            <div style={sectionLabel}>Minimum pension drawdown rates</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Age bracket', 'Min %', 'On $500k'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Age bracket' ? 'left' : 'right', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Under 65', '4%', '$20,000'],
                  ['65–74', '5%', '$25,000'],
                  ['75–79', '6%', '$30,000'],
                  ['80–84', '7%', '$35,000'],
                  ['85+', '9–14%', '$45k+'],
                ].map(([age, pct, amt]) => (
                  <tr key={age} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                    <td style={{ padding: '9px 8px', color: '#0F1E3C' }}>{age}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: '#0F1E3C', textAlign: 'right' }}>{pct}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.6)', textAlign: 'right' }}>{amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        SMSF analytics are general information only. ETF overlap analysis is approximate. SMSF trustees are responsible for all ATO compliance obligations. This tool does not replace a qualified SMSF auditor or accountant.
      </div>
    </div>
  )
}
