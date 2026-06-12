'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/calculations'
import { ETF_DATABASE, ETF_CATEGORIES, type ETFRecord } from '@/lib/etfData'

// ─── OVERLAP KNOWLEDGE BASE ──────────────────────────────────────────────────
type OverlapInfo = { reason: string; severity: 'high' | 'medium'; action: string }
const OVERLAP_PAIRS: Record<string, OverlapInfo> = {
  'A200+VAS':  { severity:'high',   reason:'Both track the ASX 200/300 index — you own the same ~200 Australian companies twice.', action:'Remove one. A200 (0.04% MER) is the cheaper option vs VAS (0.07%). No difference in exposure.' },
  'VAS+STW':   { severity:'high',   reason:'VAS tracks ASX 300; STW tracks ASX 200. ~99% stock overlap.', action:'Remove STW and keep VAS — broader index at lower cost.' },
  'VAS+IOZ':   { severity:'high',   reason:'Both track the ASX 200/300. Identical exposure at different costs.', action:'Keep whichever you already own. IOZ (0.09%) and VAS (0.07%) are near-identical.' },
  'A200+IOZ':  { severity:'high',   reason:'Both track ASX 200. You own the same 200 Australian stocks twice.', action:'Keep A200 — it has the lowest MER (0.04%) of any ASX 200 ETF.' },
  'A200+STW':  { severity:'high',   reason:'Both track ASX 200. Redundant position.', action:'Consolidate into A200 for the lowest cost.' },
  'IVV+SPY':   { severity:'high',   reason:'Both track the S&P 500 exactly — identical 500 US companies, different fund managers.', action:'Keep IVV (0.04% MER) — it\'s cheaper and more tax-efficient for Australian investors.' },
  'VGS+BGBL':  { severity:'high',   reason:'Both track the MSCI World ex-Australia index — ~95% of holdings are identical.', action:'Remove BGBL and keep VGS, or vice versa. VGS is larger with more liquidity. BGBL (0.08%) is cheaper than VGS (0.18%).' },
  'VGS+IWLD':  { severity:'medium', reason:'IWLD tracks MSCI World All Cap (includes small caps); VGS tracks MSCI World (large/mid cap only). ~90% stock overlap.', action:'If you want small-cap exposure, keep both — but size your VGS position smaller to avoid over-weighting the overlap stocks.' },
  'VGS+IVV':   { severity:'medium', reason:'VGS is ~68% US equities. Adding IVV (100% US) concentrates you further into US large-cap tech.', action:'If you\'re comfortable with heavy US exposure, this is acceptable. Otherwise reduce IVV and increase ex-US holdings (VEU or VAE) for true diversification.' },
  'IVV+NDQ':   { severity:'high',   reason:'Nasdaq 100 (NDQ) is a concentrated subset of S&P 500 — mostly Apple, Microsoft, Nvidia, Meta, Alphabet. You\'re doubling your weight in the same mega-cap US tech stocks.', action:'Decide: do you want S&P 500 exposure (IVV) or concentrated US tech exposure (NDQ)? Holding both at similar weights is not diversification — it\'s concentration.' },
  'NDQ+VGS':   { severity:'medium', reason:'VGS already holds ~68% US equities, of which ~30% is tech. NDQ adds another concentrated layer of the same US tech names.', action:'Limit NDQ to a small satellite position (5–15% of portfolio) if you want tech tilt. Don\'t hold NDQ and VGS at equal weights.' },
  'DHHF+VAS':  { severity:'high',   reason:'DHHF is already ~37% Australian equities internally. Adding VAS doubles your AU allocation to ~55–60% of total portfolio.', action:'Remove VAS if you\'re using DHHF as your core holding — it\'s designed as a complete all-in-one portfolio.' },
  'DHHF+VGS':  { severity:'high',   reason:'DHHF already holds global equities as ~63% of its portfolio. Adding VGS separately creates a ~75% global equities position.', action:'Remove VGS. DHHF is designed as a standalone portfolio — adding individual asset class ETFs defeats the diversification purpose.' },
  'DHHF+IVV':  { severity:'medium', reason:'DHHF includes US equities internally via its global allocation. IVV adds pure US concentration on top.', action:'Consider whether the extra US tilt is intentional. If so, limit IVV to a small position (5–10%).' },
  'VDHG+VAS':  { severity:'high',   reason:'VDHG is a fund-of-funds that already holds VAS internally as its Australian equity component.', action:'Remove VAS — you\'re literally paying for the same fund twice (VDHG already buys VAS for you).' },
  'VDHG+VGS':  { severity:'high',   reason:'VDHG already holds VGS internally as its international equity component.', action:'Remove VGS — same situation as above. VDHG is designed as a complete portfolio.' },
  'BGBL+IWLD': { severity:'medium', reason:'Both track developed market indices with ~85% stock overlap. BGBL is Solactive; IWLD is MSCI World All Cap.', action:'Keep whichever aligns with your preference. BGBL (0.08%) is cheaper; IWLD includes small caps.' },
  'QUAL+VGS':  { severity:'medium', reason:'QUAL screens from the same MSCI World universe as VGS. ~70% of QUAL\'s holdings are already in VGS.', action:'If you want quality factor tilt, replace VGS entirely with QUAL, rather than holding both at equal weights.' },
}

