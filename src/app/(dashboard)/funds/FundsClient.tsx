'use client'
import { useState, useMemo } from 'react'
import { calcFeeDrag, fmt, fmtShort } from '@/lib/calculations'

// ─── FUND DATA ───────────────────────────────────────────────────────────────
// ret7 = 7-year net return after investment fees and tax (SuperRatings to Jun 2025)
// fee  = total investment fee % p.a. (fund PDSs, June 2026)
// Sources: fund PDSs, SuperRatings, APRA heatmap

const ALL_OPTIONS = [
  // ── BALANCED ACTIVE ──
  { fund: 'UniSuper', option: 'Balanced', type: 'Industry', category: 'balanced-active', ret7: 9.1, fee: 0.41, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'Australian Retirement Trust', option: 'Balanced', type: 'Industry', category: 'balanced-active', ret7: 8.9, fee: 0.54, apra: 'passed', esg: 'Excludes tobacco, cluster munitions', index: 'Active' },
  { fund: 'AustralianSuper', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.7, fee: 0.57, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  { fund: 'Aware Super', option: 'Balanced Growth', type: 'Industry', category: 'balanced-active', ret7: 8.2, fee: 0.57, apra: 'passed', esg: 'Excludes tobacco, coal, controversial weapons', index: 'Active' },
  { fund: 'Hostplus', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.4, fee: 0.78, apra: 'passed', esg: 'Excludes controversial weapons', index: 'Active' },
  { fund: 'Cbus', option: 'Growth (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 8.0, fee: 0.57, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  { fund: 'REST', option: 'Core Strategy', type: 'Industry', category: 'balanced-active', ret7: 7.9, fee: 0.62, apra: 'passed', esg: 'Tobacco exclusion only', index: 'Active' },
  { fund: 'HESTA', option: 'MySuper Balanced Growth', type: 'Industry', category: 'balanced-active', ret7: 7.8, fee: 0.67, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  { fund: 'Spirit Super', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active', ret7: 7.6, fee: 0.71, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'ANZ Smart Choice', option: 'Balanced', type: 'Retail', category: 'balanced-active', ret7: 7.1, fee: 0.85, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'MLC Super', option: 'Balanced', type: 'Retail', category: 'balanced-active', ret7: 6.9, fee: 1.10, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'Colonial First State', option: 'Diversified', type: 'Retail', category: 'balanced-active', ret7: 6.7, fee: 0.95, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'BT Super', option: 'MySuper Lifestage', type: 'Retail', category: 'balanced-active', ret7: 6.8, fee: 1.24, apra: 'failed', esg: 'None', index: 'Active' },
  // ── BALANCED INDEXED ──
  // Note: AustralianSuper Indexed Diversified tracks MSCI World / ASX 300 style
  { fund: 'AustralianSuper', option: 'Indexed Diversified', type: 'Industry', category: 'balanced-indexed', ret7: 9.2, fee: 0.14, apra: 'passed', esg: 'Partial screens', index: 'Passive — MSCI World + ASX 300 style' },
  { fund: 'Hostplus', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed', ret7: 9.0, fee: 0.11, apra: 'passed', esg: 'Excludes controversial weapons', index: 'Passive — S&P/ASX 200 + MSCI World ex-AU' },
  { fund: 'Australian Retirement Trust', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed', ret7: 8.8, fee: 0.16, apra: 'passed', esg: 'Excludes tobacco, cluster munitions', index: 'Passive — MSCI AU 300 + MSCI ACWI ex-AU' },
  { fund: 'Aware Super', option: 'Indexed Growth', type: 'Industry', category: 'balanced-indexed', ret7: 8.7, fee: 0.15, apra: 'passed', esg: 'Excludes tobacco, coal, controversial weapons + ESG tilt', index: 'Passive — Custom MSCI ESG-screened index' },
  // REST: effective fee ~0.14-0.245% due to derivative structure hidden costs (see note)
  { fund: 'REST', option: 'Indexed (note: effective fee ~0.15–0.24%)', type: 'Industry', category: 'balanced-indexed', ret7: 8.6, fee: 0.00, apra: 'passed', esg: 'Tobacco exclusion only', index: 'Passive via derivatives (counterparty risk — see note below)', restWarning: true },
  // ── INDEXED SHARES (equities-only, compare vs high growth) ──
  { fund: 'Hostplus', option: 'Indexed Shares', type: 'Industry', category: 'highgrowth-active', ret7: 10.1, fee: 0.08, apra: 'passed', esg: 'Excludes controversial weapons', index: 'Passive — S&P/ASX 200 + MSCI World ex-AU (unhedged)' },
  { fund: 'REST', option: 'International Indexed (note: effective fee ~0.20–0.35%)', type: 'Industry', category: 'highgrowth-active', ret7: 9.7, fee: 0.00, apra: 'passed', esg: 'Tobacco exclusion only', index: 'Passive via derivatives (counterparty risk)', restWarning: true },
  { fund: 'AustralianSuper', option: 'Indexed Diversified', type: 'Industry', category: 'highgrowth-active', ret7: 9.2, fee: 0.14, apra: 'passed', esg: 'Partial screens', index: 'Passive' },
  // ── HIGH GROWTH ACTIVE ──
  { fund: 'AustralianSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.8, fee: 0.58, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  { fund: 'UniSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.6, fee: 0.43, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'Aware Super', option: 'High Growth (MySuper)', type: 'Industry', category: 'highgrowth-active', ret7: 9.4, fee: 0.63, apra: 'passed', esg: 'Excludes tobacco, coal, controversial weapons', index: 'Active' },
  { fund: 'Australian Retirement Trust', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.3, fee: 0.62, apra: 'passed', esg: 'Excludes tobacco, cluster munitions', index: 'Active' },
  { fund: 'Cbus', option: 'High Growth', type: 'Industry', category: 'highgrowth-active', ret7: 9.1, fee: 0.64, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  // ── GROWTH ACTIVE ──
  { fund: 'UniSuper', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 9.3, fee: 0.43, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'Aware Super', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 8.8, fee: 0.60, apra: 'passed', esg: 'Excludes tobacco, coal', index: 'Active' },
  { fund: 'Spirit Super', option: 'Growth', type: 'Industry', category: 'growth-active', ret7: 8.3, fee: 0.75, apra: 'passed', esg: 'None', index: 'Active' },
  // ── CONSERVATIVE ──
  { fund: 'UniSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active', ret7: 6.2, fee: 0.37, apra: 'passed', esg: 'None', index: 'Active' },
  { fund: 'AustralianSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active', ret7: 6.4, fee: 0.51, apra: 'passed', esg: 'Partial screens', index: 'Active' },
  { fund: 'Cbus', option: 'Conservative', type: 'Industry', category: 'conservative-active', ret7: 5.9, fee: 0.44, apra: 'passed', esg: 'Partial screens', index: 'Active' },
] as const

type FundOption = typeof ALL_OPTIONS[number] & { restWarning?: boolean }

function detectCategory(optionName: string): string {
  const opt = (optionName ?? '').toLowerCase()
  if (opt.includes('indexed share') || opt.includes('indexed global') || opt.includes('index share')) return 'highgrowth-active'
  if (opt.includes('indexed') || opt.includes('index ')) return 'balanced-indexed'
  if (opt.includes('high growth') || opt.includes('highgrowth')) return 'highgrowth-active'
  if (opt.includes('growth') && !opt.includes('conservative') && !opt.includes('balanced')) return 'growth-active'
  if (opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')) return 'conservative-active'
  if (opt.includes('cash')) return 'cash'
  return 'balanced-active'
}

function categoryLabel(cat: string, optionName?: string): string {
  if (cat === 'highgrowth-active' && (optionName ?? '').toLowerCase().includes('indexed')) return 'Indexed Shares / Equities'
  return {
    'balanced-active': 'Balanced — Active Management',
    'balanced-indexed': 'Balanced — Indexed / Passive',
    'highgrowth-active': 'High Growth',
    'growth-active': 'Growth',
    'conservative-active': 'Conservative',
    'cash': 'Cash',
  }[cat] ?? 'Balanced'
}

// Asset allocation bands from Lazy Koala article
const ASSET_ALLOCATION: Record<string, { growth: string; defensive: string; desc: string }> = {
  'conservative-active': { growth: '30–50%', defensive: '50–70%', desc: 'Lower risk, lower long-term return. Suits shorter time horizons or low risk tolerance.' },
  'balanced-active': { growth: '50–75%', defensive: '25–50%', desc: 'Moderate risk/return balance. The most common default option.' },
  'balanced-indexed': { growth: '50–75%', defensive: '25–50%', desc: 'Same risk profile as balanced active, but lower fees via passive management.' },
  'growth-active': { growth: '75–90%', defensive: '10–25%', desc: 'Higher growth focus. Suits longer time horizons and higher risk tolerance.' },
  'highgrowth-active': { growth: '90–100%', defensive: '0–10%', desc: 'Maximum growth. Suits 10+ year time horizon and ability to withstand drawdowns.' },
  'cash': { growth: '0%', defensive: '100%', desc: 'Capital preservation only. Minimal returns, no real growth.' },
}

function feeColor(fee: number): string {
  if (fee <= 0.15) return '#059669'
  if (fee <= 0.50) return '#00D4AA'
  if (fee <= 0.80) return '#D97706'
  return '#EF4444'
}

export function FundsClient({ superProfile: sp }: { superProfile: any }) {
  const [showAll, setShowAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'comparison' | 'education' | 'spiva'>('comparison')

  const userFundName: string = sp?.fund_name ?? ''
  const userOption: string = sp?.fund_option ?? ''
  const userFee: number = sp?.fund_fee_pct ?? 0
  const userBalance: number = sp?.current_balance ?? 0
  const userAge: number = sp?.age ?? 40
  const retirementAge: number = sp?.target_retirement_age ?? 65
  const yearsToRetirement = Math.max(0, retirementAge - userAge)
  const annualContrib: number = (sp?.salary ?? 0) * ((sp?.employer_sg_rate ?? 12) / 100)
  const hasProfile = !!userFundName && userBalance > 0

  const userCategory = useMemo(() => detectCategory(userOption), [userOption])
  const peers = useMemo(() =>
    (ALL_OPTIONS as unknown as FundOption[])
      .filter(o => o.category === userCategory)
      .sort((a, b) => b.ret7 - a.ret7),
    [userCategory]
  )
  const bestFee = useMemo(() => Math.min(...peers.map(p => p.fee).filter(f => f > 0)), [peers])
  const bestReturn = useMemo(() => Math.max(...peers.map(p => p.ret7)), [peers])
  const bestFeeFund = useMemo(() => peers.find(p => p.fee === bestFee), [peers, bestFee])
  const bestReturnFund = useMemo(() => peers.find(p => p.ret7 === bestReturn), [peers, bestReturn])
  const feeDrag20yr = useMemo(() => {
    if (!hasProfile || userFee === 0 || userFee <= bestFee + 0.05) return null
    return calcFeeDrag(userBalance, userFee, bestFee, 20, annualContrib)
  }, [userBalance, userFee, bestFee, hasProfile, annualContrib])
  const allocationInfo = ASSET_ALLOCATION[userCategory]
  const userFundInPeers = useMemo(() => {
    if (!userFundName || !userOption) return undefined
    const fl = userFundName.toLowerCase(), ol = userOption.toLowerCase()
    return peers.find(p => p.fund.toLowerCase() === fl && p.option.toLowerCase() === ol)
      ?? peers.find(p => fl.includes(p.fund.toLowerCase().split(' ')[0]) && (p.option.toLowerCase().includes(ol) || ol.includes(p.option.toLowerCase())))
      ?? peers.find(p => fl.includes(p.fund.toLowerCase().split(' ')[0]) && p.option.toLowerCase().includes(ol.split(' ').slice(0, 2).join(' ')))
  }, [peers, userFundName, userOption])

  const displayPeers = showAll ? peers : peers.slice(0, 8)
  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const sl: React.CSSProperties = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }
  const tabBtn = (tab: typeof activeTab) => ({
    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: activeTab === tab ? '#0F1E3C' : 'white',
    color: activeTab === tab ? 'white' : 'rgba(15,30,60,0.6)',
    boxShadow: activeTab === tab ? 'none' : '0 0 0 1px rgba(15,30,60,0.12)',
  } as React.CSSProperties)

  if (!hasProfile) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...c, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>≡</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Set up your profile first</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Enter your fund name, investment option, and balance in Settings to see a fully personalised fund comparison.
          </p>
          <a href="/settings" style={{ background: '#0F1E3C', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Go to Settings →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1040 }}>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabBtn('comparison')} onClick={() => setActiveTab('comparison')}>Your fund comparison</button>
        <button style={tabBtn('education')} onClick={() => setActiveTab('education')}>Investment option guide</button>
        <button style={tabBtn('spiva')} onClick={() => setActiveTab('spiva')}>Active vs passive research</button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 1: COMPARISON */}
      {activeTab === 'comparison' && (
        <>
          {/* Your fund banner */}
          <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your fund</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>{userFundName}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{userOption}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                    {categoryLabel(userCategory, userOption)}
                  </span>
                  {allocationInfo && (
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      ~{allocationInfo.growth} growth assets
                    </span>
                  )}
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                    {yearsToRetirement} years to retirement
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 28 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Your fee</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: feeColor(userFee) }}>{userFee}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{fmt(userBalance * userFee / 100)}/yr on {fmt(userBalance)}</div>
                </div>
                {feeDrag20yr && (
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>20-yr fee drag</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: '#EF4444' }}>−{fmt(feeDrag20yr.drag)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>vs {bestFeeFund?.fund} {bestFeeFund?.option}</div>
                  </div>
                )}
                {userFee <= bestFee + 0.05 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Fee rank</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: '#00D4AA' }}>✓ Best</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>lowest in category</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk tolerance prompt based on age */}
          {allocationInfo && (
            <div style={{ background: yearsToRetirement > 20 ? 'rgba(83,74,183,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${yearsToRetirement > 20 ? 'rgba(83,74,183,0.2)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: '#0F1E3C', marginBottom: 6, fontSize: 14 }}>
                {yearsToRetirement > 20
                  ? `⚡ ${yearsToRetirement} years to retirement — are you in the right option?`
                  : `⚠ ${yearsToRetirement} years to retirement — consider reviewing your risk level`}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
                Your <strong>{userOption}</strong> option holds approximately <strong>{allocationInfo.growth} growth assets</strong>. {allocationInfo.desc}
                {yearsToRetirement > 20 && userCategory !== 'highgrowth-active' && userCategory !== 'balanced-indexed' && (
                  <> With {yearsToRetirement} years until retirement, you have the <em>ability</em> to take on more growth — research consistently shows higher-growth options outperform over 20+ year horizons. Consider whether your current option matches your ability, willingness, and need to take risk.</>
                )}
                {yearsToRetirement <= 10 && (userCategory === 'highgrowth-active') && (
                  <> With only {yearsToRetirement} years to go, a drawdown in a high-growth option close to retirement can significantly impact your balance. Consider whether a more defensive allocation suits your situation.</>
                )}
              </div>
            </div>
          )}

          {/* Three insight cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ ...c, borderLeft: '3px solid #00D4AA' }}>
              <div style={sl}>Lowest fee in your category</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestFeeFund?.fund}</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestFeeFund?.option}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#00D4AA' }}>{bestFee}%</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                {userFee > bestFee ? `saves ${fmt((userFee - bestFee) * userBalance / 100)}/yr vs your fund` : '← you are here'}
              </div>
              {feeDrag20yr && <div style={{ marginTop: 8, fontSize: 11, color: '#059669', lineHeight: 1.5 }}>Over 20 years: <strong>{fmt(feeDrag20yr.drag)} more</strong> at retirement</div>}
            </div>

            <div style={{ ...c, borderLeft: '3px solid #534AB7' }}>
              <div style={sl}>Best 7-yr return in your category</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestReturnFund?.fund}</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestReturnFund?.option}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#534AB7' }}>{bestReturn}% p.a.</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                {userFundInPeers ? `vs your fund's est. ${userFundInPeers.ret7}%` : 'Your fund return not in database'}
              </div>
              {userFundInPeers && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#534AB7', lineHeight: 1.5 }}>
                  Return difference: <strong>~{fmt((bestReturn - userFundInPeers.ret7) * userBalance / 100)}/yr</strong> on your balance
                </div>
              )}
            </div>

            <div style={{ ...c, borderLeft: '3px solid #F59E0B' }}>
              <div style={sl}>Best net value (return − fee)</div>
              {(() => {
                const bestNet = [...peers].sort((a, b) => (b.ret7 - b.fee) - (a.ret7 - a.fee))[0]
                const userNet = userFundInPeers ? userFundInPeers.ret7 - userFundInPeers.fee : null
                return (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestNet.fund}</div>
                    <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestNet.option}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#D97706' }}>{(bestNet.ret7 - bestNet.fee).toFixed(2)}% net</div>
                    <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                      {userNet ? `vs your est. ${userNet.toFixed(2)}% net` : 'Net return not available'}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.5 }}>Net return = 7-yr return minus fee. Most honest single measure of fund value.</div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Table */}
          <div style={c}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={sl}>{categoryLabel(userCategory, userOption)} — like-for-like comparison · {peers.length} funds</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>Ranked by 7-year net return. Fee columns use your balance of {fmt(userBalance)}.</div>
              </div>
            </div>

            {/* REST warning */}
            {userCategory === 'balanced-indexed' && (
              <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
                <strong>⚠ REST "0% fee" note:</strong> REST's indexed options use derivative contracts (total return swaps) rather than directly buying shares, which introduces counterparty risk. Additionally, the international index benchmarks assume worst-case tax treatment, creating a hidden effective cost of approximately 0.20–0.35% p.a. on international holdings. The true effective fee is estimated at 0.14–0.24% — not zero.
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                    {[
                      { l: '#', a: 'left' }, { l: 'Fund', a: 'left' }, { l: 'Option', a: 'left' },
                      { l: 'Type', a: 'left' }, { l: '7-yr return', a: 'right' }, { l: 'Fee %', a: 'right' },
                      { l: `Fee/yr`, a: 'right' }, { l: 'Net return', a: 'right' }, { l: 'ESG', a: 'right' }, { l: 'APRA', a: 'right' }
                    ].map(h => (
                      <th key={h.l} style={{ textAlign: h.a as any, padding: '6px 10px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayPeers.map((fund: any, i: number) => {
                    const isUser = userFundInPeers === fund
                    const isBestFee = fund.fee > 0 && fund.fee === bestFee
                    const isBestReturn = fund.ret7 === bestReturn
                    const net = fund.fee > 0 ? fund.ret7 - fund.fee : fund.ret7
                    const feeAnnual = fund.fee / 100 * userBalance
                    const saving = (userFee - fund.fee) / 100 * userBalance
                    return (
                      <tr key={`${fund.fund}-${fund.option}`} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: isUser ? 'rgba(0,212,170,0.04)' : 'transparent' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.3)', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: '10px', fontWeight: 500, color: '#0F1E3C', whiteSpace: 'nowrap' }}>
                          {fund.fund}
                          {isUser && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(0,212,170,0.1)', color: '#065F46', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>YOUR FUND</span>}
                        </td>
                        <td style={{ padding: '10px', fontSize: 12, color: 'rgba(15,30,60,0.65)', maxWidth: 200 }}>
                          <div>{fund.option.replace(' (note: effective fee ~0.15–0.24%)', '').replace(' (note: effective fee ~0.20–0.35%)', '')}</div>
                          {fund.restWarning && <div style={{ fontSize: 10, color: '#D97706', marginTop: 2 }}>⚠ Derivative structure — see note</div>}
                          {isBestFee && <span style={{ fontSize: 9, background: '#ECFDF5', color: '#065F46', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOWEST FEE</span>}
                          {isBestReturn && <span style={{ marginLeft: 4, fontSize: 9, background: '#EDE9FE', color: '#3C3489', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>TOP RETURN</span>}
                        </td>
                        <td style={{ padding: '10px', fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{fund.type}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 500, color: fund.ret7 >= 9 ? '#00D4AA' : fund.ret7 >= 8 ? '#0F1E3C' : '#D97706' }}>{fund.ret7}%</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: feeColor(fund.fee), fontWeight: fund.fee > 0.9 ? 600 : 400 }}>
                          {fund.fee === 0 ? <span style={{ color: '#D97706' }}>~0%*</span> : `${fund.fee}%`}
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right' }}>
                          <span style={{ color: fund.fee > 0 && fund.fee <= userFee ? '#059669' : '#EF4444' }}>
                            {fund.fee === 0 ? '~$0*' : `${fmt(feeAnnual)}/yr`}
                          </span>
                          {!isUser && fund.fee > 0 && saving > 50 && <div style={{ fontSize: 10, color: '#059669' }}>save {fmt(saving)}/yr</div>}
                          {!isUser && fund.fee > 0 && saving < -50 && <div style={{ fontSize: 10, color: '#EF4444' }}>+{fmt(-saving)}/yr more</div>}
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', textAlign: 'right', color: net >= 8.5 ? '#00D4AA' : net >= 7.5 ? '#0F1E3C' : '#D97706' }}>
                          {fund.fee === 0 ? <span style={{ color: '#D97706' }}>N/A*</span> : `${net.toFixed(2)}%`}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: 11, color: 'rgba(15,30,60,0.5)', maxWidth: 140 }}>
                          {(fund.esg ?? 'None') === 'None' ? <span style={{ color: 'rgba(15,30,60,0.3)' }}>None</span> : <span style={{ color: '#065F46' }}>✓ Screens</span>}
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
              <button onClick={() => setShowAll(v => !v)} style={{ marginTop: 12, background: 'none', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 8, padding: '6px 16px', fontSize: 12, color: 'rgba(15,30,60,0.6)', cursor: 'pointer' }}>
                {showAll ? 'Show top 8 only' : `Show all ${peers.length} in this category`}
              </button>
            )}
          </div>

          {/* What this means */}
          {hasProfile && (
            <div style={{ ...c, marginTop: 20, background: 'rgba(15,30,60,0.03)', border: '1px solid rgba(15,30,60,0.08)' }}>
              <div style={sl}>What this means for you</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {feeDrag20yr && userFee > bestFee + 0.1 ? (
                  <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>💸 Fee savings opportunity</div>
                    <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
                      Switching to <strong>{bestFeeFund?.fund} {bestFeeFund?.option}</strong> ({bestFee}%) would save{' '}
                      <strong style={{ color: '#059669' }}>{fmt((userFee - bestFee) * userBalance / 100)}/yr</strong>.
                      Compounded with your ongoing contributions over 20 years: approximately <strong style={{ color: '#059669' }}>{fmt(feeDrag20yr.drag)} more</strong> at retirement.
                      A 1% fee difference has the same long-term impact as a 1% lower investment return.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(0,212,170,0.2)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✓ You are in a low-fee option</div>
                    <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.7, opacity: 0.9 }}>
                      Your {userFee > 0 ? `${userFee}%` : 'current'} fee is at or near the lowest available in this category. Focus your attention on contribution strategy and ensuring your asset allocation matches your time horizon.
                    </div>
                  </div>
                )}
                <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>📊 Net return is the real measure</div>
                  <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
                    A fund returning 9.2% at 0.14% fee (net 9.06%) beats one returning 8.4% at 0.78% (net 7.62%) despite the lower headline number. Research shows a 1% fee during retirement reduces retiree income by 15% and inheritance by 23%.
                    {userFundInPeers && <> Your estimated net return: <strong style={{ color: '#0F1E3C' }}>{(userFundInPeers.ret7 - userFundInPeers.fee).toFixed(2)}%</strong>.</>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 2: EDUCATION */}
      {activeTab === 'education' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <div style={c}>
            <div style={sl}>Investment option types explained</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Conservative', growth: '30–50%', def: '50–70%', risk: 'Low', color: '#059669', desc: 'Suits people close to retirement or with low risk tolerance. Lower long-term returns.' },
                { name: 'Balanced', growth: '50–75%', def: '25–50%', risk: 'Medium', color: '#00D4AA', desc: 'The most common default (MySuper). Moderate risk and return. Most people start here.' },
                { name: 'Growth', growth: '75–90%', def: '10–25%', risk: 'Med–High', color: '#D97706', desc: 'Higher equity weighting. Better long-term returns. Suits 10+ year horizons.' },
                { name: 'High Growth / Indexed Shares', growth: '90–100%', def: '0–10%', risk: 'High', color: '#EF4444', desc: 'Near 100% equities. Maximum growth for long horizons. Can fall 25–45% in a crash.' },
              ].map(opt => (
                <div key={opt.name} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${opt.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>{opt.name}</div>
                    <span style={{ fontSize: 11, background: 'rgba(15,30,60,0.06)', padding: '2px 8px', borderRadius: 12, color: 'rgba(15,30,60,0.6)' }}>Risk: {opt.risk}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Growth: <strong style={{ color: opt.color }}>{opt.growth}</strong></span>
                    <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Defensive: <strong>{opt.def}</strong></span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={c}>
              <div style={sl}>The 3-factor risk framework</div>
              <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 12 }}>
                Choosing the right option isn't just about how much risk you think you can stomach. Three factors should align:
              </p>
              {[
                { factor: 'Ability', icon: '⏳', desc: 'Can your time horizon sustain market crashes and recover? A 25-year-old with 40 years to retirement has the ability to ride out multiple downturns in a 100% equities option.' },
                { factor: 'Willingness', icon: '🧠', desc: 'Will you emotionally stay the course when markets fall 40%? The best strategy only works if you stick to it. A lower-growth option you hold through a crash beats a high-growth option you panic-sell.' },
                { factor: 'Need', icon: '🎯', desc: "Do you actually need to take more risk? If you already have enough for your retirement goal, taking excess risk with no extra benefit isn't rational." },
              ].map(f => (
                <div key={f.factor} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 3 }}>{f.factor}</div>
                    <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={c}>
              <div style={sl}>Long-run asset class returns (Vanguard data to Jun 2023)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                    {['Asset class', '10yr', '20yr', '30yr'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Asset class' ? 'left' : 'right', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Australian shares', ten: '8.8%', twenty: '9.0%', thirty: '9.2%', color: '#00D4AA' },
                    { name: 'International shares', ten: '13.2%', twenty: '8.4%', thirty: '7.5%', color: '#00D4AA' },
                    { name: 'Australian property', ten: '7.7%', twenty: '5.2%', thirty: '7.3%', color: '#D97706' },
                    { name: 'Australian bonds', ten: '2.4%', twenty: '4.2%', thirty: '5.5%', color: 'rgba(15,30,60,0.5)' },
                    { name: 'Cash', ten: '1.7%', twenty: '3.5%', thirty: '4.2%', color: 'rgba(15,30,60,0.4)' },
                  ].map(r => (
                    <tr key={r.name} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                      <td style={{ padding: '7px 8px', fontSize: 12, color: '#0F1E3C' }}>{r.name}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.color }}>{r.ten}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.color }}>{r.twenty}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.color }}>{r.thirty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 8 }}>Past performance does not indicate future returns.</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 3: ACTIVE VS PASSIVE */}
      {activeTab === 'spiva' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={c}>
            <div style={sl}>Active vs passive — what the research says</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { stat: '84%', desc: 'of active Australian funds underperformed the market over 15 years', source: 'SPIVA Scorecard, Dec 2022', color: '#EF4444' },
                { stat: '$85k', desc: 'difference in retirement balance from a 1% fee gap over 40 years on a $60k starting salary', source: 'Lazy Koala Investing calculation, MoneySmart calculator', color: '#EF4444' },
                { stat: '15%', desc: 'reduction in annual retirement income from a 1% fee during the drawdown phase', source: 'Mahaney (2023), Journal of Retirement', color: '#EF4444' },
                { stat: '23%', desc: 'reduction in inheritance amount from a 1% fee in retirement', source: 'Mahaney (2023), Journal of Retirement', color: '#EF4444' },
              ].map(item => (
                <div key={item.stat} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: item.color, flexShrink: 0, minWidth: 60 }}>{item.stat}</div>
                  <div>
                    <div style={{ fontSize: 13, color: '#0F1E3C', lineHeight: 1.6, marginBottom: 4 }}>{item.desc}</div>
                    <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>{item.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={c}>
              <div style={sl}>Active vs indexed — key differences</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                    {['', 'Active', 'Indexed'].map(h => (
                      <th key={h} style={{ textAlign: h === '' ? 'left' : 'center', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { row: 'Goal', active: 'Beat market benchmark', indexed: 'Match market benchmark' },
                    { row: 'Typical fee', active: '0.50–1.20%', indexed: '0.05–0.20%' },
                    { row: 'Private equity / infrastructure', active: '✓ Often included', indexed: '✗ Usually excluded' },
                    { row: 'Long-run performance', active: '16% beat market over 15yr', indexed: 'Matches market by design' },
                    { row: 'Diversification', active: 'Broad (inc. unlisted assets)', indexed: 'Listed assets only' },
                    { row: 'Suitable for', active: 'All time horizons', indexed: 'Long time horizons (10+ yr)' },
                  ].map(r => (
                    <tr key={r.row} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 500, color: '#0F1E3C', fontSize: 12 }}>{r.row}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: 12, color: 'rgba(15,30,60,0.65)' }}>{r.active}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: 12, color: '#065F46', background: 'rgba(0,212,170,0.04)' }}>{r.indexed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={c}>
              <div style={sl}>Indexed options — key differences between funds</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                    {['Fund', 'AU index', 'Intl index', 'ESG'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { fund: 'AustralianSuper', au: 'MSCI AU 300', intl: 'MSCI World ex-AU', esg: 'Partial' },
                    { fund: 'Hostplus', au: 'S&P/ASX 200', intl: 'MSCI World ex-AU', esg: 'Weapons only' },
                    { fund: 'ART', au: 'MSCI AU 300', intl: 'MSCI ACWI ex-AU', esg: 'Tobacco + munitions' },
                    { fund: 'Aware Super', au: 'Custom MSCI AU 300', intl: 'Custom MSCI World', esg: 'Strong screens' },
                    { fund: 'REST', au: 'S&P/ASX 300', intl: 'MSCI World ex-AU', esg: 'Tobacco only', warning: true },
                  ].map(r => (
                    <tr key={r.fund} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: (r as any).warning ? '#FFFBEB' : 'transparent' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 500, color: '#0F1E3C' }}>{r.fund}{(r as any).warning && <span style={{ marginLeft: 4, fontSize: 10, color: '#D97706' }}>⚠</span>}</td>
                      <td style={{ padding: '7px 8px', color: 'rgba(15,30,60,0.65)' }}>{r.au}</td>
                      <td style={{ padding: '7px 8px', color: 'rgba(15,30,60,0.65)' }}>{r.intl}</td>
                      <td style={{ padding: '7px 8px', color: r.esg === 'Strong screens' ? '#065F46' : r.esg === 'Partial' ? '#D97706' : 'rgba(15,30,60,0.5)' }}>{r.esg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 10, fontSize: 11, color: '#78350F', background: '#FFFBEB', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                ⚠ <strong>REST note:</strong> Uses derivative contracts to track indices. Hidden cost of ~0.20–0.35% on international holdings means the effective fee is 0.14–0.24%, not 0%. Introduces counterparty risk if Macquarie Bank defaults.
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>General information only.</strong> Returns are 7-year net returns to 30 June 2025 (SuperRatings). Fees are indicative from fund PDSs at June 2026. Asset allocation ranges from fund PDS documents. SPIVA data as at 31 Dec 2022. Vanguard historical data to June 2023. REST derivative note based on publicly available Macquarie fund PDS and independent analysis. Past performance is not a reliable indicator of future returns. Before switching funds consider exit fees, insurance implications, and seek licensed financial advice.
      </div>
    </div>
  )
}
