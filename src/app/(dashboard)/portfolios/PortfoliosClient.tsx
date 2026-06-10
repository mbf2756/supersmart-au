'use client'
import { useState, useMemo } from 'react'
import { fmt, fmtShort } from '@/lib/calculations'

// ─── ETF DATA ────────────────────────────────────────────────────────────────
// Available on: HP = Hostplus Choiceplus, MD = AustralianSuper Member Direct
// Sources: Hostplus Choiceplus ETF list Jul 2025, AustralianSuper Member Direct menu Mar 2026

type ETF = {
  ticker: string
  name: string
  issuer: string
  category: 'au-equity' | 'intl-equity' | 'property' | 'bonds' | 'mixed' | 'thematic' | 'cash'
  mer: number        // management expense ratio % p.a.
  hp: boolean        // available on Hostplus Choiceplus
  md: boolean        // available on AustralianSuper Member Direct
  smsf: boolean      // suitable for SMSF (all ETFs are)
  hpLimit?: number   // Choiceplus max % of balance (20 or 50)
  mdLimit?: number   // Member Direct max %
  region: string
  index: string
  unhedged: boolean
  esg: boolean
}

const ALL_ETFS: ETF[] = [
  // ── AUSTRALIAN EQUITY ──────────────────────────────────────────────────────
  { ticker: 'VAS',  name: 'Vanguard Australian Shares Index ETF',          issuer: 'Vanguard', category: 'au-equity',   mer: 0.07, hp: true,  md: true,  smsf: true, hpLimit: 50, mdLimit: 80, region: 'Australia',          index: 'S&P/ASX 300',     unhedged: true,  esg: false },
  { ticker: 'STW',  name: 'SPDR S&P/ASX 200 ETF',                          issuer: 'SSGA',     category: 'au-equity',   mer: 0.13, hp: true,  md: true,  smsf: true, hpLimit: 50, mdLimit: 80, region: 'Australia',          index: 'S&P/ASX 200',     unhedged: true,  esg: false },
  { ticker: 'IOZ',  name: 'iShares Core S&P/ASX 200 ETF',                   issuer: 'iShares',  category: 'au-equity',   mer: 0.09, hp: true,  md: true,  smsf: true, hpLimit: 50, mdLimit: 80, region: 'Australia',          index: 'S&P/ASX 200',     unhedged: true,  esg: false },
  { ticker: 'AFI',  name: 'Australian Foundation Investment Co (LIC)',       issuer: 'AFI',      category: 'au-equity',   mer: 0.14, hp: true,  md: true,  smsf: true, hpLimit: 20, mdLimit: 20, region: 'Australia',          index: 'Active',          unhedged: true,  esg: false },
  { ticker: 'MVW',  name: 'VanEck Vectors Australian Equal Weight ETF',      issuer: 'VanEck',   category: 'au-equity',   mer: 0.35, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Australia',          index: 'MVIS AU Equal Wt', unhedged: true, esg: false },
  { ticker: 'SFY',  name: 'SPDR S&P/ASX 50 ETF',                            issuer: 'SSGA',     category: 'au-equity',   mer: 0.29, hp: true,  md: false, smsf: true, hpLimit: 50, mdLimit: 0,  region: 'Australia',          index: 'S&P/ASX 50',      unhedged: true,  esg: false },
  // ── INTERNATIONAL EQUITY ───────────────────────────────────────────────────
  { ticker: 'VGS',  name: 'Vanguard MSCI Index International Shares ETF',   issuer: 'Vanguard', category: 'intl-equity', mer: 0.18, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 80, region: 'Developed markets',   index: 'MSCI World ex-AU',unhedged: true,  esg: false },
  { ticker: 'IVV',  name: 'iShares S&P 500 ETF',                             issuer: 'iShares',  category: 'intl-equity', mer: 0.04, hp: true,  md: true,  smsf: true, hpLimit: 50, mdLimit: 80, region: 'USA',                index: 'S&P 500',         unhedged: true,  esg: false },
  { ticker: 'BGBL', name: 'BetaShares Global Shares ETF',                    issuer: 'BetaShares',category:'intl-equity', mer: 0.08, hp: true,  md: false, smsf: true, hpLimit: 50, mdLimit: 0,  region: 'Developed markets',   index: 'Solactive GBS Dev Mkts LCC', unhedged: true, esg: false },
  { ticker: 'VEU',  name: 'Vanguard All-World ex-US Shares Index ETF',       issuer: 'Vanguard', category: 'intl-equity', mer: 0.08, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 80, region: 'Global ex-US',        index: 'FTSE All-World ex-US', unhedged: true, esg: false },
  { ticker: 'IAA',  name: 'iShares Asia 50 ETF',                             issuer: 'iShares',  category: 'intl-equity', mer: 0.50, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 20, region: 'Asia',               index: 'S&P Asia 50',     unhedged: true,  esg: false },
  { ticker: 'VAE',  name: 'Vanguard FTSE Asia ex-Japan Shares Index ETF',    issuer: 'Vanguard', category: 'intl-equity', mer: 0.40, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Asia ex-Japan',       index: 'FTSE Asia ex-Japan', unhedged: true, esg: false },
  { ticker: 'NDQ',  name: 'BetaShares Nasdaq 100 ETF',                       issuer: 'BetaShares',category:'intl-equity', mer: 0.48, hp: true,  md: true,  smsf: true, hpLimit: 20, mdLimit: 20, region: 'USA tech',           index: 'Nasdaq 100',      unhedged: true,  esg: false },
  // ── DIVERSIFIED (multi-asset) ──────────────────────────────────────────────
  { ticker: 'DHHF', name: 'BetaShares Diversified All Growth ETF',           issuer: 'BetaShares',category:'mixed',       mer: 0.19, hp: false, md: false, smsf: true, hpLimit: 0,  mdLimit: 0,  region: 'Global',             index: '~8,000 stocks global', unhedged: true, esg: false },
  { ticker: 'VDHG', name: 'Vanguard Diversified High Growth Index ETF',       issuer: 'Vanguard', category: 'mixed',      mer: 0.27, hp: false, md: false, smsf: true, hpLimit: 0,  mdLimit: 0,  region: 'Global',             index: 'Multi-index blend',unhedged: true,  esg: false },
  // ── PROPERTY ───────────────────────────────────────────────────────────────
  { ticker: 'VAP',  name: 'Vanguard Australian Property Securities Index ETF',issuer: 'Vanguard', category: 'property',   mer: 0.23, hp: true,  md: true,  smsf: true, hpLimit: 20, mdLimit: 20, region: 'Australia',          index: 'S&P/ASX 200 A-REIT',unhedged: true, esg: false },
  { ticker: 'SLF',  name: 'SPDR S&P/ASX 200 Listed Property ETF',            issuer: 'SSGA',     category: 'property',   mer: 0.40, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Australia',          index: 'S&P/ASX 200 AREIT',unhedged: true, esg: false },
  { ticker: 'GLIN', name: 'iShares Core FTSE Global Infrastructure ETF (H)',  issuer: 'iShares',  category: 'property',   mer: 0.35, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Global',             index: 'FTSE Global Infrastructure (Hdg)', unhedged: false, esg: false },
  // ── BONDS / FIXED INCOME ───────────────────────────────────────────────────
  { ticker: 'VAF',  name: 'Vanguard Australian Fixed Interest Index ETF',     issuer: 'Vanguard', category: 'bonds',      mer: 0.20, hp: true,  md: true,  smsf: true, hpLimit: 20, mdLimit: 20, region: 'Australia',          index: 'Bloomberg AusBond Composite 0+', unhedged: true, esg: false },
  { ticker: 'IGB',  name: 'iShares Core Composite Bond ETF',                  issuer: 'iShares',  category: 'bonds',      mer: 0.15, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 20, region: 'Australia',          index: 'Bloomberg AusBond Composite 0+', unhedged: true, esg: false },
  { ticker: 'VACF', name: 'Vanguard Australian Corporate Fixed Interest ETF', issuer: 'Vanguard', category: 'bonds',      mer: 0.25, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Australia',          index: 'Bloomberg AusBond Credit 0+',unhedged: true,  esg: false },
  // ── ESG ────────────────────────────────────────────────────────────────────
  { ticker: 'ESGI', name: 'VanEck MSCI Intl Sustainable Equity ETF',          issuer: 'VanEck',   category: 'intl-equity', mer: 0.55, hp: true, md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Developed markets',  index: 'MSCI World ex-AU SRI Select', unhedged: true, esg: true },
  { ticker: 'FAIR', name: 'BetaShares Australian Sustainability Leaders ETF', issuer: 'BetaShares',category:'au-equity',   mer: 0.49, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 20, region: 'Australia',          index: 'NASDAQ Aus Sus. Leaders', unhedged: true, esg: true },
  { ticker: 'ETHI', name: 'BetaShares Global Sustainability Leaders ETF',     issuer: 'BetaShares',category:'intl-equity', mer: 0.59, hp: false, md: true,  smsf: true, hpLimit: 0,  mdLimit: 20, region: 'Global',             index: 'NASDAQ Global Sus. Leaders', unhedged: true, esg: true },
  // ── THEMATIC ───────────────────────────────────────────────────────────────
  { ticker: 'TECH', name: 'Global X Morningstar Global Technology ETF',       issuer: 'Global X', category: 'thematic',   mer: 0.45, hp: true,  md: false, smsf: true, hpLimit: 20, mdLimit: 0,  region: 'Global tech',        index: 'Morningstar Developed Markets Technology', unhedged: true, esg: false },
  { ticker: 'CLDD', name: 'BetaShares Cloud Computing ETF',                   issuer: 'BetaShares',category:'thematic',   mer: 0.67, hp: false, md: false, smsf: true, hpLimit: 0,  mdLimit: 0,  region: 'Global',             index: 'BlueStar Global Cloud', unhedged: true, esg: false },
]

// ─── MODEL PORTFOLIOS ────────────────────────────────────────────────────────
type ModelPortfolio = {
  id: string
  name: string
  description: string
  risk: 'conservative' | 'balanced' | 'growth' | 'high-growth'
  platform: 'choiceplus' | 'member-direct' | 'smsf' | 'any'
  growthPct: number
  defensivePct: number
  holdings: { ticker: string; weight: number }[]
  rationale: string
  icon: string
}

const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: 'simple-two',
    name: 'Simple Two-Fund',
    description: 'VAS + VGS. The most popular passive portfolio — Australian and global shares with minimal complexity.',
    risk: 'high-growth',
    platform: 'smsf',
    growthPct: 100,
    defensivePct: 0,
    holdings: [
      { ticker: 'VAS', weight: 30 },
      { ticker: 'VGS', weight: 70 },
    ],
    rationale: 'VAS provides Australian shares (franking credits, home market exposure). VGS covers 1,500+ global developed market companies. 70/30 international bias reflects that AU is only ~2% of world market cap. Both available in SMSF — Vanguard charges only 0.07% and 0.18% respectively.',
    icon: '⚡',
  },
  {
    id: 'choiceplus-core',
    name: 'Hostplus Choiceplus Core',
    description: 'Diversified passive portfolio using ETFs available on Choiceplus. Complements Hostplus Indexed Balanced.',
    risk: 'growth',
    platform: 'choiceplus',
    growthPct: 85,
    defensivePct: 15,
    holdings: [
      { ticker: 'VAS',  weight: 30 },
      { ticker: 'IVV',  weight: 35 },
      { ticker: 'BGBL', weight: 20 },
      { ticker: 'VAF',  weight: 15 },
    ],
    rationale: 'All ETFs are on the Hostplus Choiceplus menu. VAS covers ASX 300, IVV gives S&P 500 exposure at just 0.04% MER, BGBL fills out the rest of developed markets. VAF adds a bond allocation for stability. Weighted MER: ~0.15% p.a. — far cheaper than active fund options.',
    icon: '🏗',
  },
  {
    id: 'member-direct-core',
    name: 'AustralianSuper Member Direct Core',
    description: 'Broad passive portfolio using ETFs available in the Member Direct option.',
    risk: 'growth',
    platform: 'member-direct',
    growthPct: 85,
    defensivePct: 15,
    holdings: [
      { ticker: 'VAS',  weight: 30 },
      { ticker: 'IVV',  weight: 40 },
      { ticker: 'VEU',  weight: 15 },
      { ticker: 'IGB',  weight: 15 },
    ],
    rationale: 'All available on AustralianSuper Member Direct. VAS + IVV + VEU together give ~global market cap coverage. IGB provides Australian bond exposure as a defensive buffer. Weighted MER: ~0.12% p.a.',
    icon: '🏛',
  },
  {
    id: 'high-growth-passive',
    name: 'High Growth Passive',
    description: '100% equities across Australian and global markets. Suitable for 20+ year horizon.',
    risk: 'high-growth',
    platform: 'smsf',
    growthPct: 100,
    defensivePct: 0,
    holdings: [
      { ticker: 'VAS',  weight: 25 },
      { ticker: 'IVV',  weight: 40 },
      { ticker: 'VGS',  weight: 20 },
      { ticker: 'NDQ',  weight: 10 },
      { ticker: 'VAE',  weight: 5  },
    ],
    rationale: 'Maximum growth allocation across diversified global markets. NDQ adds US tech tilt (controversial but widely used). VAE gives emerging Asia exposure. Only suitable for SMSF or investors with 20+ year horizon who can tolerate 30-45% drawdowns. Weighted MER: ~0.19% p.a.',
    icon: '🚀',
  },
  {
    id: 'balanced-passive',
    name: 'Balanced Passive',
    description: '70% growth / 30% defensive. Appropriate benchmark-beating alternative to active balanced funds.',
    risk: 'balanced',
    platform: 'smsf',
    growthPct: 70,
    defensivePct: 30,
    holdings: [
      { ticker: 'VAS',  weight: 25 },
      { ticker: 'IVV',  weight: 30 },
      { ticker: 'VGS',  weight: 15 },
      { ticker: 'VAF',  weight: 20 },
      { ticker: 'VAP',  weight: 10 },
    ],
    rationale: 'Comparable risk profile to a Balanced MySuper option but at ~0.15% MER vs 0.50-0.80% for active funds. VAP adds listed property for inflation protection. VAF provides duration and stability. Research shows this low-cost passive balanced portfolio outperforms 84% of active equivalents over 15 years.',
    icon: '⚖️',
  },
  {
    id: 'esg-growth',
    name: 'ESG Growth',
    description: 'Socially screened global equities with strong exclusions. Tobacco, coal, weapons, gambling excluded.',
    risk: 'high-growth',
    platform: 'smsf',
    growthPct: 100,
    defensivePct: 0,
    holdings: [
      { ticker: 'FAIR', weight: 30 },
      { ticker: 'ETHI', weight: 50 },
      { ticker: 'ESGI', weight: 20 },
    ],
    rationale: 'FAIR excludes AU companies that fail sustainability criteria. ETHI screens globally for sustainability leaders. ESGI tracks MSCI World ex-AU SRI Select. Higher MER (~0.54%) than plain index ETFs — the cost of ethical screening. Compare to active SRI super options at 0.60-0.80%. Still cheaper with better transparency.',
    icon: '🌱',
  },
  {
    id: 'property-tilt',
    name: 'Property Income Tilt',
    description: 'Growth portfolio with enhanced property and infrastructure allocation. Suits members seeking income.',
    risk: 'growth',
    platform: 'smsf',
    growthPct: 80,
    defensivePct: 20,
    holdings: [
      { ticker: 'VAS',  weight: 25 },
      { ticker: 'IVV',  weight: 30 },
      { ticker: 'VAP',  weight: 20 },
      { ticker: 'GLIN', weight: 15 },
      { ticker: 'VAF',  weight: 10 },
    ],
    rationale: 'Overweights Australian REITs (VAP) and global infrastructure (GLIN) vs a standard index portfolio. REITs provide franked distribution income. Infrastructure is lower volatility than pure equities. Suits members transitioning to pension phase who want regular income. Weighted MER: ~0.21% p.a.',
    icon: '🏢',
  },
  {
    id: 'choiceplus-esg',
    name: 'Choiceplus Growth ESG',
    description: 'ETF portfolio on Hostplus Choiceplus using available ETFs with ethical tilts.',
    risk: 'growth',
    platform: 'choiceplus',
    growthPct: 90,
    defensivePct: 10,
    holdings: [
      { ticker: 'VAS',  weight: 30 },
      { ticker: 'IVV',  weight: 30 },
      { ticker: 'BGBL', weight: 20 },
      { ticker: 'ESGI', weight: 10 },
      { ticker: 'VAF',  weight: 10 },
    ],
    rationale: 'Uses ETFs available on Hostplus Choiceplus. ESGI (VanEck) is the key ESG tilt, screening for sustainability leaders in international markets. VAS + IVV + BGBL cover broad global markets. Note: FAIR and ETHI are not on the Choiceplus menu — ESGI is the best available ethical option there.',
    icon: '🌿',
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getETF(ticker: string): ETF | undefined {
  return ALL_ETFS.find(e => e.ticker === ticker)
}

function calcPortfolioMER(holdings: { ticker: string; weight: number }[]): number {
  return holdings.reduce((acc, h) => {
    const etf = getETF(h.ticker)
    return acc + (etf ? etf.mer * h.weight / 100 : 0)
  }, 0)
}

function calcPlatformFee(platform: string, balance: number): { annual: number; label: string } {
  if (platform === 'choiceplus') {
    return { annual: 168 + balance * 0.000, label: '$168/yr flat (Hostplus Choiceplus admin)' }
  }
  if (platform === 'member-direct') {
    const tier = balance < 50000 ? 30 : balance < 250000 ? 90 : 180
    return { annual: tier, label: `$${tier}/yr (AustralianSuper Member Direct admin)` }
  }
  if (platform === 'smsf') {
    return { annual: 1500 + balance * 0.001, label: 'Est. $1,500–3,000/yr SMSF running costs (accountant + ASIC + audit)' }
  }
  return { annual: 0, label: '' }
}

function detectOverlap(holdings: { ticker: string; weight: number }[]): string[] {
  const overlaps: string[] = []
  const tickers = holdings.map(h => h.ticker)
  // Known overlaps
  if (tickers.includes('VAS') && tickers.includes('STW')) overlaps.push('VAS and STW both track ASX 200/300 — significant overlap, consider using just one')
  if (tickers.includes('VAS') && tickers.includes('IOZ')) overlaps.push('VAS and IOZ both track ASX 200/300 — choose one')
  if (tickers.includes('IVV') && tickers.includes('NDQ')) overlaps.push('IVV (S&P 500) and NDQ (Nasdaq 100) overlap significantly — Nasdaq 100 is mostly a subset of S&P 500 tech names')
  if (tickers.includes('VGS') && tickers.includes('IVV')) overlaps.push('VGS (~68% US) and IVV (100% US) have significant US overlap — consider replacing IVV with VEU for true diversification')
  if (tickers.includes('DHHF') && (tickers.includes('VAS') || tickers.includes('IVV') || tickers.includes('VGS'))) overlaps.push('DHHF already contains VAS/VGS/IVV internally — adding them separately creates unintended concentration')
  if (tickers.includes('VDHG') && (tickers.includes('VAS') || tickers.includes('VGS'))) overlaps.push('VDHG is itself a fund-of-funds containing VAS and VGS — adding them separately doubles up')
  return overlaps
}

function riskLabel(risk: string): { label: string; color: string } {
  return {
    conservative: { label: 'Conservative', color: '#059669' },
    balanced:      { label: 'Balanced',     color: '#00D4AA' },
    growth:        { label: 'Growth',        color: '#D97706' },
    'high-growth': { label: 'High Growth',  color: '#EF4444' },
  }[risk] ?? { label: risk, color: '#0F1E3C' }
}

function platformLabel(p: string): string {
  return {
    choiceplus:      'Hostplus Choiceplus',
    'member-direct': 'AustralianSuper Member Direct',
    smsf:            'SMSF (any broker)',
    any:             'Any platform',
  }[p] ?? p
}

const CAT_COLORS: Record<string, string> = {
  'au-equity':   '#00D4AA',
  'intl-equity': '#534AB7',
  'property':    '#F59E0B',
  'bonds':       '#6B7280',
  'mixed':       '#10B981',
  'thematic':    '#EF4444',
  'cash':        '#9CA3AF',
}
const CAT_LABELS: Record<string, string> = {
  'au-equity':   'Australian Equity',
  'intl-equity': 'International Equity',
  'property':    'Property / Infrastructure',
  'bonds':       'Fixed Income / Bonds',
  'mixed':       'Diversified (multi-asset)',
  'thematic':    'Thematic',
  'cash':        'Cash',
}

// ─── ALLOCATION PIE (SVG) ────────────────────────────────────────────────────
function AllocationPie({ holdings }: { holdings: { ticker: string; weight: number }[] }) {
  const cx = 60, cy = 60, r = 50
  let angle = -90
  const slices = holdings.map(h => {
    const etf = getETF(h.ticker)
    const color = etf ? CAT_COLORS[etf.category] : '#ccc'
    const startAngle = angle
    const sweep = h.weight / 100 * 360
    angle += sweep
    return { ...h, color, startAngle, sweep }
  })

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(cx: number, cy: number, r: number, startAngle: number, sweep: number) {
    if (sweep >= 360) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
    const start = polarToCartesian(cx, cy, r, startAngle)
    const end = polarToCartesian(cx, cy, r, startAngle + sweep)
    const large = sweep > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
  }

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {slices.map(s => (
        <path key={s.ticker} d={arcPath(cx, cy, r, s.startAngle, s.sweep)} fill={s.color} opacity={0.85} />
      ))}
      <circle cx={cx} cy={cy} r={22} fill="white" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="#0F1E3C" fontWeight="600">
        {calcPortfolioMER(holdings).toFixed(2)}%
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize="8" fill="rgba(15,30,60,0.4)">MER</text>
    </svg>
  )
}

// ─── CUSTOM BUILDER ──────────────────────────────────────────────────────────
function CustomBuilder({ balance, platform }: { balance: number; platform: string }) {
  const [search, setSearch] = useState('')
  const [holdings, setHoldings] = useState<{ ticker: string; weight: number }[]>([])

  const filtered = ALL_ETFS.filter(e => {
    const matchPlatform = platform === 'smsf' ? e.smsf :
      platform === 'choiceplus' ? e.hp :
      platform === 'member-direct' ? e.md : true
    const matchSearch = !search || e.ticker.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
    return matchPlatform && matchSearch && !holdings.find(h => h.ticker === e.ticker)
  })

  const totalWeight = holdings.reduce((a, h) => a + h.weight, 0)
  const mer = calcPortfolioMER(holdings)
  const annualCost = balance * mer / 100
  const overlaps = detectOverlap(holdings)

  function addETF(ticker: string) {
    setHoldings(prev => [...prev, { ticker, weight: Math.max(0, Math.min(100, 100 - totalWeight)) }])
    setSearch('')
  }

  function updateWeight(ticker: string, w: number) {
    setHoldings(prev => prev.map(h => h.ticker === ticker ? { ...h, weight: Math.min(100, Math.max(0, w)) } : h))
  }

  function removeETF(ticker: string) {
    setHoldings(prev => prev.filter(h => h.ticker !== ticker))
  }

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }

  return (
    <div style={c}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>
        Custom portfolio builder — {platformLabel(platform)}
      </div>

      {/* Search and add */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ETFs available on ${platformLabel(platform)}...`}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
        {search && filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
            {filtered.slice(0, 10).map(etf => (
              <div key={etf.ticker} onClick={() => addETF(etf.ticker)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(15,30,60,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginRight: 8 }}>{etf.ticker}</span>
                  <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)' }}>{etf.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', flexShrink: 0 }}>{etf.mer}% MER</span>
              </div>
            ))}
          </div>
        )}
        {search && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setSearch('')} />}
      </div>

      {/* Holdings list */}
      {holdings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>
          Search above to add ETFs to your custom portfolio
        </div>
      ) : (
        <>
          {holdings.map(h => {
            const etf = getETF(h.ticker)!
            return (
              <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[etf.category], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{h.ticker}</div>
                  <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{etf.mer}% MER · {CAT_LABELS[etf.category]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min="0" max="100" value={h.weight}
                    onChange={e => updateWeight(h.ticker, +e.target.value)}
                    style={{ width: 60, padding: '5px 8px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, textAlign: 'right', outline: 'none' }} />
                  <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>%</span>
                  <button onClick={() => removeETF(h.ticker)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,30,60,0.3)', fontSize: 16, padding: '0 4px' }}>✕</button>
                </div>
              </div>
            )
          })}

          {/* Totals */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: totalWeight === 100 ? 'rgba(0,212,170,0.08)' : '#FEF2F2', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: totalWeight === 100 ? '#065F46' : '#991B1B' }}>{totalWeight}%</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>Total allocation {totalWeight !== 100 ? `(${totalWeight > 100 ? 'over' : 'under'} by ${Math.abs(100 - totalWeight)}%)` : '✓'}</div>
            </div>
            <div style={{ background: 'rgba(15,30,60,0.04)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: mer < 0.2 ? '#00D4AA' : mer < 0.4 ? '#D97706' : '#EF4444' }}>{mer.toFixed(3)}%</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>Weighted MER p.a.</div>
            </div>
            <div style={{ background: 'rgba(15,30,60,0.04)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: '#0F1E3C' }}>{fmt(annualCost)}/yr</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>Invest fees on {fmtShort(balance)}</div>
            </div>
          </div>

          {/* Overlap warnings */}
          {overlaps.length > 0 && (
            <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>⚠ Overlap detected</div>
              {overlaps.map((o, i) => <div key={i} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>· {o}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function PortfoliosClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const [activeTab, setActiveTab] = useState<'models' | 'builder' | 'compare'>('models')
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [builderPlatform, setBuilderPlatform] = useState('smsf')

  const balance = sp?.current_balance ?? 0
  const fundName = sp?.fund_name ?? ''
  const userPlatform = fundName.toLowerCase().includes('hostplus') ? 'choiceplus' :
    fundName.toLowerCase().includes('australiansuper') ? 'member-direct' : 'smsf'

  const filteredPortfolios = MODEL_PORTFOLIOS.filter(p => {
    if (filterPlatform !== 'all' && p.platform !== filterPlatform && filterPlatform !== 'smsf') return false
    if (filterRisk !== 'all' && p.risk !== filterRisk) return false
    return true
  })

  const selected = selectedPortfolio ? MODEL_PORTFOLIOS.find(p => p.id === selectedPortfolio) : null

  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }
  const tabBtn = (t: typeof activeTab): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: activeTab === t ? '#0F1E3C' : 'white',
    color: activeTab === t ? 'white' : 'rgba(15,30,60,0.6)',
    boxShadow: activeTab === t ? 'none' : '0 0 0 1px rgba(15,30,60,0.12)',
  })

  return (
    <div style={{ maxWidth: 1060 }}>

      {/* Contextual platform banner */}
      {userPlatform !== 'smsf' && (
        <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
            You're with <strong>{fundName}</strong>. Portfolios marked <strong>{userPlatform === 'choiceplus' ? 'Hostplus Choiceplus' : 'AustralianSuper Member Direct'}</strong> use ETFs that are already available within your fund — no SMSF required.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabBtn('models')} onClick={() => setActiveTab('models')}>Model portfolios</button>
        <button style={tabBtn('builder')} onClick={() => setActiveTab('builder')}>Custom builder</button>
        <button style={tabBtn('compare')} onClick={() => setActiveTab('compare')}>Platform comparison</button>
      </div>

      {/* ═══ TAB 1 — MODEL PORTFOLIOS ══════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'choiceplus', 'member-direct', 'smsf'].map(p => (
                <button key={p} onClick={() => setFilterPlatform(p)}
                  style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: 'none', background: filterPlatform === p ? '#0F1E3C' : 'rgba(15,30,60,0.06)', color: filterPlatform === p ? 'white' : 'rgba(15,30,60,0.6)', fontWeight: filterPlatform === p ? 600 : 400 }}>
                  {p === 'all' ? 'All platforms' : platformLabel(p)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'conservative', 'balanced', 'growth', 'high-growth'].map(r => (
                <button key={r} onClick={() => setFilterRisk(r)}
                  style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: 'none', background: filterRisk === r ? '#0F1E3C' : 'rgba(15,30,60,0.06)', color: filterRisk === r ? 'white' : 'rgba(15,30,60,0.6)', fontWeight: filterRisk === r ? 600 : 400 }}>
                  {r === 'all' ? 'All risk levels' : riskLabel(r).label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Portfolio cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredPortfolios.map(p => {
                const mer = calcPortfolioMER(p.holdings)
                const rl = riskLabel(p.risk)
                const isSelected = selectedPortfolio === p.id
                const platformFee = calcPlatformFee(p.platform, balance)
                const totalAnnualCost = balance * mer / 100 + platformFee.annual

                return (
                  <div key={p.id}
                    onClick={() => setSelectedPortfolio(isSelected ? null : p.id)}
                    style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: isSelected ? '2px solid #00D4AA' : '1px solid rgba(15,30,60,0.1)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,170,0.4)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,30,60,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>{p.name}</div>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 12, background: `${rl.color}18`, color: rl.color, fontWeight: 600 }}>{rl.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>
                            MER: <strong style={{ color: mer < 0.2 ? '#00D4AA' : mer < 0.4 ? '#D97706' : '#EF4444' }}>{mer.toFixed(3)}%</strong>
                          </span>
                          {balance > 0 && (
                            <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>
                              Cost on {fmtShort(balance)}: <strong style={{ color: '#0F1E3C' }}>{fmt(totalAnnualCost)}/yr</strong>
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>
                            Platform: <strong>{platformLabel(p.platform)}</strong>
                          </span>
                        </div>
                      </div>
                      <AllocationPie holdings={p.holdings} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Detail panel */}
            {selected ? (
              <div style={{ position: 'sticky', top: 20, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={c}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>{selected.icon} {selected.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', lineHeight: 1.6, marginBottom: 16 }}>{selected.rationale}</div>

                  {/* Holdings breakdown */}
                  <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.4)', marginBottom: 10 }}>Holdings</div>
                  {selected.holdings.map(h => {
                    const etf = getETF(h.ticker)!
                    return (
                      <div key={h.ticker} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[etf.category], flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{h.ticker}</span>
                            <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{etf.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 1 }}>
                            {etf.mer}% MER · {CAT_LABELS[etf.category]}
                            {etf.esg && ' · ✓ ESG screened'}
                            {!etf.unhedged && ' · AUD hedged'}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#0F1E3C', minWidth: 36, textAlign: 'right' }}>{h.weight}%</div>
                      </div>
                    )
                  })}

                  {/* Cost summary */}
                  {balance > 0 && (
                    <div style={{ marginTop: 16, background: '#0F1E3C', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Annual cost on {fmt(balance)}</div>
                      {[
                        { label: 'Investment fees (weighted MER)', value: fmt(balance * calcPortfolioMER(selected.holdings) / 100) + '/yr' },
                        { label: calcPlatformFee(selected.platform, balance).label, value: fmt(calcPlatformFee(selected.platform, balance).annual) + '/yr' },
                        { label: 'Total annual cost', value: fmt(balance * calcPortfolioMER(selected.holdings) / 100 + calcPlatformFee(selected.platform, balance).annual) + '/yr', highlight: true },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: r.highlight ? 700 : 400, color: r.highlight ? '#00D4AA' : 'white' }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Overlap check */}
                  {detectOverlap(selected.holdings).length === 0 && (
                    <div style={{ marginTop: 12, fontSize: 11, color: '#065F46', background: 'rgba(0,212,170,0.08)', borderRadius: 8, padding: '8px 12px' }}>
                      ✓ No significant ETF overlap detected in this portfolio
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ ...c, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'rgba(15,30,60,0.3)', fontSize: 13, textAlign: 'center' }}>
                Click a portfolio to see full breakdown, holdings, and cost analysis
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB 2 — CUSTOM BUILDER ════════════════════════════════════════════ */}
      {activeTab === 'builder' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', padding: '8px 4px' }}>Build for:</span>
            {['smsf', 'choiceplus', 'member-direct'].map(p => (
              <button key={p} onClick={() => setBuilderPlatform(p)}
                style={{ padding: '7px 16px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: 'none', background: builderPlatform === p ? '#0F1E3C' : 'rgba(15,30,60,0.06)', color: builderPlatform === p ? 'white' : 'rgba(15,30,60,0.6)', fontWeight: builderPlatform === p ? 600 : 400 }}>
                {platformLabel(p)}
              </button>
            ))}
          </div>
          <CustomBuilder balance={balance} platform={builderPlatform} />
        </>
      )}

      {/* ═══ TAB 3 — PLATFORM COMPARISON ══════════════════════════════════════ */}
      {activeTab === 'compare' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            {
              id: 'choiceplus',
              name: 'Hostplus Choiceplus',
              icon: '🏗',
              platformFee: '$168/yr flat',
              brokerage: '$11 per trade',
              maxAlloc: '80% of balance',
              etfCount: '40+ ETFs and LICs',
              minBalance: 'No minimum',
              pros: ['Very low flat admin fee', 'No balance minimum', 'Combines with Indexed Balanced (0.04%)', 'APRA regulated, no trustee duties'],
              cons: ['Limited ETF menu vs SMSF', 'Some ETFs capped at 20% of balance', 'No US-listed ETFs', 'Must keep 20% in standard options'],
              suitable: 'Members who want ETF access without SMSF complexity. Best for balances under $500k.',
              link: 'https://hostplus.com.au/members/our-products-and-services/investment-options/your-investment-options/choiceplus',
            },
            {
              id: 'member-direct',
              name: 'AustralianSuper Member Direct',
              icon: '🏛',
              platformFee: '$30–$180/yr (balance-tiered)',
              brokerage: '$13 per trade',
              maxAlloc: '80% of balance',
              etfCount: '80+ shares, ETFs, LICs',
              minBalance: 'No minimum',
              pros: ['Access to ASX 300 shares + ETFs', 'Real-time trading platform', 'Independent research included', 'Fee reduced to $30/yr in Feb 2026'],
              cons: ['More expensive brokerage ($13 vs $11)', 'Must maintain 20% in PreMixed/DIY options', 'Cash account required (earns low interest)', 'Less ETF variety than SMSF'],
              suitable: 'AustralianSuper members wanting individual stock picking + ETFs. Good for active investors.',
              link: 'https://www.australiansuper.com/investments/your-investment-options/member-direct',
            },
            {
              id: 'smsf',
              name: 'Self-Managed Super Fund',
              icon: '🔑',
              platformFee: '$1,500–$3,000+/yr (accountant + audit + ASIC)',
              brokerage: '$2–$10 per trade (broker-dependent)',
              maxAlloc: '100% — full control',
              etfCount: 'Any ASX-listed ETF, shares, bonds, property',
              minBalance: 'Recommended $250k+ to justify costs',
              pros: ['Complete investment control', 'Can hold direct property, international ETFs', 'Better borrowing options', 'Estate planning flexibility'],
              cons: ['ATO/ASIC compliance obligations', 'Annual audit required (~$500–$1,000)', 'Personal liability as trustee', 'Not cost-effective below ~$250k'],
              suitable: 'Sophisticated investors with $250k+ who want full control, direct property, or complex strategies.',
              link: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/self-managed-super-funds-smsf',
            },
          ].map(plat => (
            <div key={plat.id} style={{ background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{plat.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>{plat.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Platform fee', val: plat.platformFee },
                  { label: 'Brokerage', val: plat.brokerage },
                  { label: 'Max ETF allocation', val: plat.maxAlloc },
                  { label: 'ETF menu', val: plat.etfCount },
                  { label: 'Min. balance', val: plat.minBalance },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,30,60,0.05)', fontSize: 12 }}>
                    <span style={{ color: 'rgba(15,30,60,0.5)' }}>{r.label}</span>
                    <span style={{ color: '#0F1E3C', fontWeight: 500 }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✓ Advantages</div>
              {plat.pros.map(p => <div key={p} style={{ fontSize: 11, color: '#065F46', lineHeight: 1.5, marginBottom: 2 }}>· {p}</div>)}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', marginBottom: 6, marginTop: 10 }}>✗ Limitations</div>
              {plat.cons.map(p => <div key={p} style={{ fontSize: 11, color: '#991B1B', lineHeight: 1.5, marginBottom: 2 }}>· {p}</div>)}
              <div style={{ marginTop: 12, background: 'rgba(15,30,60,0.04)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'rgba(15,30,60,0.7)', lineHeight: 1.5 }}>
                <strong>Best for:</strong> {plat.suitable}
              </div>
              <a href={plat.link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: '#534AB7', textDecoration: 'none', fontWeight: 500 }}>
                Official info →
              </a>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>General information only.</strong> ETF data sourced from issuer PDSs and fund investment menus as at June 2026. MERs change — always verify on the issuer's website. Model portfolios are illustrative examples, not personalised investment advice. Platform fees and brokerage are indicative; check the relevant PDS before switching. SMSF cost estimates are indicative only. Past ETF performance is not indicative of future returns. Before making decisions about your super investment strategy, consider seeking advice from a licensed financial adviser.
      </div>
    </div>
  )
}