function detectOverlaps(tickers: string[]): { pair: string; info: OverlapInfo }[] {
  const set = new Set(tickers.map(t => t.toUpperCase()))
  return Object.entries(OVERLAP_PAIRS)
    .filter(([pair]) => { const [a, b] = pair.split('+'); return set.has(a) && set.has(b) })
    .map(([pair, info]) => ({ pair, info }))
    .sort((a, b) => (a.info.severity === 'high' ? -1 : 1))
}

// ─── TBAR QUARTERS ───────────────────────────────────────────────────────────
function getTbarDeadlines() {
  const now = new Date()
  const year = now.getFullYear()
  const ends = [
    new Date(year, 2, 31), new Date(year, 5, 30),
    new Date(year, 8, 30), new Date(year, 11, 31),
    new Date(year+1, 2, 31), new Date(year+1, 5, 30),
  ]
  return ends.map(qe => {
    const due = new Date(qe); due.setDate(due.getDate() + 28)
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    return {
      qtrEnd: qe.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }),
      due: due.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }),
      days, status: days < 0 ? 'overdue' : days <= 14 ? 'due-soon' : 'upcoming',
    }
  }).filter(q => q.days > -60).slice(0, 4)
}

// ─── ETF SEARCH ──────────────────────────────────────────────────────────────
function ETFSearch({ onSelect, alreadyAdded }: { onSelect: (etf: ETFRecord) => void; alreadyAdded: string[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    return ETF_DATABASE.filter(e =>
      !alreadyAdded.includes(e.ticker) &&
      (!category || e.category === category) &&
      (!q || e.ticker.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) ||
        e.issuer.toLowerCase().includes(q) || e.index.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [query, category, alreadyAdded])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={category} onChange={e => { setCategory(e.target.value); setOpen(true) }}
          style={{ padding: '10px 12px', border: '1.5px solid rgba(0,212,170,0.4)', borderRadius: 10, fontSize: 12, color: '#0F1E3C', background: 'white', outline: 'none', cursor: 'pointer' }}>
          {ETF_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
          <input value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Type ticker, fund name, or issuer (e.g. VAS, Vanguard, BetaShares)..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid rgba(0,212,170,0.4)', borderRadius: 10, fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box', background: 'white' }} />
        </div>
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 12, boxShadow: '0 12px 40px rgba(15,30,60,0.15)', marginTop: 4, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '68px 1fr 100px 52px 56px 56px 56px', padding: '6px 14px', background: 'rgba(15,30,60,0.04)', borderBottom: '1px solid rgba(15,30,60,0.07)' }}>
            {['Ticker','Name & Index','Issuer','MER','1yr','3yr','5yr'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {results.map(etf => (
              <div key={etf.ticker} onClick={() => { onSelect(etf); setQuery(''); setOpen(false) }}
                style={{ display: 'grid', gridTemplateColumns: '68px 1fr 100px 52px 56px 56px 56px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(15,30,60,0.04)', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0F1E3C' }}>{etf.ticker}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {etf.esg && <span style={{ fontSize: 8, background: 'rgba(0,212,170,0.15)', color: '#065F46', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>ESG</span>}
                    {etf.hedged && <span style={{ fontSize: 8, background: '#EDE9FE', color: '#3C3489', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>HDG</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#0F1E3C', fontWeight: 500, lineHeight: 1.3 }}>{etf.name.length > 40 ? etf.name.slice(0, 40) + '…' : etf.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 1 }}>{etf.index}</div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.55)' }}>{etf.issuer}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#534AB7', fontWeight: 600 }}>{etf.mer.toFixed(2)}%</div>
                {[etf.ret1, etf.ret3, etf.ret5].map((r, i) => (
                  <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, textAlign: 'right', color: r ? (r >= 15 ? '#00D4AA' : r >= 8 ? '#0F1E3C' : '#D97706') : 'rgba(15,30,60,0.25)' }}>{r ? `${r.toFixed(1)}%` : '—'}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 14px', fontSize: 10, color: 'rgba(15,30,60,0.35)', background: 'rgba(15,30,60,0.02)' }}>
            Returns to 30 Jun 2025, net of fees · MER from issuer websites
          </div>
        </div>
      )}
      {open && query.length > 1 && results.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 12, padding: '16px', textAlign: 'center', fontSize: 13, color: 'rgba(15,30,60,0.5)', marginTop: 4 }}>
          No ETFs found for "{query}". Try a different ticker or fund name.
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
type Holding = { ticker: string; value: number; etfData?: ETFRecord }

export function SmsfClient({ holdings: initial, subscription }: { holdings: any[]; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'
  const supabase = createClient()

  const [holdings, setHoldings] = useState<Holding[]>(
    initial.length > 0 ? initial.map((h: any) => ({
      ticker: h.ticker, value: h.value,
      etfData: ETF_DATABASE.find(e => e.ticker === h.ticker),
    })) : []
  )
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [pensionBal, setPensionBal] = useState(500000)
  const [memberAge, setMemberAge] = useState(68)

  const total = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings])
  const allAdded = holdings.map(h => h.ticker)
  const overlaps = useMemo(() => detectOverlaps(allAdded), [allAdded])
  const overlapTickers = useMemo(() => new Set(overlaps.flatMap(o => o.pair.split('+'))), [overlaps])

  const weightedMer = useMemo(() => {
    if (total === 0) return null
    return holdings.reduce((s, h) => s + (h.etfData?.mer ?? 0) * h.value, 0) / total
  }, [holdings, total])

  const allocationByClass = useMemo(() => {
    const map: Record<string, number> = {}
    holdings.forEach(h => { const c = h.etfData?.assetClass ?? 'Unknown'; map[c] = (map[c] || 0) + h.value })
    return Object.entries(map).map(([cls, val]) => ({ cls, val, pct: total > 0 ? val / total * 100 : 0 })).sort((a, b) => b.val - a.val)
  }, [holdings, total])

  const minRate = memberAge < 65 ? 4 : memberAge < 75 ? 5 : memberAge < 80 ? 6 : memberAge < 85 ? 7 : memberAge < 90 ? 9 : memberAge < 95 ? 11 : 14
  const minPension = pensionBal * minRate / 100
  const tbarDeadlines = useMemo(() => getTbarDeadlines(), [])

  function addEtf(etf: ETFRecord) {
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
        holdings.map(h => ({ user_id: user.id, ticker: h.ticker, value: h.value, asset_class: h.etfData?.category ?? 'other' }))
      )
    }
    setSaving(false); setSaveMsg('Saved ✓'); setTimeout(() => setSaveMsg(''), 3000)
  }

  const cls: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }
  const PALETTE = ['#534AB7','#00D4AA','#F59E0B','#EF4444','#06B6D4','#8B5CF6','#EC4899','#10B981','#F97316','#64748B']

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...cls, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>SMSF Analytics</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Search and select from 70+ ASX ETFs. Get instant overlap detection with specific fix recommendations, weighted portfolio MER, TBAR deadline tracking, and minimum pension calculations.
          </p>
          <a href="/pricing" style={{ background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Upgrade — from $60/quarter →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1080 }}>

      {/* ── OVERLAP ALERTS ────────────────────────────────────────────── */}
      {overlaps.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {overlaps.map(({ pair, info }) => (
            <div key={pair} style={{ background: info.severity === 'high' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${info.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', gap: 14 }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: info.severity === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {info.severity === 'high' ? '⚠' : '~'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0F1E3C' }}>{pair.replace('+', ' + ')}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: info.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.15)', color: info.severity === 'high' ? '#991B1B' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {info.severity === 'high' ? 'High overlap' : 'Moderate overlap'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: info.severity === 'high' ? '#7F1D1D' : '#78350F', lineHeight: 1.6, marginBottom: 6 }}>{info.reason}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(15,30,60,0.04)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>💡</span>
                  <div style={{ fontSize: 12, color: '#0F1E3C', lineHeight: 1.6, fontWeight: 500 }}><strong>Suggested action:</strong> {info.action}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PORTFOLIO COMPLETENESS PROMPT ────────────────────────────── */}
      {holdings.length === 0 ? (
        <div style={{ background: 'rgba(0,212,170,0.06)', border: '2px dashed rgba(0,212,170,0.3)', borderRadius: 16, padding: '28px 32px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Add all your SMSF ETF holdings to get started</div>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Enter every ETF and its current dollar value — including smaller or legacy positions. The overlap detector and portfolio analysis only work accurately when your holdings are complete. Your data is saved privately to your account.
          </div>
        </div>
      ) : total === 0 ? (
        <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, fontSize: 13, color: '#78350F', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>⚠</span>
          <span>You've added {holdings.length} ETF{holdings.length > 1 ? 's' : ''} but haven't entered any dollar values yet. Enter the current market value of each holding to see allocation percentages and portfolio stats.</span>
        </div>
      ) : total < 50000 ? (
        <div style={{ background: 'rgba(83,74,183,0.06)', border: '1px solid rgba(83,74,183,0.15)', borderRadius: 12, padding: '12px 18px', marginBottom: 16, fontSize: 13, color: '#3C3489', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>💡</span>
          <span>Make sure you've added <strong>all</strong> your SMSF holdings — including cash, term deposits, and any other ETFs. Incomplete holdings will skew the allocation percentages and overlap analysis.</span>
        </div>
      ) : null}

      {/* ── FULL WIDTH VERTICAL STACK ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>

        {/* ── HOLDINGS ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cls}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>
                  SMSF holdings
                  {holdings.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'rgba(15,30,60,0.5)' }}>{holdings.length} ETF{holdings.length > 1 ? 's' : ''} · {fmt(total)} total</span>}
                </div>
                {weightedMer !== null && total > 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', marginTop: 3 }}>
                    Weighted MER: <strong style={{ color: '#534AB7' }}>{weightedMer.toFixed(2)}%</strong> = <strong style={{ color: '#534AB7' }}>{fmt(total * weightedMer / 100)}/yr</strong> in total ETF fees
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saveMsg && <span style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600 }}>{saveMsg}</span>}
                <button onClick={saveHoldings} disabled={saving || holdings.length === 0}
                  style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: holdings.length === 0 ? 'rgba(15,30,60,0.1)' : '#0F1E3C', color: holdings.length === 0 ? 'rgba(15,30,60,0.4)' : '#00D4AA', fontWeight: 700, fontSize: 13, cursor: holdings.length === 0 ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : '💾 Save holdings'}
                </button>
              </div>
            </div>

            {/* Table */}
            {holdings.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: 18 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                      {['Ticker','Fund name','Issuer','Asset class','MER','1yr','3yr','5yr','Value ($)','Alloc',''].map((h, i) => (
                        <th key={i} style={{ padding: '5px 8px', fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', textAlign: i >= 4 && i <= 9 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, idx) => {
                      const pct = total > 0 ? h.value / total * 100 : 0
                      const hasOverlap = overlapTickers.has(h.ticker)
                      const etf = h.etfData
                      return (
                        <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: hasOverlap ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                          <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F1E3C', fontSize: 13 }}>{h.ticker}</span>
                            {hasOverlap && <span style={{ marginLeft: 4, fontSize: 8, background: '#FEF2F2', color: '#991B1B', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>OVERLAP</span>}
                            {etf?.esg && <span style={{ marginLeft: 3, fontSize: 8, background: 'rgba(0,212,170,0.12)', color: '#065F46', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>ESG</span>}
                          </td>
                          <td style={{ padding: '9px 8px', fontSize: 11, color: '#0F1E3C' }}>{etf ? (etf.name.length > 34 ? etf.name.slice(0,34)+'…' : etf.name) : h.ticker}</td>
                          <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)', whiteSpace: 'nowrap' }}>{etf?.issuer ?? '—'}</td>
                          <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)', whiteSpace: 'nowrap' }}>{etf?.assetClass ?? '—'}</td>
                          <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: '#534AB7', fontWeight: 600 }}>{etf ? `${etf.mer.toFixed(2)}%` : '—'}</td>
                          {[etf?.ret1, etf?.ret3, etf?.ret5].map((r, i) => (
                            <td key={i} style={{ padding: '9px 8px', fontFamily: 'monospace', fontSize: 11, textAlign: 'right', color: r ? (r >= 15 ? '#00D4AA' : r >= 8 ? '#0F1E3C' : '#D97706') : 'rgba(15,30,60,0.25)' }}>{r ? `${r.toFixed(1)}%` : '—'}</td>
                          ))}
                          <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ position: 'absolute', left: 7, fontSize: 11, color: 'rgba(15,30,60,0.4)', pointerEvents: 'none' }}>$</span>
                              <input type="number" value={h.value || ''} onChange={e => updateValue(idx, +e.target.value)}
                                placeholder="0"
                                style={{ width: 100, padding: '5px 6px 5px 18px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 7, fontFamily: 'monospace', fontSize: 12, color: '#0F1E3C', outline: 'none', background: 'white', textAlign: 'right' }} />
                            </div>
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                              <div style={{ width: 36, height: 4, background: 'rgba(15,30,60,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#534AB7', borderRadius: 2 }} />
                              </div>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(15,30,60,0.55)', minWidth: 28 }}>{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 4px' }}>
                            <button onClick={() => removeHolding(idx)}
                              style={{ background: 'none', border: 'none', color: 'rgba(15,30,60,0.2)', cursor: 'pointer', fontSize: 17, padding: '0 4px' }}
                              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#EF4444')}
                              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(15,30,60,0.2)')}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(15,30,60,0.1)' }}>
                      <td colSpan={8} style={{ padding: '9px 8px', fontWeight: 600, color: '#0F1E3C', fontSize: 12 }}>Total portfolio</td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0F1E3C', textAlign: 'right', fontSize: 13 }}>{fmt(total)}</td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 600, textAlign: 'right', fontSize: 11 }}>100%</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Search */}
            <div style={{ borderTop: holdings.length > 0 ? '1px solid rgba(15,30,60,0.08)' : 'none', paddingTop: holdings.length > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>
                {holdings.length === 0 ? '🔍 Search and add your ETF holdings below' : '+ Add another ETF to your portfolio'}
              </div>
              <ETFSearch onSelect={addEtf} alreadyAdded={allAdded} />
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 6 }}>
                70+ ASX ETFs across all major issuers · Filter by category · Returns to 30 Jun 2025 (net of fees)
              </div>
            </div>
          </div>

          {/* Asset allocation */}
          {allocationByClass.length > 0 && total > 0 && (
            <div style={cls}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 16 }}>Asset allocation breakdown</div>
              {allocationByClass.map(({ cls: c, val, pct }, i) => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: '#0F1E3C', width: 180, flexShrink: 0 }}>{c}</div>
                  <div style={{ flex: 1, height: 7, background: 'rgba(15,30,60,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: PALETTE[i % PALETTE.length], borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(15,30,60,0.55)', width: 36, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0F1E3C', width: 80, textAlign: 'right' }}>{fmt(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PENSION + TBAR: full width, side by side ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Min pension — redesigned with clear explanation */}
          <div style={cls}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Minimum pension drawdown</div>

            {/* Pension vs accumulation explainer */}
            <div style={{ background: 'rgba(83,74,183,0.06)', border: '1px solid rgba(83,74,183,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#3C3489', lineHeight: 1.7 }}>
              <strong>Pension phase only.</strong> This rule applies when your SMSF has started a pension (retirement income stream). During the <strong>accumulation phase</strong> (still working and contributing), there is no minimum drawdown requirement — you cannot access your super at all until you meet a condition of release. If your SMSF is in accumulation phase, you can ignore this section entirely.
            </div>

            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
              Once a pension has started, the ATO requires you to draw a minimum percentage of your account balance each financial year. Failing to meet the minimum means your pension account <strong>loses its tax-free status</strong> on investment earnings — reverting from 0% to 15% tax. The required percentage increases with age.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Your age</div>
                <input type="number" value={memberAge} onChange={e => setMemberAge(+e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontSize: 13, fontFamily: 'monospace', color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Pension account balance</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>$</span>
                  <input type="number" value={pensionBal} onChange={e => setPensionBal(+e.target.value)}
                    style={{ width: '100%', padding: '9px 9px 9px 20px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 9, fontSize: 13, fontFamily: 'monospace', color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Result — clear output */}
            <div style={{ background: '#0F1E3C', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>You must draw at least this much in 2025–26</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: '#00D4AA', lineHeight: 1 }}>{fmt(minPension)}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>this financial year</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Based on {minRate}% rate for age {memberAge} · {fmt(pensionBal)} pension balance<br />
                Approximately {fmt(minPension / 12)}/month or {fmt(minPension / 26)}/fortnight
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 11, color: '#FCA5A5', lineHeight: 1.5 }}>
                ⚠ Pension phase only: if you don't draw the minimum, the ATO can treat your pension as having failed — investment earnings for that year are taxed at 15% instead of 0%, and you may need to re-start the pension.
              </div>
            </div>

            {/* Age bracket table */}
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>ATO minimum rates by age</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
                  {['Age','Rate','On your balance'].map(h => (
                    <th key={h} style={{ padding: '4px 6px', textAlign: h==='Age'?'left':'right', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[['Under 65',4],['65–74',5],['75–79',6],['80–84',7],['85–89',9],['90–94',11],['95+',14]].map(([label, rate]) => (
                  <tr key={label as string} style={{ borderBottom: '1px solid rgba(15,30,60,0.04)', background: minRate === rate ? 'rgba(0,212,170,0.07)' : 'transparent' }}>
                    <td style={{ padding: '7px 6px', color: '#0F1E3C', fontWeight: minRate === rate ? 700 : 400, fontSize: 12 }}>{minRate === rate ? `▶ ${label}` : label as string}</td>
                    <td style={{ padding: '7px 6px', fontFamily: 'monospace', textAlign: 'right', color: minRate === rate ? '#00D4AA' : 'rgba(15,30,60,0.5)', fontWeight: minRate === rate ? 700 : 400, fontSize: 12 }}>{rate as number}%</td>
                    <td style={{ padding: '7px 6px', fontFamily: 'monospace', textAlign: 'right', color: minRate === rate ? '#0F1E3C' : 'rgba(15,30,60,0.4)', fontWeight: minRate === rate ? 600 : 400, fontSize: 12 }}>{fmt(pensionBal * (rate as number) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TBAR — redesigned */}
          <div style={cls}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>TBAR deadline tracker</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
              When your SMSF pension balance changes (contributions, lump sum withdrawals, commutations), you must lodge a Transfer Balance Account Report with the ATO within <strong>28 days</strong> of the quarter end. Late lodgement attracts penalties.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tbarDeadlines.map(r => (
                <div key={r.qtrEnd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 11, border: `1px solid ${r.status==='overdue'?'rgba(239,68,68,0.25)':r.status==='due-soon'?'rgba(245,158,11,0.25)':'rgba(15,30,60,0.08)'}`, background: r.status==='overdue'?'#FEF2F2':r.status==='due-soon'?'#FFFBEB':'rgba(15,30,60,0.02)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#0F1E3C', marginBottom: 2 }}>Quarter ending {r.qtrEnd}</div>
                    <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>TBAR due by {r.due}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                    background: r.status==='overdue'?'rgba(239,68,68,0.12)':r.status==='due-soon'?'rgba(245,158,11,0.15)':'rgba(15,30,60,0.06)',
                    color: r.status==='overdue'?'#991B1B':r.status==='due-soon'?'#92400E':'rgba(15,30,60,0.45)' }}>
                    {r.status==='overdue'?'⚠ Overdue':r.status==='due-soon'?`⏰ Due in ${r.days}d`:'✓ Upcoming'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6, background: 'rgba(15,30,60,0.03)', borderRadius: 8, padding: '10px 12px' }}>
              💡 You only need to lodge a TBAR if a reportable event occurred in that quarter (e.g. a new pension started, pension commuted, or excess transfer balance event). No event = no lodgement required.
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> ETF data (MER, returns) from issuer websites at June 2026. Returns to 30 Jun 2025, net of fees. Overlap analysis is based on publicly known index compositions and is indicative — actual portfolio overlap depends on exact fund composition at the time of holding. TBAR deadlines and minimum pension rates are per ATO guidelines at June 2026 — verify with your SMSF administrator or accountant. This tool does not replace a qualified SMSF auditor, accountant, or licensed financial adviser.
      </div>
    </div>
  )
}
