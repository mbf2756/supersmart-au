'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/calculations'
import { ETF_DATABASE, ETF_CATEGORIES, type ETFRecord } from '@/lib/etfData'

// ─── OVERLAP DETECTION ───────────────────────────────────────────────────────
const OVERLAP_PAIRS: Record<string, string> = {
  'A200+VAS':  'Both track the ASX 200/300. No diversification benefit — hold just one.',
  'VAS+STW':   'Both track the ASX 200/300. Redundant position.',
  'VAS+IOZ':   'Both track the ASX 200/300. Redundant position.',
  'A200+IOZ':  'Both track the ASX 200/300. Identical exposure.',
  'A200+STW':  'Both track the ASX 200/300. Identical exposure.',
  'VGS+BGBL':  'Both track MSCI World ex-AU — ~95% underlying overlap. Consider removing BGBL.',
  'VGS+IWLD':  '~90% overlap. IWLD is MSCI World All Cap; VGS is MSCI World. Very similar.',
  'VGS+IVV':   'VGS is ~68% US equity. IVV is 100% US. Heavy US tech concentration risk.',
  'IVV+SPY':   'Both track the S&P 500 exactly. Identical — hold just one.',
  'IVV+NDQ':   'Nasdaq 100 is a concentrated subset of S&P 500 tech names. Double-up.',
  'NDQ+VGS':   'NDQ adds heavy Nasdaq concentration on top of US tech already inside VGS.',
  'DHHF+VAS':  'DHHF holds AU shares internally (~37%). Adding VAS doubles AU equity exposure.',
  'DHHF+VGS':  'DHHF holds global shares internally. Adding VGS creates unintended concentration.',
  'DHHF+IVV':  'DHHF already contains US equities. IVV adds pure US concentration.',
  'VDHG+VAS':  'VDHG is a fund-of-funds already containing VAS. Adding it separately doubles AU.',
  'VDHG+VGS':  'VDHG already contains VGS internally. Adding it separately doubles global equities.',
  'BGBL+IWLD': 'Both track similar developed-markets indices. ~85% overlap.',
  'QUAL+VGS':  'QUAL screens from the same MSCI World universe as VGS. ~70% stock overlap.',
}

function detectOverlaps(tickers: string[]): { pair: string; reason: string }[] {
  const set = new Set(tickers.map(t => t.toUpperCase()))
  return Object.entries(OVERLAP_PAIRS)
    .filter(([pair]) => { const [a, b] = pair.split('+'); return set.has(a) && set.has(b) })
    .map(([pair, reason]) => ({ pair, reason }))
}

// ─── TBAR QUARTERS ───────────────────────────────────────────────────────────
function getTbarDeadlines() {
  const now = new Date()
  const year = now.getFullYear()
  const quarters = [
    new Date(year, 2, 31), new Date(year, 5, 30),
    new Date(year, 8, 30), new Date(year, 11, 31),
    new Date(year + 1, 2, 31), new Date(year + 1, 5, 30),
  ]
  return quarters.map(qe => {
    const due = new Date(qe); due.setDate(due.getDate() + 28)
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    return {
      qtrEnd: qe.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }),
      due: due.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }),
      days, status: days < 0 ? 'overdue' : days <= 14 ? 'due-soon' : 'upcoming',
    }
  }).filter(q => q.days > -60).slice(0, 4)
}

