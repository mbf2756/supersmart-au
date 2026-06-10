'use client'
import { useState, useMemo } from 'react'
import { calcFeeDrag, fmt, fmtShort } from '@/lib/calculations'

export function FeesClient() {
  const [balance, setBalance] = useState(287450)
  const [current, setCurrent] = useState(0.78)
  const [compare, setCompare] = useState(0.36)
  const [years, setYears] = useState(20)

  const result = useMemo(
    () => calcFeeDrag(balance, current, compare, years),
    [balance, current, compare, years]
  )

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Dark fee drag banner */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Estimated fee drag over {years} years
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 44, fontWeight: 500, color: '#EF4444', letterSpacing: '-0.02em', marginBottom: 4 }}>
          -{fmt(result.drag)}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
          compared to the lowest-fee equivalent fund
        </div>

        {/* Fee bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 140, flexShrink: 0 }}>
              Your fund ({current}%)
            </span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(98, current * 70)}%`, height: '100%', background: '#EF4444', borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.8)', width: 80, textAlign: 'right' }}>
              {fmt(balance)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 140, flexShrink: 0 }}>
              Low-fee option ({compare}%)
            </span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(98, compare * 70)}%`, height: '100%', background: '#00D4AA', borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.8)', width: 80, textAlign: 'right' }}>
              Same balance
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Calculator card */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 20 }}>
            Fee drag calculator
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>
              Current balance
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
              <input
                type="number"
                value={balance}
                onChange={e => setBalance(+e.target.value)}
                style={{ width: '100%', paddingLeft: 28, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>
              Current fund fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={current}
              onChange={e => setCurrent(+e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }}>
              Comparison fund fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={compare}
              onChange={e => setCompare(+e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)' }}>
                Years to compare
              </label>
              <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: '#0F1E3C' }}>
                {years} yrs
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              value={years}
              onChange={e => setYears(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Result box */}
          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              Result
            </div>
            {[
              { label: 'Annual fee difference', value: fmt(result.annualDiff), color: '#F59E0B' },
              { label: `Fee drag over ${years} years`, value: fmt(result.drag), color: '#EF4444' },
              { label: 'Your portfolio value', value: fmtShort(result.youBalance), color: 'white' },
              { label: 'Low-fee portfolio value', value: fmtShort(result.lowFeeBalance), color: '#00D4AA' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* APRA card */}
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>
            APRA performance test status — 2025
          </div>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 16 }}>
            APRA publishes annual performance tests for all MySuper products.
            Any fund that underperforms its benchmark must notify all members.
          </p>

          <div style={{ border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.05)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(0,212,170,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#065F46', flexShrink: 0 }}>
              HP
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>Hostplus Balanced</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>Industry fund · MySuper</div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>8.4% p.a.</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>7-yr avg</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: '#065F46' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
              Passed 2025
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6 }}>
            General information only. Past fund performance is not a reliable indicator of future performance.
          </p>
        </div>
      </div>
    </div>
  )
}
