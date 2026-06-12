'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/calculations'

// ─── ETF OVERLAP KNOWLEDGE BASE ──────────────────────────────────────────────
const OVERLAP_PAIRS: Record<string, { reason: string }> = {
  'A200+VAS':  { reason: 'Both track the ASX 200/300. No diversification benefit — hold just one.' },
  'VAS+STW':   { reason: 'Both track the ASX 200/300. Redundant position.' },
  'VGS+BGBL':  { reason: 'Both track MSCI World ex-AU — ~95% underlying overlap. Consider removing BGBL.' },
  'VGS+IVV':   { reason: 'VGS is ~68% US. IVV is 100% US. Heavy concentration in the same US stocks.' },
  'IVV+NDQ':   { reason: 'Nasdaq 100 is mostly a subset of S&P 500 tech names. Concentrated US tech double-up.' },
  'NDQ+VGS':   { reason: 'NDQ adds heavy Nasdaq concentration on top of the US tech already inside VGS.' },
  'DHHF+VAS':  { reason: 'DHHF already holds Australian shares internally. Adding VAS doubles your AU exposure.' },
  'DHHF+VGS':  { reason: 'DHHF already holds global shares internally. Adding VGS creates unintended concentration.' },
  'VDHG+VAS':  { reason: 'VDHG is a fund-of-funds that already contains VAS. Adding it separately doubles AU equities.' },
  'VDHG+VGS':  { reason: 'VDHG already contains VGS internally. Adding it separately doubles global equities.' },
  'IOZ+VAS':   { reason: 'Both track ASX 200. Identical exposure — hold just one.' },
  'IOZ+A200':  { reason: 'Both track ASX 200. Identical exposure — hold just one.' },
}

const ASSET_CLASSES = [
  { value: 'aus_equity',    label: 'Australian Equity' },
  { value: 'global_equity', label: 'Global Equity' },
  { value: 'us_equity',     label: 'US Equity' },
  { value: 'us_tech',       label: 'US Tech' },
  { value: 'asia_equity',   label: 'Asia Equity' },
  { value: 'property',      label: 'Property / REITs' },
  { value: 'bonds',         label: 'Fixed Income / Bonds' },
  { value: 'infrastructure',label: 'Infrastructure' },
  { value: 'cash',          label: 'Cash' },
  { value: 'crypto',        label: 'Crypto' },
  { value: 'other',         label: 'Other' },
]

// TBAR quarters — next 4 from today
function getTbarQuarters() {
  const now = new Date()
  const quarters = [
    { end: new Date(now.getFullYear(), 5, 30) },   // Jun 30
    { end: new Date(now.getFullYear(), 8, 30) },   // Sep 30
    { end: new Date(now.getFullYear(), 11, 31) },  // Dec 31
    { end: new Date(now.getFullYear() + 1, 2, 31)},// Mar 31
  ]
  return quarters.map(q => {
    const due = new Date(q.end)
    due.setDate(due.getDate() + 28)
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    const status = daysUntil < 0 ? 'overdue' : daysUntil <= 14 ? 'due-soon' : 'upcoming'
    return {
      qtrEnd: q.end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      due: due.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      daysUntil, status,
    }
  }).filter(q => q.daysUntil > -60).slice(0, 4)
}

type Holding = { id?: string; ticker: string; value: number; asset_class: string; notes?: string }