// ─── ETF SEARCH DROPDOWN ─────────────────────────────────────────────────────
function ETFSearch({ onSelect }: { onSelect: (etf: ETFRecord) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    return ETF_DATABASE.filter(e =>
      (!category || e.category === category) &&
      (!q || e.ticker.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.issuer.toLowerCase().includes(q) ||
        e.index.toLowerCase().includes(q))
    ).slice(0, 12)
  }, [query, category])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <select value={category} onChange={e => { setCategory(e.target.value); setOpen(true) }}
          style={{ padding: '9px 10px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontSize: 12, color: '#0F1E3C', background: 'white', outline: 'none', flexShrink: 0 }}>
          {ETF_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search by ticker, name, or fund house..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontSize: 13, color: '#0F1E3C', background: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 12, boxShadow: '0 8px 32px rgba(15,30,60,0.12)', marginTop: 4, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 90px 60px 60px 60px 60px', gap: 0, padding: '7px 14px', background: 'rgba(15,30,60,0.04)', borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
            {['Ticker','Name / Index','Issuer','MER','1yr','3yr','5yr'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.map(etf => (
              <div key={etf.ticker}
                onClick={() => { onSelect(etf); setQuery(''); setOpen(false) }}
                style={{ display: 'grid', gridTemplateColumns: '64px 1fr 90px 60px 60px 60px 60px', gap: 0, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(15,30,60,0.04)', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0F1E3C' }}>{etf.ticker}</span>
                  {etf.esg && <span style={{ marginLeft: 4, fontSize: 8, background: 'rgba(0,212,170,0.15)', color: '#065F46', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>ESG</span>}
                  {etf.hedged && <span style={{ marginLeft: 3, fontSize: 8, background: '#EDE9FE', color: '#3C3489', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>HDG</span>}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#0F1E3C', fontWeight: 500, lineHeight: 1.3 }}>{etf.name.length > 42 ? etf.name.slice(0, 42) + '…' : etf.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.45)', marginTop: 1 }}>{etf.index}</div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.6)' }}>{etf.issuer}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0F1E3C', textAlign: 'right' }}>{etf.mer.toFixed(2)}%</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: etf.ret1 ? (etf.ret1 >= 15 ? '#00D4AA' : '#0F1E3C') : 'rgba(15,30,60,0.3)' }}>{etf.ret1 ? `${etf.ret1.toFixed(1)}%` : '—'}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: etf.ret3 ? (etf.ret3 >= 10 ? '#00D4AA' : '#0F1E3C') : 'rgba(15,30,60,0.3)' }}>{etf.ret3 ? `${etf.ret3.toFixed(1)}%` : '—'}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: etf.ret5 ? (etf.ret5 >= 10 ? '#00D4AA' : '#0F1E3C') : 'rgba(15,30,60,0.3)' }}>{etf.ret5 ? `${etf.ret5.toFixed(1)}%` : '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 14px', fontSize: 10, color: 'rgba(15,30,60,0.35)', borderTop: '1px solid rgba(15,30,60,0.06)' }}>
            {results.length} results · Returns to 30 Jun 2025, net of fees · MER from fund issuer websites
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type Holding = { ticker: string; value: number; etfData?: ETFRecord }

export function SmsfClient({ holdings: initialHoldings, subscription }: { holdings: any[]; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'
  const supabase = createClient()

  const [holdings, setHoldings] = useState<Holding[]>(
    initialHoldings.length > 0
      ? initialHoldings.map((h: any) => ({
          ticker: h.ticker,
          value: h.value,
          etfData: ETF_DATABASE.find(e => e.ticker === h.ticker),
        }))
      : []
  )
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [pensionBalance, setPensionBalance] = useState(500000)
  const [memberAge, setMemberAge] = useState(68)

  const total = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings])

  const overlaps = useMemo(() =>
    detectOverlaps(holdings.map(h => h.ticker)),
    [holdings]
  )
  const overlapTickers = useMemo(() =>
    new Set(overlaps.flatMap(o => o.pair.split('+'))),
    [overlaps]
  )

  // Portfolio stats
  const weightedMer = useMemo(() => {
    if (total === 0) return null
    const sum = holdings.reduce((s, h) => s + (h.etfData?.mer ?? 0) * h.value, 0)
    return sum / total
  }, [holdings, total])

  const allocationByClass = useMemo(() => {
    const map: Record<string, number> = {}
    holdings.forEach(h => {
      const cls = h.etfData?.assetClass ?? 'Unknown'
      map[cls] = (map[cls] || 0) + h.value
    })
    return Object.entries(map).map(([cls, val]) => ({ cls, val, pct: total > 0 ? val / total * 100 : 0 }))
      .sort((a, b) => b.val - a.val)
  }, [holdings, total])

  const minPensionRate = memberAge < 65 ? 4 : memberAge < 75 ? 5 : memberAge < 80 ? 6 : memberAge < 85 ? 7 : memberAge < 90 ? 9 : memberAge < 95 ? 11 : 14
  const minPension = pensionBalance * minPensionRate / 100

  function addEtf(etf: ETFRecord) {
    if (holdings.find(h => h.ticker === etf.ticker)) return
    setHoldings(prev => [...prev, { ticker: etf.ticker, etfData: etf, value: 0 }])
    setSaveMsg('')
  }

  function updateValue(idx: number, val: number) {
    setHoldings(prev => prev.map((h, i) => i === idx ? { ...h, value: val } : h))
  }

  function removeHolding(idx: number) {
    setHoldings(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveHoldings() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('smsf_holdings').delete().eq('user_id', user.id)
    if (holdings.length > 0) {
      await supabase.from('smsf_holdings').insert(
        holdings.map(h => ({
          user_id: user.id, ticker: h.ticker,
          value: h.value,
          asset_class: h.etfData?.category ?? 'other',
        }))
      )
    }
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const tbarDeadlines = useMemo(() => getTbarDeadlines(), [])
  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...c, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>SMSF Analytics</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Search and select from 70+ ASX ETFs to build your SMSF holdings. Get instant overlap detection, weighted MER, TBAR deadlines, and minimum pension calculations.
          </p>
          <a href="/pricing" style={{ background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Upgrade — from $60/quarter →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1060 }}>

      {/* Overlap alerts */}
      {overlaps.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#78350F', fontSize: 14, marginBottom: 8 }}>
            ⚠ {overlaps.length} ETF overlap{overlaps.length > 1 ? 's' : ''} detected
          </div>
          {overlaps.map(o => (
            <div key={o.pair} style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, marginBottom: 2 }}>
              · <strong style={{ fontFamily: 'monospace' }}>{o.pair.replace('+', ' + ')}</strong> — {o.reason}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 20 }}>

        {/* ── LEFT: Holdings table + search ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={c}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(15,30,60,0.4)' }}>
                SMSF holdings {holdings.length > 0 && <span style={{ color: '#0F1E3C' }}>({holdings.length} ETFs)</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saveMsg && <span style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600 }}>{saveMsg}</span>}
                <button onClick={saveHoldings} disabled={saving || holdings.length === 0}
                  style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0F1E3C', color: '#00D4AA', cursor: 'pointer', opacity: holdings.length === 0 ? 0.4 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Holdings table */}
            {holdings.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                      {['Ticker','Fund name','Issuer','Asset class','MER','1yr','3yr','5yr','Value ($)','Alloc %',''].map(h => (
                        <th key={h} style={{ padding: '5px 8px', fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: h === 'Value ($)' || h === 'Alloc %' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, idx) => {
                      const pct = total > 0 ? h.value / total * 100 : 0
                      const hasOverlap = overlapTickers.has(h.ticker)
                      const etf = h.etfData
                      return (
                        <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: hasOverlap ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                          <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F1E3C', fontSize: 13 }}>{h.ticker}</span>
                            {hasOverlap && <span style={{ marginLeft: 4, fontSize: 8, background: '#FEF3C7', color: '#92400E', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>OVERLAP</span>}
                            {etf?.esg && <span style={{ marginLeft: 3, fontSize: 8, background: 'rgba(0,212,170,0.12)', color: '#065F46', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>ESG</span>}
                          </td>
                          <td style={{ padding: '9px 8px', color: '#0F1E3C', fontSize: 11, maxWidth: 160 }}>
                            {etf ? (etf.name.length > 36 ? etf.name.slice(0, 36) + '…' : etf.name) : h.ticker}
                          </td>
                          <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.55)', whiteSpace: 'nowrap' }}>{etf?.issuer ?? '—'}</td>
                          <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.55)', whiteSpace: 'nowrap' }}>{etf?.assetClass ?? '—'}</td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, color: '#0F1E3C', whiteSpace: 'nowrap' }}>{etf ? `${etf.mer.toFixed(2)}%` : '—'}</td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: etf?.ret1 && etf.ret1 >= 15 ? '#00D4AA' : '#0F1E3C' }}>{etf?.ret1 ? `${etf.ret1.toFixed(1)}%` : '—'}</td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: etf?.ret3 && etf.ret3 >= 10 ? '#00D4AA' : '#0F1E3C' }}>{etf?.ret3 ? `${etf.ret3.toFixed(1)}%` : '—'}</td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: etf?.ret5 && etf.ret5 >= 10 ? '#00D4AA' : '#0F1E3C' }}>{etf?.ret5 ? `${etf.ret5.toFixed(1)}%` : '—'}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ position: 'absolute', left: 7, fontSize: 11, color: 'rgba(15,30,60,0.4)', pointerEvents: 'none' }}>$</span>
                              <input type="number" value={h.value || ''} onChange={e => updateValue(idx, +e.target.value)}
                                placeholder="0"
                                style={{ width: 100, padding: '4px 6px 4px 18px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 7, fontFamily: 'monospace', fontSize: 12, color: '#0F1E3C', outline: 'none', background: 'white', textAlign: 'right' }} />
                            </div>
                          </td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: 'rgba(15,30,60,0.55)' }}>{pct.toFixed(0)}%</td>
                          <td style={{ padding: '9px 4px', textAlign: 'center' }}>
                            <button onClick={() => removeHolding(idx)}
                              style={{ background: 'none', border: 'none', color: 'rgba(15,30,60,0.25)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#EF4444')}
                              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(15,30,60,0.25)')}>
                              ×
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(15,30,60,0.1)' }}>
                      <td colSpan={8} style={{ padding: '9px 8px', fontWeight: 600, color: '#0F1E3C', fontSize: 12 }}>
                        Total
                        {weightedMer !== null && (
                          <span style={{ marginLeft: 12, fontWeight: 400, color: 'rgba(15,30,60,0.5)' }}>
                            Weighted MER: <strong style={{ color: '#534AB7' }}>{weightedMer.toFixed(2)}%</strong>
                            <span style={{ marginLeft: 6 }}>= {fmt(total * weightedMer / 100)}/yr in fees</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0F1E3C', textAlign: 'right', fontSize: 13 }}>{fmt(total)}</td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 600, textAlign: 'right', fontSize: 12 }}>100%</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ETF Search */}
            <div style={{ borderTop: holdings.length > 0 ? '1px solid rgba(15,30,60,0.08)' : 'none', paddingTop: holdings.length > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 8 }}>
                {holdings.length === 0 ? 'Search and add your ETF holdings' : 'Add another ETF'}
              </div>
              <ETFSearch onSelect={addEtf} />
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 6 }}>
                70+ ASX ETFs · Filter by category · Returns to 30 Jun 2025
              </div>
            </div>
          </div>

          {/* Allocation chart */}
          {allocationByClass.length > 0 && (
            <div style={c}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>Asset allocation</div>
              {allocationByClass.map(({ cls, val, pct }, idx) => {
                const colours = ['#534AB7','#00D4AA','#F59E0B','#EF4444','#06B6D4','#8B5CF6','#EC4899','#10B981','#F97316','#64748B']
                return (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: colours[idx % colours.length], flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: '#0F1E3C', width: 160, flexShrink: 0 }}>{cls}</div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(15,30,60,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colours[idx % colours.length], borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(15,30,60,0.55)', width: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#0F1E3C', width: 76, textAlign: 'right' }}>{fmt(val)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Calculators ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Min pension */}
          <div style={c}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>
              Minimum pension drawdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 5 }}>Member age</div>
                <input type="number" value={memberAge} onChange={e => setMemberAge(+e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginBottom: 5 }}>Pension balance</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>$</span>
                  <input type="number" value={pensionBalance} onChange={e => setPensionBalance(+e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 20px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Min rate — age {memberAge}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>{minPensionRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Min draw this year</span>
                <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>{fmt(minPension)}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
                  {['Age','Rate','On your balance'].map(h => (
                    <th key={h} style={{ padding: '4px 6px', textAlign: h==='Age'?'left':'right', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[[55,4],[65,5],[75,6],[80,7],[85,9],[90,11],[95,14]].map(([age, rate]) => (
                  <tr key={age} style={{ borderBottom: '1px solid rgba(15,30,60,0.04)', background: minPensionRate === rate ? 'rgba(0,212,170,0.06)' : 'transparent' }}>
                    <td style={{ padding: '6px 6px', color: '#0F1E3C', fontWeight: minPensionRate === rate ? 600 : 400 }}>
                      {age === 55 ? 'Under 65' : age === 65 ? '65–74' : age === 75 ? '75–79' : age === 80 ? '80–84' : age === 85 ? '85–89' : age === 90 ? '90–94' : '95+'}
                    </td>
                    <td style={{ padding: '6px 6px', fontFamily: 'monospace', textAlign: 'right', color: minPensionRate === rate ? '#00D4AA' : 'rgba(15,30,60,0.5)', fontWeight: minPensionRate === rate ? 700 : 400 }}>{rate}%</td>
                    <td style={{ padding: '6px 6px', fontFamily: 'monospace', textAlign: 'right', color: minPensionRate === rate ? '#0F1E3C' : 'rgba(15,30,60,0.4)', fontWeight: minPensionRate === rate ? 600 : 400 }}>{fmt(pensionBalance * (rate as number) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TBAR */}
          <div style={c}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(15,30,60,0.4)', marginBottom: 10 }}>TBAR deadlines</div>
            <p style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
              Transfer Balance Account Reports due within 28 days of each quarter end.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Quarter end','Due date','Status'].map(h => (
                    <th key={h} style={{ padding: '5px 6px', textAlign: h==='Status'?'right':'left', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tbarDeadlines.map(r => (
                  <tr key={r.qtrEnd} style={{ borderBottom: '1px solid rgba(15,30,60,0.04)' }}>
                    <td style={{ padding: '8px 6px', color: '#0F1E3C' }}>{r.qtrEnd}</td>
                    <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 11, color: r.status==='overdue'?'#DC2626':r.status==='due-soon'?'#D97706':'rgba(15,30,60,0.55)', fontWeight: r.status!=='upcoming'?600:400 }}>{r.due}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: r.status==='overdue'?'#FEF2F2':r.status==='due-soon'?'#FEF3C7':'rgba(15,30,60,0.06)',
                        color: r.status==='overdue'?'#991B1B':r.status==='due-soon'?'#92400E':'rgba(15,30,60,0.45)' }}>
                        {r.status==='overdue'?'⚠ Overdue':r.status==='due-soon'?`${r.days}d left`:'Upcoming'}
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
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> ETF data (MER, returns) from fund issuer websites at June 2026 — returns to 30 Jun 2025, net of fees. Overlap analysis is based on publicly known index compositions and is indicative. TBAR deadlines are indicative — verify with your SMSF administrator. Minimum pension rates per ATO guidelines at June 2026. This tool does not replace a qualified SMSF auditor, accountant, or licensed financial adviser.
      </div>
    </div>
  )
}
