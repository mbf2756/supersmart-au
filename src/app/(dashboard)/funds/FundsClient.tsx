'use client'
import { useState, useMemo } from 'react'
import { fmt, calcFeeDrag } from '@/lib/calculations'

// ─── FUND DATA ───────────────────────────────────────────────────────────────
// Each entry is a specific fund + investment option combination
// ret7 = 7-year net return after investment fees and tax (SuperRatings / APRA data to Jun 2025)
// fee  = total investment fee % p.a. (from fund PDSs, June 2026)
// type = 'balanced-active' | 'balanced-indexed' | 'growth-active' | 'highgrowth-active' | 'conservative-active' | 'cash'

const ALL_OPTIONS = [
  // ── INDUSTRY: BALANCED ACTIVE ──
  { fund: 'UniSuper', option: 'Balanced', type: 'Industry', category: 'balanced-active', ret7: 9.1, fee: 0.41, apra: 'passed' },
  { fund: 'AustralianSuper', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.7, fee: 0.57, apra: 'passed' },
  { fund: 'Australian Retirement Trust', option: 'Balanced', type: 'Industry', category: 'balanced-active', ret7: 8.9, fee: 0.54, apra: 'passed' },
  { fund: 'Aware Super', option: 'Balanced Growth', type: 'Industry', category: 'balanced-active', ret7: 8.2, fee: 0.57, apra: 'passed' },
  { fund: 'Hostplus', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.4, fee: 0.78, apra: 'passed' },
  { fund: 'Cbus', option: 'Growth (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.0, fee: 0.57, apra: 'passed' },
  { fund: 'REST', option: 'Core Strategy', type: 'Industry', category: 'balanced-active', ret7: 7.9, fee: 0.62, apra: 'passed' },
  { fund: 'HESTA', option: 'MySuper Balanced Growth', type: 'Industry', category: 'balanced-active', ret7: 7.8, fee: 0.67, apra: 'passed' },
  { fund: 'Spirit Super', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 7.6, fee: 0.71, apra: 'passed' },
  { fund: 'CareSuper', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 7.7, fee: 0.63, apra: 'passed' },
  // ── RETAIL: BALANCED ACTIVE ──
  { fund: 'ANZ Smart Choice', option: 'Balanced', type: 'Retail', category: 'balanced-active', ret7: 7.1, fee: 0.85, apra: 'passed' },
  { fund: 'MLC Super', option: 'Balanced', type: 'Retail', category: 'balanced-active', ret7: 6.9, fee: 1.10, apra: 'passed' },
  { fund: 'Colonial First State', option: 'Diversified', type: 'Retail', category: 'balanced-active', ret7: 6.7, fee: 0.95, apra: 'passed' },
  { fund: 'BT Super', option: 'MySuper Lifestage', type: 'Retail', category: 'balanced-active', ret7: 6.8, fee: 1.24, apra: 'failed' },
  // ── INDUSTRY: BALANCED INDEXED ──
  { fund: 'AustralianSuper', option: 'Indexed Diversified', type: 'Industry', category: 'balanced-indexed', ret7: 9.2, fee: 0.14, apra: 'passed' },
  { fund: 'Hostplus', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed', ret7: 9.0, fee: 0.11, apra: 'passed' },
  { fund: 'Australian Retirement Trust', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed', ret7: 8.8, fee: 0.16, apra: 'passed' },
  { fund: 'Aware Super', option: 'Indexed Growth', type: 'Industry', category: 'balanced-indexed', ret7: 8.7, fee: 0.15, apra: 'passed' },
  { fund: 'REST', option: 'Indexed Global Shares', type: 'Industry', category: 'balanced-indexed', ret7: 9.5, fee: 0.15, apra: 'passed' },
  // ── INDUSTRY: HIGH GROWTH ──
  { fund: 'AustralianSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.8, fee: 0.58, apra: 'passed' },
  { fund: 'UniSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.6, fee: 0.43, apra: 'passed' },
  { fund: 'Aware Super', option: 'High Growth (MySuper)', type: 'Industry', category: 'highgrowth-active', ret7: 9.4, fee: 0.63, apra: 'passed' },
  { fund: 'Australian Retirement Trust', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.3, fee: 0.62, apra: 'passed' },
  { fund: 'Cbus', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.1, fee: 0.64, apra: 'passed' },
  // ── INDUSTRY: GROWTH ──
  { fund: 'UniSuper', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 9.3, fee: 0.43, apra: 'passed' },
  { fund: 'Aware Super', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 8.8, fee: 0.60, apra: 'passed' },
  { fund: 'Spirit Super', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 8.3, fee: 0.75, apra: 'passed' },
  // ── INDUSTRY: CONSERVATIVE ──
  { fund: 'AustralianSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active', ret7: 6.4, fee: 0.51, apra: 'passed' },
  { fund: 'UniSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active', ret7: 6.2, fee: 0.37, apra: 'passed' },
  { fund: 'Cbus', option: 'Conservative', type: 'Industry', category: 'conservative-active', ret7: 5.9, fee: 0.44, apra: 'passed' },
]

// Map user's option name → comparison category
function detectCategory(fundName: string, optionName: string): string {
  const opt = optionName.toLowerCase()
  if (opt.includes('indexed')) return 'balanced-indexed'
  if (opt.includes('high growth') || opt.includes('highgrowth')) return 'highgrowth-active'
  if (opt.includes('growth') && !opt.includes('conservative') && !opt.includes('balanced')) return 'growth-active'
  if (opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')) return 'conservative-active'
  if (opt.includes('cash')) return 'cash'
  return 'balanced-active' // default — most people are in some form of balanced
}

function categoryLabel(cat: string): string {
  return {
    'balanced-active': 'Balanced (active management)',
    'balanced-indexed': 'Balanced (indexed / passive)',
    'highgrowth-active': 'High Growth (active)',
    'growth-active': 'Growth (active)',
    'conservative-active': 'Conservative / Capital Stable',
    'cash': 'Cash',
  }[cat] ?? 'Balanced'
}

function feeRating(fee: number): { label: string; color: string } {
  if (fee <= 0.20) return { label: 'Very low', color: '#059669' }
  if (fee <= 0.50) return { label: 'Low', color: '#00D4AA' }
  if (fee <= 0.80) return { label: 'Average', color: '#D97706' }
  return { label: 'High', color: '#EF4444' }
}

export function FundsClient({ superProfile: sp }: { superProfile: any }) {
  const [showAll, setShowAll] = useState(false)

  // Pull real user data from profile
  const userFundName = sp?.fund_name ?? ''
  const userOption = sp?.fund_option ?? ''
  const userFee = sp?.fund_fee_pct ?? 0
  const userBalance = sp?.current_balance ?? 0
  const hasProfile = !!userFundName && userBalance > 0

  // Detect what category the user is in for like-for-like comparison
  const userCategory = useMemo(() => detectCategory(userFundName, userOption), [userFundName, userOption])

  // Like-for-like peers — same category, sorted by 7yr return
  const peers = useMemo(() =>
    ALL_OPTIONS
      .filter(o => o.category === userCategory)
      .sort((a, b) => b.ret7 - a.ret7),
    [userCategory]
  )

  // Best fund in same category
  const bestFee = useMemo(() => Math.min(...peers.map(p => p.fee)), [peers])
  const bestReturn = useMemo(() => Math.max(...peers.map(p => p.ret7)), [peers])
  const bestFeeFund = useMemo(() => peers.find(p => p.fee === bestFee), [peers, bestFee])
  const bestReturnFund = useMemo(() => peers.find(p => p.ret7 === bestReturn), [peers, bestReturn])

  // 20-year fee drag vs best-fee peer
  const feeDrag20yr = useMemo(() => {
    if (!hasProfile || userFee === 0) return null
    return calcFeeDrag(userBalance, userFee, bestFee, 20,
      (sp?.salary ?? 0) * (sp?.employer_sg_rate ?? 12) / 100)
  }, [userBalance, userFee, bestFee, sp, hasProfile])

  // Find user's fund in the peer list
  const userFundInPeers = peers.find(p =>
    p.fund.toLowerCase().includes(userFundName.toLowerCase().split(' ')[0]) &&
    p.option.toLowerCase().includes(userOption.toLowerCase().split(' ')[0])
  )

  const displayPeers = showAll ? peers : peers.slice(0, 8)

  const card: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }

  if (!hasProfile) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...card, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>≡</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Set up your profile first</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Enter your fund name, investment option, and balance in Settings to see a personalised fund comparison showing exactly how your option stacks up.
          </p>
          <a href="/settings" style={{ background: '#0F1E3C', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Go to Settings →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1040 }}>

      {/* ── YOUR FUND SUMMARY BAR ── */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Your fund
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>{userFundName}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{userOption}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Comparing against: {categoryLabel(userCategory)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Your fee</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: feeRating(userFee).color }}>{userFee}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{feeRating(userFee).label}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Fee (annual $)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: 'white' }}>{fmt(userBalance * userFee / 100)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>on {fmt(userBalance)}</div>
            </div>
            {feeDrag20yr && userFee > bestFee && (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>20-yr fee drag vs cheapest peer</div>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: '#EF4444' }}>−{fmt(feeDrag20yr.drag)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>compared to {bestFeeFund?.fund} {bestFeeFund?.option}</div>
              </div>
            )}
            {userFee <= bestFee + 0.05 && (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Fee rank</div>
                <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: '#00D4AA' }}>✓ Best</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>lowest-fee in category</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KEY INSIGHTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Best fee peer */}
        <div style={{ ...card, borderLeft: '3px solid #00D4AA' }}>
          <div style={sectionLabel}>Lowest fee in your category</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestFeeFund?.fund}</div>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestFeeFund?.option}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#00D4AA' }}>{bestFee}%</div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>vs your {userFee}% — saves {fmt((userFee - bestFee) * userBalance / 100)}/yr</div>
          {userFee > bestFee && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.5 }}>
              Over 20 years, switching to this fund could leave you with{' '}
              <strong style={{ color: '#059669' }}>{feeDrag20yr ? fmt(feeDrag20yr.drag) : '—'} more</strong> in retirement.
            </div>
          )}
        </div>

        {/* Best return peer */}
        <div style={{ ...card, borderLeft: '3px solid #534AB7' }}>
          <div style={sectionLabel}>Best 7-yr return in your category</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestReturnFund?.fund}</div>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestReturnFund?.option}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#534AB7' }}>{bestReturn}% p.a.</div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
            {userFundInPeers
              ? `vs your fund's ${userFundInPeers.ret7}% — ${(bestReturn - userFundInPeers.ret7).toFixed(1)}% difference`
              : `Your fund's return not in database — check fund website`}
          </div>
          {userFundInPeers && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.5 }}>
              A {(bestReturn - userFundInPeers.ret7).toFixed(1)}% return difference on {fmt(userBalance)} = approx{' '}
              <strong style={{ color: '#534AB7' }}>{fmt((bestReturn - userFundInPeers.ret7) * userBalance / 100)}/yr</strong> more.
            </div>
          )}
        </div>

        {/* Net benefit (best return - fee) */}
        <div style={{ ...card, borderLeft: '3px solid #F59E0B' }}>
          <div style={sectionLabel}>Best net value (return minus fee)</div>
          {(() => {
            const bestNet = [...peers].sort((a, b) => (b.ret7 - b.fee) - (a.ret7 - a.fee))[0]
            const userNet = userFundInPeers ? userFundInPeers.ret7 - userFundInPeers.fee : null
            return (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestNet.fund}</div>
                <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestNet.option}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 500, color: '#D97706' }}>{(bestNet.ret7 - bestNet.fee).toFixed(2)}% net</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                  {userNet ? `vs your est. ${userNet.toFixed(2)}% net — ${(bestNet.ret7 - bestNet.fee - userNet).toFixed(2)}% gap` : 'Your net return not available'}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.5 }}>
                  Net return = 7-yr return minus investment fee. Best indicator of overall value.
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* ── LIKE-FOR-LIKE TABLE ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={sectionLabel}>{categoryLabel(userCategory)} — like-for-like comparison</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              Showing {peers.length} funds in the same category as your option · ranked by 7-year net return
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', fontStyle: 'italic' }}>
            {userCategory === 'balanced-indexed' ? '⚡ You\'re in an indexed option — these comparisons are most relevant' : ''}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                {[
                  { label: '#', align: 'left' },
                  { label: 'Fund', align: 'left' },
                  { label: 'Option', align: 'left' },
                  { label: 'Type', align: 'left' },
                  { label: '7-yr return', align: 'right' },
                  { label: 'Fee %', align: 'right' },
                  { label: `Fee/yr (${fmt(userBalance)})`, align: 'right' },
                  { label: 'Net return', align: 'right' },
                  { label: 'APRA 2025', align: 'right' },
                ].map(h => (
                  <th key={h.label} style={{ textAlign: h.align as any, padding: '6px 10px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayPeers.map((fund, i) => {
                const isUserFund = userFundInPeers === fund
                const isBestFee = fund.fee === bestFee
                const isBestReturn = fund.ret7 === bestReturn
                const netReturn = fund.ret7 - fund.fee
                const feeAnnual = fund.fee / 100 * userBalance
                const feeSaving = (userFee - fund.fee) / 100 * userBalance
                const fr = feeRating(fund.fee)

                return (
                  <tr key={`${fund.fund}-${fund.option}`} style={{
                    borderBottom: '1px solid rgba(15,30,60,0.05)',
                    background: isUserFund ? 'rgba(0,212,170,0.04)' : 'transparent',
                  }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.3)', fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: '10px', fontWeight: 500, color: '#0F1E3C', whiteSpace: 'nowrap' }}>
                      {fund.fund}
                      {isUserFund && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(0,212,170,0.1)', color: '#065F46', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>YOUR FUND</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', color: 'rgba(15,30,60,0.6)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fund.option}
                      {isBestFee && <span style={{ marginLeft: 6, fontSize: 9, background: '#ECFDF5', color: '#065F46', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOWEST FEE</span>}
                      {isBestReturn && <span style={{ marginLeft: 6, fontSize: 9, background: '#EDE9FE', color: '#3C3489', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>TOP RETURN</span>}
                    </td>
                    <td style={{ padding: '10px', fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{fund.type}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 500, color: fund.ret7 >= 9 ? '#00D4AA' : fund.ret7 >= 8 ? '#0F1E3C' : '#D97706' }}>
                      {fund.ret7}%
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: fr.color, fontWeight: fund.fee > 0.9 ? 600 : 400 }}>
                      {fund.fee}%
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right' }}>
                      <span style={{ color: fund.fee <= userFee ? '#059669' : '#EF4444' }}>
                        {fmt(feeAnnual)}/yr
                      </span>
                      {!isUserFund && feeSaving > 0 && (
                        <div style={{ fontSize: 10, color: '#059669' }}>save {fmt(feeSaving)}/yr</div>
                      )}
                      {!isUserFund && feeSaving < 0 && (
                        <div style={{ fontSize: 10, color: '#EF4444' }}>+{fmt(-feeSaving)}/yr more</div>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: netReturn >= 8.5 ? '#00D4AA' : netReturn >= 7.5 ? '#0F1E3C' : '#D97706' }}>
                      {netReturn.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: fund.apra === 'passed' ? 'rgba(0,212,170,0.1)' : '#FEF2F2', color: fund.apra === 'passed' ? '#065F46' : '#991B1B' }}>
                        {fund.apra === 'passed' ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {peers.length > 8 && (
          <button onClick={() => setShowAll(v => !v)}
            style={{ marginTop: 12, background: 'none', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 8, padding: '6px 16px', fontSize: 12, color: 'rgba(15,30,60,0.6)', cursor: 'pointer' }}>
            {showAll ? `Show top 8 only` : `Show all ${peers.length} options in this category`}
          </button>
        )}
      </div>

      {/* ── WHAT THIS MEANS FOR YOU ── */}
      {hasProfile && userFee > 0 && (
        <div style={{ ...card, marginTop: 20, background: 'rgba(15,30,60,0.03)', border: '1px solid rgba(15,30,60,0.08)' }}>
          <div style={sectionLabel}>What this means for you</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {userFee > bestFee + 0.1 && (
              <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>💸 Fee savings opportunity</div>
                <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                  Switching from <strong>{userFundName} {userOption}</strong> ({userFee}%) to{' '}
                  <strong>{bestFeeFund?.fund} {bestFeeFund?.option}</strong> ({bestFee}%) would save you{' '}
                  <strong style={{ color: '#059669' }}>{fmt((userFee - bestFee) * userBalance / 100)} per year</strong> in fees.
                  Over 20 years that compounds to approximately{' '}
                  <strong style={{ color: '#059669' }}>{feeDrag20yr ? fmt(feeDrag20yr.drag) : '—'}</strong>.
                </div>
              </div>
            )}

            {userFee <= bestFee + 0.05 && (
              <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(0,212,170,0.2)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✓ You're in a low-fee option</div>
                <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6, opacity: 0.9 }}>
                  Your {userFee}% fee is among the lowest available in this category. You're not overpaying for investment management. Focus on contribution strategy and returns instead.
                </div>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>📊 Net return matters most</div>
              <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                The best measure of fund value is <strong>return minus fee</strong>. A fund returning 9.2% with a 0.14% fee (net 9.06%) beats one returning 8.4% with a 0.78% fee (net 7.62%) — despite the lower headline return.
                {userFundInPeers && (
                  <> Your estimated net return: <strong style={{ color: '#0F1E3C' }}>{(userFundInPeers.ret7 - userFundInPeers.fee).toFixed(2)}% p.a.</strong></>
                )}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>⚠ Important caveat</div>
              <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                Past 7-year returns don't guarantee future performance. Switching funds should consider: exit fees, insurance implications, contribution history, and your specific investment objectives. Consider speaking with a financial adviser before switching.
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>General information only.</strong> Returns are 7-year net returns after investment fees and tax to 30 June 2025 (SuperRatings data). Fees are indicative investment fees from fund PDSs at June 2026 — administration fees (typically $78–104/yr flat) are additional and not shown. Past performance is not a reliable indicator of future returns. This comparison does not constitute a recommendation to switch funds. Before making any decision, consider whether switching is appropriate for your circumstances and check for any exit fees, insurance implications, or loss of contribution history.
      </div>
    </div>
  )
}