export function SmsfClient({ holdings: initialHoldings, subscription }: { holdings: any[]; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'
  const supabase = createClient()

  const [holdings, setHoldings] = useState<Holding[]>(
    initialHoldings.length > 0 ? initialHoldings : []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(initialHoldings.length === 0)
  const [newTicker, setNewTicker] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newClass, setNewClass] = useState('global_equity')
  const [pensionBalance, setPensionBalance] = useState(500000)
  const [memberAge, setMemberAge] = useState(68)

  const total = useMemo(() => holdings.reduce((s, h) => s + (h.value || 0), 0), [holdings])

  // Detect overlaps
  const detectedOverlaps = useMemo(() => {
    const tickers = holdings.map(h => h.ticker.toUpperCase())
    return Object.entries(OVERLAP_PAIRS).filter(([pair]) => {
      const [a, b] = pair.split('+')
      return tickers.includes(a) && tickers.includes(b)
    })
  }, [holdings])

  const overlapTickers = useMemo(() =>
    new Set(detectedOverlaps.flatMap(([pair]) => pair.split('+'))),
    [detectedOverlaps]
  )

  // Min pension calculation
  const minPensionRate = memberAge < 65 ? 4 : memberAge < 75 ? 5 : memberAge < 80 ? 6 : memberAge < 85 ? 7 : 9
  const minPensionAmount = pensionBalance * minPensionRate / 100

  // Asset allocation summary
  const allocation = useMemo(() => {
    const map: Record<string, number> = {}
    holdings.forEach(h => {
      map[h.asset_class] = (map[h.asset_class] || 0) + h.value
    })
    return Object.entries(map).map(([cls, val]) => ({ cls, val, pct: total > 0 ? val / total * 100 : 0 }))
      .sort((a, b) => b.val - a.val)
  }, [holdings, total])

  async function saveHoldings() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Delete existing and re-insert
    await supabase.from('smsf_holdings').delete().eq('user_id', user.id)
    if (holdings.length > 0) {
      await supabase.from('smsf_holdings').insert(
        holdings.map(h => ({
          user_id: user.id,
          ticker: h.ticker.toUpperCase(),
          value: h.value,
          asset_class: h.asset_class,
          notes: h.notes || null,
        }))
      )
    }
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  function addHolding() {
    if (!newTicker.trim() || !newValue) return
    setHoldings(prev => [...prev, {
      ticker: newTicker.trim().toUpperCase(),
      value: parseFloat(newValue),
      asset_class: newClass,
    }])
    setNewTicker('')
    setNewValue('')
  }

  function removeHolding(idx: number) {
    setHoldings(prev => prev.filter((_, i) => i !== idx))
  }

  const tbarQuarters = useMemo(() => getTbarQuarters(), [])

  const card: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }
  const inp: React.CSSProperties = { padding: '9px 12px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontSize: 13, color: '#0F1E3C', outline: 'none', background: 'white', fontFamily: 'monospace' }

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...card, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>SMSF Analytics</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Enter your actual ETF holdings. SmartSuper AU detects overlaps, tracks TBAR deadlines, and calculates minimum pension requirements — specific to your portfolio.
          </p>
          <a href="/pricing" style={{ background: '#00D4AA', color: '#0F1E3C', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Upgrade — from $60/quarter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* Alerts */}
      {detectedOverlaps.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <div style={{ color: '#78350F', fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{detectedOverlaps.length} ETF overlap{detectedOverlaps.length > 1 ? 's' : ''} detected in your portfolio</div>
            {detectedOverlaps.map(([pair, { reason }]) => (
              <div key={pair} style={{ marginBottom: 2 }}>· <strong>{pair.replace('+', ' + ')}:</strong> {reason}</div>
            ))}
          </div>
        </div>
      )}

      {holdings.length === 0 && (
        <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
          👋 <strong>Enter your SMSF ETF holdings below</strong> to get personalised overlap detection, allocation analysis, and minimum pension calculations. Your data is saved privately to your account.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── HOLDINGS ─────────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={lbl}>Your SMSF holdings</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(15,30,60,0.15)', background: 'white', cursor: 'pointer', color: '#0F1E3C' }}>
                  Edit
                </button>
              )}
              {editing && (
                <button onClick={saveHoldings} disabled={saving}
                  style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: 'none', background: saved ? '#10B981' : '#0F1E3C', cursor: 'pointer', color: saved ? 'white' : '#00D4AA' }}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save holdings'}
                </button>
              )}
            </div>
          </div>

          {/* Holdings table */}
          {holdings.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Ticker', 'Value', '%', 'Class', editing ? 'Del' : ''].filter(Boolean).map(h => (
                    <th key={h} style={{ textAlign: h === 'Ticker' ? 'left' : 'right', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, idx) => {
                  const pct = total > 0 ? (h.value / total) * 100 : 0
                  const hasOverlap = overlapTickers.has(h.ticker.toUpperCase())
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: hasOverlap ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#0F1E3C' }}>
                        {h.ticker}
                        {hasOverlap && <span style={{ marginLeft: 5, fontSize: 8, background: '#FEF3C7', color: '#92400E', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>OVERLAP</span>}
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: '#0F1E3C', textAlign: 'right' }}>
                        {editing
                          ? <input type="number" value={h.value} onChange={e => setHoldings(prev => prev.map((x, i) => i === idx ? { ...x, value: +e.target.value } : x))}
                              style={{ ...inp, width: 90, textAlign: 'right', padding: '4px 8px' }} />
                          : fmt(h.value)
                        }
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(15,30,60,0.55)', textAlign: 'right' }}>{pct.toFixed(0)}%</td>
                      <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)', textAlign: 'right' }}>
                        {ASSET_CLASSES.find(a => a.value === h.asset_class)?.label.replace(' / REITs', '').replace('Australian ', 'AU ').replace('Global ', 'Intl ') ?? h.asset_class}
                      </td>
                      {editing && (
                        <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                          <button onClick={() => removeHolding(idx)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15, padding: '0 4px' }}>×</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(15,30,60,0.1)' }}>
                  <td style={{ padding: '9px 8px', fontWeight: 600, color: '#0F1E3C' }}>Total</td>
                  <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0F1E3C', textAlign: 'right' }}>{fmt(total)}</td>
                  <td colSpan={editing ? 3 : 2} />
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>
              No holdings yet — add your ETFs below
            </div>
          )}

          {/* Add holding form */}
          {editing && (
            <div style={{ borderTop: '1px solid rgba(15,30,60,0.08)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Add holding</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input type="text" value={newTicker} onChange={e => setNewTicker(e.target.value.toUpperCase())}
                  placeholder="Ticker e.g. VAS" style={{ ...inp, width: 110 }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
                  <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)}
                    placeholder="Value" style={{ ...inp, paddingLeft: 22, width: 120 }} />
                </div>
                <select value={newClass} onChange={e => setNewClass(e.target.value)}
                  style={{ ...inp, flex: 1, minWidth: 130 }}>
                  {ASSET_CLASSES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <button onClick={addHolding} disabled={!newTicker || !newValue}
                  style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#0F1E3C', color: '#00D4AA', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !newTicker || !newValue ? 0.5 : 1 }}>
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Allocation summary */}
          {allocation.length > 0 && !editing && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(15,30,60,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.4)', marginBottom: 10 }}>Asset allocation</div>
              {allocation.map(({ cls, val, pct }) => (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.7)', width: 130, flexShrink: 0 }}>
                    {ASSET_CLASSES.find(a => a.value === cls)?.label ?? cls}
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'rgba(15,30,60,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#534AB7', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(15,30,60,0.6)', width: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#0F1E3C', width: 72, textAlign: 'right' }}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Min pension calculator */}
          <div style={card}>
            <div style={lbl}>Minimum pension drawdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Member age</div>
                <input type="number" value={memberAge} onChange={e => setMemberAge(+e.target.value)}
                  style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Pension account balance</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>$</span>
                  <input type="number" value={pensionBalance} onChange={e => setPensionBalance(+e.target.value)}
                    style={{ ...inp, paddingLeft: 22, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Minimum rate (age {memberAge})</span>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: '#00D4AA' }}>{minPensionRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Minimum drawdown this year</span>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#00D4AA' }}>{fmt(minPensionAmount)}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
                  {['Age', 'Rate', 'On your balance'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Age' ? 'left' : 'right', padding: '5px 6px', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Under 65', 4], ['65–74', 5], ['75–79', 6], ['80–84', 7], ['85–89', 9], ['90–94', 11], ['95+', 14],
                ].map(([age, rate]) => (
                  <tr key={age as string} style={{ borderBottom: '1px solid rgba(15,30,60,0.04)', background: minPensionRate === rate ? 'rgba(0,212,170,0.05)' : 'transparent' }}>
                    <td style={{ padding: '7px 6px', color: '#0F1E3C', fontWeight: minPensionRate === rate ? 600 : 400 }}>{age}</td>
                    <td style={{ padding: '7px 6px', fontFamily: 'monospace', textAlign: 'right', color: minPensionRate === rate ? '#00D4AA' : 'rgba(15,30,60,0.6)', fontWeight: minPensionRate === rate ? 600 : 400 }}>{rate}%</td>
                    <td style={{ padding: '7px 6px', fontFamily: 'monospace', textAlign: 'right', color: minPensionRate === rate ? '#0F1E3C' : 'rgba(15,30,60,0.45)', fontWeight: minPensionRate === rate ? 600 : 400 }}>{fmt(pensionBalance * (rate as number) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TBAR tracker */}
          <div style={card}>
            <div style={lbl}>TBAR deadline tracker</div>
            <p style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
              Transfer Balance Account Reports are due within 28 days of each quarter end. Failure to lodge on time can result in ATO penalties.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Quarter end', 'TBAR due', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Status' ? 'right' : 'left', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tbarQuarters.map(r => (
                  <tr key={r.qtrEnd} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                    <td style={{ padding: '9px 8px', color: '#0F1E3C' }}>{r.qtrEnd}</td>
                    <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 12, color: r.status === 'overdue' ? '#DC2626' : r.status === 'due-soon' ? '#D97706' : 'rgba(15,30,60,0.6)', fontWeight: r.status !== 'upcoming' ? 600 : 400 }}>{r.due}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: r.status === 'overdue' ? '#FEF2F2' : r.status === 'due-soon' ? '#FEF3C7' : 'rgba(15,30,60,0.06)',
                        color: r.status === 'overdue' ? '#991B1B' : r.status === 'due-soon' ? '#92400E' : 'rgba(15,30,60,0.45)' }}>
                        {r.status === 'overdue' ? '⚠ Overdue' : r.status === 'due-soon' ? `Due in ${r.daysUntil}d` : 'Upcoming'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> ETF overlap analysis is approximate and based on publicly known index compositions. TBAR deadlines are indicative — verify with your SMSF administrator. Minimum pension rates are per ATO guidelines at June 2026. This tool does not replace a qualified SMSF auditor, accountant, or licensed financial adviser.
      </div>
    </div>
  )
}
