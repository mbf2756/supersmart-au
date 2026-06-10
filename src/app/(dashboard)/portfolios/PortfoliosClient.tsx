'use client'
import { useState, useMemo } from 'react'
import { fmt, fmtShort } from '@/lib/calculations'

// ─── ETF DATA ────────────────────────────────────────────────────────────────
type ETF = {
  ticker: string; name: string; issuer: string
  category: 'au-equity' | 'intl-equity' | 'property' | 'bonds' | 'mixed' | 'thematic'
  mer: number; hp: boolean; md: boolean; smsf: boolean
  hpLimit: number; mdLimit: number
  region: string; index: string; unhedged: boolean; esg: boolean
  ret3?: number; ret5?: number  // % p.a. net returns to Jun 2025
}

const ALL_ETFS: ETF[] = [
  { ticker:'VAS',  name:'Vanguard Australian Shares Index ETF',          issuer:'Vanguard',   category:'au-equity',   mer:0.07, hp:true,  md:true,  smsf:true, hpLimit:50, mdLimit:80, region:'Australia',       index:'S&P/ASX 300',              unhedged:true,  esg:false, ret3:10.1, ret5:9.4 },
  { ticker:'STW',  name:'SPDR S&P/ASX 200 ETF',                          issuer:'SSGA',       category:'au-equity',   mer:0.13, hp:true,  md:true,  smsf:true, hpLimit:50, mdLimit:80, region:'Australia',       index:'S&P/ASX 200',              unhedged:true,  esg:false, ret3:10.0, ret5:9.3 },
  { ticker:'IOZ',  name:'iShares Core S&P/ASX 200 ETF',                  issuer:'iShares',    category:'au-equity',   mer:0.09, hp:true,  md:true,  smsf:true, hpLimit:50, mdLimit:80, region:'Australia',       index:'S&P/ASX 200',              unhedged:true,  esg:false, ret3:10.0, ret5:9.3 },
  { ticker:'MVW',  name:'VanEck Australian Equal Weight ETF',             issuer:'VanEck',     category:'au-equity',   mer:0.35, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Australia',       index:'MVIS Aus Equal Wt',        unhedged:true,  esg:false, ret3:9.2,  ret5:8.8 },
  { ticker:'SFY',  name:'SPDR S&P/ASX 50 ETF',                           issuer:'SSGA',       category:'au-equity',   mer:0.29, hp:true,  md:false, smsf:true, hpLimit:50, mdLimit:0,  region:'Australia',       index:'S&P/ASX 50',               unhedged:true,  esg:false, ret3:9.8,  ret5:9.1 },
  { ticker:'VGS',  name:'Vanguard MSCI Intl Shares ETF',                  issuer:'Vanguard',   category:'intl-equity', mer:0.18, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:80, region:'Developed mkts',  index:'MSCI World ex-AU',         unhedged:true,  esg:false, ret3:17.2, ret5:15.8 },
  { ticker:'IVV',  name:'iShares S&P 500 ETF',                            issuer:'iShares',    category:'intl-equity', mer:0.04, hp:true,  md:true,  smsf:true, hpLimit:50, mdLimit:80, region:'USA',             index:'S&P 500',                  unhedged:true,  esg:false, ret3:19.1, ret5:17.4 },
  { ticker:'BGBL', name:'BetaShares Global Shares ETF',                   issuer:'BetaShares', category:'intl-equity', mer:0.08, hp:true,  md:false, smsf:true, hpLimit:50, mdLimit:0,  region:'Developed mkts',  index:'Solactive GBS Dev Mkts',   unhedged:true,  esg:false, ret3:17.0, ret5:15.5 },
  { ticker:'VEU',  name:'Vanguard All-World ex-US Shares ETF',            issuer:'Vanguard',   category:'intl-equity', mer:0.08, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:80, region:'Global ex-US',    index:'FTSE All-World ex-US',     unhedged:true,  esg:false, ret3:11.4, ret5:9.8  },
  { ticker:'NDQ',  name:'BetaShares Nasdaq 100 ETF',                      issuer:'BetaShares', category:'intl-equity', mer:0.48, hp:true,  md:true,  smsf:true, hpLimit:20, mdLimit:20, region:'USA tech',        index:'Nasdaq 100',               unhedged:true,  esg:false, ret3:22.4, ret5:21.1 },
  { ticker:'VAE',  name:'Vanguard FTSE Asia ex-Japan ETF',                issuer:'Vanguard',   category:'intl-equity', mer:0.40, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Asia ex-Japan',   index:'FTSE Asia ex-Japan',       unhedged:true,  esg:false, ret3:8.1,  ret5:6.9  },
  { ticker:'IAA',  name:'iShares Asia 50 ETF',                            issuer:'iShares',    category:'intl-equity', mer:0.50, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:20, region:'Asia',            index:'S&P Asia 50',              unhedged:true,  esg:false, ret3:7.8,  ret5:6.5  },
  { ticker:'DHHF', name:'BetaShares Diversified All Growth ETF',          issuer:'BetaShares', category:'mixed',       mer:0.19, hp:false, md:false, smsf:true, hpLimit:0,  mdLimit:0,  region:'Global',          index:'~8,000 stocks global',     unhedged:true,  esg:false, ret3:15.2, ret5:13.9 },
  { ticker:'VDHG', name:'Vanguard Diversified High Growth ETF',           issuer:'Vanguard',   category:'mixed',       mer:0.27, hp:false, md:false, smsf:true, hpLimit:0,  mdLimit:0,  region:'Global',          index:'Multi-index blend',        unhedged:true,  esg:false, ret3:13.8, ret5:12.4 },
  { ticker:'VAP',  name:'Vanguard Australian Property ETF',               issuer:'Vanguard',   category:'property',    mer:0.23, hp:true,  md:true,  smsf:true, hpLimit:20, mdLimit:20, region:'Australia',       index:'S&P/ASX 200 A-REIT',       unhedged:true,  esg:false, ret3:8.4,  ret5:6.2  },
  { ticker:'SLF',  name:'SPDR S&P/ASX 200 Listed Property ETF',           issuer:'SSGA',       category:'property',    mer:0.40, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Australia',       index:'S&P/ASX 200 AREIT',        unhedged:true,  esg:false, ret3:8.2,  ret5:6.0  },
  { ticker:'GLIN', name:'iShares Global Infrastructure ETF (Hedged)',     issuer:'iShares',    category:'property',    mer:0.35, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Global',          index:'FTSE Global Infra (Hdgd)', unhedged:false, esg:false, ret3:7.9,  ret5:7.1  },
  { ticker:'VAF',  name:'Vanguard Australian Fixed Interest ETF',         issuer:'Vanguard',   category:'bonds',       mer:0.20, hp:true,  md:true,  smsf:true, hpLimit:20, mdLimit:20, region:'Australia',       index:'Bloomberg AusBond Comp.',  unhedged:true,  esg:false, ret3:1.8,  ret5:0.9  },
  { ticker:'IGB',  name:'iShares Core Composite Bond ETF',                issuer:'iShares',    category:'bonds',       mer:0.15, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:20, region:'Australia',       index:'Bloomberg AusBond Comp.',  unhedged:true,  esg:false, ret3:1.8,  ret5:0.9  },
  { ticker:'VACF', name:'Vanguard Australian Corporate Bond ETF',         issuer:'Vanguard',   category:'bonds',       mer:0.25, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Australia',       index:'Bloomberg AusBond Credit', unhedged:true,  esg:false, ret3:2.4,  ret5:1.5  },
  { ticker:'ESGI', name:'VanEck MSCI Intl Sustainable Equity ETF',        issuer:'VanEck',     category:'intl-equity', mer:0.55, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Developed mkts',  index:'MSCI World ex-AU SRI Sel', unhedged:true,  esg:true,  ret3:15.1, ret5:13.8 },
  { ticker:'FAIR', name:'BetaShares Australian Sustainability Leaders ETF',issuer:'BetaShares',category:'au-equity',   mer:0.49, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:20, region:'Australia',       index:'NASDAQ Aus Sus. Leaders',  unhedged:true,  esg:true,  ret3:9.6,  ret5:8.9  },
  { ticker:'ETHI', name:'BetaShares Global Sustainability Leaders ETF',   issuer:'BetaShares', category:'intl-equity', mer:0.59, hp:false, md:true,  smsf:true, hpLimit:0,  mdLimit:20, region:'Global',          index:'NASDAQ Global Sus. Lead.',  unhedged:true,  esg:true,  ret3:16.8, ret5:15.2 },
  { ticker:'TECH', name:'Global X Morningstar Global Technology ETF',     issuer:'Global X',   category:'thematic',    mer:0.45, hp:true,  md:false, smsf:true, hpLimit:20, mdLimit:0,  region:'Global tech',     index:'Morningstar Dev Mkts Tech', unhedged:true,  esg:false, ret3:21.0, ret5:19.2 },
  { ticker:'CLDD', name:'BetaShares Cloud Computing ETF',                 issuer:'BetaShares', category:'thematic',    mer:0.67, hp:false, md:false, smsf:true, hpLimit:0,  mdLimit:0,  region:'Global',          index:'BlueStar Global Cloud',    unhedged:true,  esg:false, ret3:18.2, ret5:16.4 },
]

// ─── MODEL PORTFOLIOS ────────────────────────────────────────────────────────
type ModelPortfolio = {
  id: string; name: string; description: string
  risk: 'conservative' | 'balanced' | 'growth' | 'high-growth'
  platform: 'choiceplus' | 'member-direct' | 'smsf'
  growthPct: number; defensivePct: number
  holdings: { ticker: string; weight: number }[]
  rationale: string; icon: string
}

const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  // ── CHOICEPLUS ─────────────────────────────────────────────────────────────
  {
    id: 'hp-conservative', name: 'Choiceplus Conservative', icon: '🛡',
    description: 'Low-risk blend of Australian shares and bonds, within Hostplus Choiceplus limits.',
    risk: 'conservative', platform: 'choiceplus', growthPct: 40, defensivePct: 60,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 15 }, { ticker: 'VAF', weight: 35 }, { ticker: 'VACF', weight: 25 }],
    rationale: 'A conservative allocation using only Choiceplus-available ETFs. VAS + IVV provide 40% growth exposure at very low cost. VAF and VACF give 60% defensive allocation for capital stability. Weighted MER ~0.13% — far cheaper than active conservative options (~0.50%+).',
  },
  {
    id: 'hp-balanced', name: 'Choiceplus Balanced', icon: '⚖️',
    description: 'Balanced 60/40 portfolio across Australian equities, global equities, and bonds.',
    risk: 'balanced', platform: 'choiceplus', growthPct: 60, defensivePct: 40,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 25 }, { ticker: 'BGBL', weight: 10 }, { ticker: 'VAF', weight: 25 }, { ticker: 'VACF', weight: 15 }],
    rationale: 'Classic 60/40 portfolio using Choiceplus ETFs. The equity side (VAS + IVV + BGBL) covers AU and global markets at a blended 0.10% MER. Bond side (VAF + VACF) provides defensive stability. Total weighted MER ~0.15% vs 0.57% for active balanced funds.',
  },
  {
    id: 'hp-growth', name: 'Choiceplus Growth', icon: '📈',
    description: '80% equities / 20% bonds. A growth-oriented portfolio for 10+ year horizons within Choiceplus.',
    risk: 'growth', platform: 'choiceplus', growthPct: 80, defensivePct: 20,
    holdings: [{ ticker: 'VAS', weight: 30 }, { ticker: 'IVV', weight: 35 }, { ticker: 'BGBL', weight: 15 }, { ticker: 'VAF', weight: 20 }],
    rationale: 'All ETFs on the Hostplus Choiceplus menu. 80% equity allocation gives meaningful growth exposure. IVV at 0.04% MER is the cheapest way to access US markets. BGBL fills out developed markets. VAF provides a 20% bond buffer. Weighted MER ~0.14%.',
  },
  {
    id: 'hp-high-growth', name: 'Choiceplus High Growth', icon: '🚀',
    description: '100% equities via Choiceplus ETFs. For long-term investors with high risk tolerance.',
    risk: 'high-growth', platform: 'choiceplus', growthPct: 100, defensivePct: 0,
    holdings: [{ ticker: 'VAS', weight: 30 }, { ticker: 'IVV', weight: 40 }, { ticker: 'BGBL', weight: 20 }, { ticker: 'VAE', weight: 10 }],
    rationale: 'Maximum equity exposure using only Choiceplus-available ETFs. VAS + IVV + BGBL give broad global coverage at very low cost. VAE adds Asia emerging markets exposure for diversification. Weighted MER ~0.15% vs 0.78–0.99% for Hostplus active Balanced/High Growth. Can withstand 30–45% short-term drawdowns.',
  },
  {
    id: 'hp-esg', name: 'Choiceplus ESG Growth', icon: '🌿',
    description: 'Ethical growth portfolio using ESG-screened ETFs available on Choiceplus.',
    risk: 'growth', platform: 'choiceplus', growthPct: 85, defensivePct: 15,
    holdings: [{ ticker: 'VAS', weight: 30 }, { ticker: 'IVV', weight: 25 }, { ticker: 'BGBL', weight: 20 }, { ticker: 'ESGI', weight: 10 }, { ticker: 'VAF', weight: 15 }],
    rationale: 'ESGI (VanEck MSCI Intl Sustainable) is the primary ESG tilt — excludes tobacco, weapons, and controversial industries. Note: FAIR and ETHI are not on the Choiceplus menu; ESGI is the best available ethical international ETF within Choiceplus. VAS is the core AU allocation. Weighted MER ~0.17%.',
  },
  // ── MEMBER DIRECT ─────────────────────────────────────────────────────────
  {
    id: 'md-conservative', name: 'Member Direct Conservative', icon: '🛡',
    description: 'Capital-preservation focused. Australian shares plus bonds available on Member Direct.',
    risk: 'conservative', platform: 'member-direct', growthPct: 35, defensivePct: 65,
    holdings: [{ ticker: 'VAS', weight: 20 }, { ticker: 'VGS', weight: 15 }, { ticker: 'IGB', weight: 40 }, { ticker: 'VAF', weight: 25 }],
    rationale: 'Conservative allocation using AustralianSuper Member Direct ETFs. 35% equity, 65% defensive. IGB + VAF provide the bond allocation. VGS gives diversified international equity exposure at 0.18%. Weighted MER ~0.16% vs 0.50% for active conservative funds.',
  },
  {
    id: 'md-balanced', name: 'Member Direct Balanced', icon: '⚖️',
    description: 'Broad global passive 60/40. Complements AustralianSuper Balanced (MySuper) as a comparison.',
    risk: 'balanced', platform: 'member-direct', growthPct: 60, defensivePct: 40,
    holdings: [{ ticker: 'VAS', weight: 20 }, { ticker: 'IVV', weight: 25 }, { ticker: 'VEU', weight: 15 }, { ticker: 'IGB', weight: 25 }, { ticker: 'VAP', weight: 15 }],
    rationale: 'All available on AustralianSuper Member Direct. VAS + IVV + VEU delivers near-total global market cap exposure. VAP adds listed property for inflation protection and income. IGB provides duration. Weighted MER ~0.12% — comparable risk to active Balanced at 0.57% — at less than a quarter of the cost.',
  },
  {
    id: 'md-growth', name: 'Member Direct Growth', icon: '📈',
    description: 'Growth-oriented 80/20 allocation using Member Direct ETFs.',
    risk: 'growth', platform: 'member-direct', growthPct: 80, defensivePct: 20,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 35 }, { ticker: 'VEU', weight: 20 }, { ticker: 'IGB', weight: 20 }],
    rationale: 'Strong equity bias using Member Direct menu. VAS + IVV + VEU provides near-global coverage with VEU specifically filling markets outside the US. IGB acts as a 20% stability buffer. Weighted MER ~0.12%. Compare to AustralianSuper\'s active High Growth at 0.58% — this portfolio is roughly equivalent risk for a fraction of the fee.',
  },
  {
    id: 'md-high-growth', name: 'Member Direct High Growth', icon: '🚀',
    description: '100% global equities via Member Direct. Lowest-cost high-growth option available within AustralianSuper.',
    risk: 'high-growth', platform: 'member-direct', growthPct: 100, defensivePct: 0,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 40 }, { ticker: 'VGS', weight: 20 }, { ticker: 'NDQ', weight: 10 }, { ticker: 'IAA', weight: 5 }],
    rationale: 'Maximum growth using Member Direct. Note: IVV and VGS overlap significantly on US holdings (~68% of VGS is US) — the NDQ overweight is a deliberate tech tilt. IAA adds Asia-Pacific exposure. Weighted MER ~0.18%. Compare to active High Growth at 0.58% — still 3× cheaper. Only for 15+ year horizons.',
  },
  {
    id: 'md-esg', name: 'Member Direct ESG Growth', icon: '🌿',
    description: 'Ethically screened growth portfolio using FAIR and ETHI, available on Member Direct.',
    risk: 'growth', platform: 'member-direct', growthPct: 85, defensivePct: 15,
    holdings: [{ ticker: 'FAIR', weight: 25 }, { ticker: 'ETHI', weight: 45 }, { ticker: 'VAP', weight: 15 }, { ticker: 'IGB', weight: 15 }],
    rationale: 'FAIR and ETHI are both available on AustralianSuper Member Direct and provide strong ESG screening (excludes tobacco, coal, weapons, gambling). ETHI covers global sustainability leaders. FAIR covers Australian sustainability leaders. VAP adds property diversification. Weighted MER ~0.52% — higher than plain index ETFs but cheaper than active SRI super options at 0.60–0.80%.',
  },
  // ── SMSF ──────────────────────────────────────────────────────────────────
  {
    id: 'smsf-conservative', name: 'SMSF Conservative', icon: '🛡',
    description: 'Low-volatility portfolio with 35% equities. Suits members 5–10 years from retirement.',
    risk: 'conservative', platform: 'smsf', growthPct: 35, defensivePct: 65,
    holdings: [{ ticker: 'VAS', weight: 15 }, { ticker: 'VGS', weight: 20 }, { ticker: 'VAF', weight: 35 }, { ticker: 'IGB', weight: 20 }, { ticker: 'VAP', weight: 10 }],
    rationale: 'Capital preservation focus suitable for members within 5–10 years of retirement. 65% bonds/property provides stability. 35% equity maintains some growth exposure. All Vanguard/iShares products for maximum issuer diversification. Weighted MER ~0.16% — preserves more of your retirement income than higher-cost alternatives.',
  },
  {
    id: 'smsf-balanced', name: 'SMSF Balanced', icon: '⚖️',
    description: 'Classic 60/40 passive portfolio. Outperforms 84% of active balanced funds over 15 years after fees.',
    risk: 'balanced', platform: 'smsf', growthPct: 60, defensivePct: 40,
    holdings: [{ ticker: 'VAS', weight: 20 }, { ticker: 'IVV', weight: 25 }, { ticker: 'VGS', weight: 15 }, { ticker: 'VAF', weight: 20 }, { ticker: 'VAP', weight: 10 }, { ticker: 'GLIN', weight: 10 }],
    rationale: 'A fully diversified passive balanced portfolio across Australian shares, US shares, global developed markets, bonds, property, and infrastructure. Similar risk profile to a MySuper Balanced option but at 0.16% weighted MER vs 0.50–0.80% for active funds. GLIN adds infrastructure as a real asset class typically only found in active funds.',
  },
  {
    id: 'smsf-growth', name: 'SMSF Growth', icon: '📈',
    description: '75% equities / 25% defensive. Broad global diversification at minimal cost.',
    risk: 'growth', platform: 'smsf', growthPct: 75, defensivePct: 25,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 30 }, { ticker: 'VGS', weight: 10 }, { ticker: 'VEU', weight: 10 }, { ticker: 'VAF', weight: 15 }, { ticker: 'VAP', weight: 10 }],
    rationale: 'True global diversification — VAS covers ASX 300, IVV gives deep US exposure at 0.04%, VGS covers MSCI World, VEU fills in non-US developed and emerging markets. VAP + VAF provide the defensive buffer. Weighted MER ~0.14%. Comparable to active Growth options at 0.60–0.75%.',
  },
  {
    id: 'smsf-two-fund', name: 'SMSF Simple Two-Fund', icon: '⚡',
    description: 'VAS + VGS only. The most popular lazy-portfolio approach in Australia.',
    risk: 'high-growth', platform: 'smsf', growthPct: 100, defensivePct: 0,
    holdings: [{ ticker: 'VAS', weight: 30 }, { ticker: 'VGS', weight: 70 }],
    rationale: 'The "lazy two-fund" favoured by the Australian passive investing community. VAS tracks ASX 300, VGS tracks MSCI World ex-Australia (1,500+ global companies). 70% international reflects that Australia is only ~2% of world market cap. Weighted MER 0.14%. Simplicity is a feature — fewer decisions means fewer behavioural mistakes.',
  },
  {
    id: 'smsf-high-growth', name: 'SMSF High Growth', icon: '🚀',
    description: '100% equities diversified across Australian, US, global, and emerging markets.',
    risk: 'high-growth', platform: 'smsf', growthPct: 100, defensivePct: 0,
    holdings: [{ ticker: 'VAS', weight: 25 }, { ticker: 'IVV', weight: 35 }, { ticker: 'VGS', weight: 20 }, { ticker: 'NDQ', weight: 10 }, { ticker: 'VAE', weight: 10 }],
    rationale: 'Maximum equity growth. IVV + VGS overlap on US (deliberate — US overweight reflects market cap). NDQ is a tech tilt — high conviction on US tech growth (higher fee of 0.48%). VAE adds Asia emerging markets. Only suitable for 20+ year horizons. Weighted MER ~0.19% — still less than a third of active High Growth fund costs.',
  },
  {
    id: 'smsf-esg', name: 'SMSF ESG High Growth', icon: '🌱',
    description: 'Fully screened ethical portfolio. Excludes coal, tobacco, weapons, gambling, uranium.',
    risk: 'high-growth', platform: 'smsf', growthPct: 100, defensivePct: 0,
    holdings: [{ ticker: 'FAIR', weight: 30 }, { ticker: 'ETHI', weight: 40 }, { ticker: 'ESGI', weight: 20 }, { ticker: 'TECH', weight: 10 }],
    rationale: 'FAIR (AU ESG leaders) + ETHI (global sustainability leaders) + ESGI (MSCI SRI) provide triple-layered ethical screening. TECH adds global tech tilt for additional growth. Higher MER (~0.53%) but significantly cheaper than active SRI super options at 0.65–0.80%. All screens exclude coal, tobacco, controversial weapons, alcohol, gambling.',
  },
  {
    id: 'smsf-property', name: 'SMSF Property Income', icon: '🏢',
    description: 'Income-focused portfolio with heavy property and infrastructure tilt.',
    risk: 'growth', platform: 'smsf', growthPct: 75, defensivePct: 25,
    holdings: [{ ticker: 'VAS', weight: 20 }, { ticker: 'IVV', weight: 25 }, { ticker: 'VAP', weight: 25 }, { ticker: 'GLIN', weight: 15 }, { ticker: 'VAF', weight: 15 }],
    rationale: 'Overweights Australian REITs (VAP, 25%) and global infrastructure (GLIN, 15%) for franked income distributions and inflation protection. Suits members transitioning to pension phase who want regular income without high volatility. Infrastructure (GLIN) is hedged — suitable for shorter time horizons. Weighted MER ~0.19%.',
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getETF(t: string) { return ALL_ETFS.find(e => e.ticker === t) }

function calcPortfolioMER(holdings: { ticker: string; weight: number }[]) {
  return holdings.reduce((acc, h) => acc + ((getETF(h.ticker)?.mer ?? 0) * h.weight / 100), 0)
}

function calcPortfolioReturn(holdings: { ticker: string; weight: number }[], period: 'ret3' | 'ret5') {
  let sum = 0, covered = 0
  holdings.forEach(h => {
    const etf = getETF(h.ticker)
    if (etf?.[period]) { sum += etf[period]! * h.weight / 100; covered += h.weight }
  })
  return covered > 0 ? sum * 100 / covered : null
}

function calcPlatformFee(platform: string, balance: number) {
  if (platform === 'choiceplus')     return { annual: 168,                              label: '$168/yr flat (Hostplus Choiceplus admin)' }
  if (platform === 'member-direct')  return { annual: balance < 50000 ? 30 : balance < 250000 ? 90 : 180, label: `$${balance < 50000 ? 30 : balance < 250000 ? 90 : 180}/yr tiered (AustralianSuper Member Direct admin)` }
  if (platform === 'smsf')           return { annual: Math.max(1500, balance * 0.004),  label: 'Est. SMSF running costs (accountant + ASIC + audit)' }
  return { annual: 0, label: '' }
}

function detectOverlap(holdings: { ticker: string; weight: number }[]) {
  const t = holdings.map(h => h.ticker)
  const w: string[] = []
  if (t.includes('VAS') && t.includes('STW'))  w.push('VAS and STW both track ASX 200/300 — use just one')
  if (t.includes('VAS') && t.includes('IOZ'))  w.push('VAS and IOZ both track ASX 200/300 — use just one')
  if (t.includes('IVV') && t.includes('NDQ'))  w.push('IVV (S&P 500) and NDQ (Nasdaq 100) — Nasdaq is mostly a US tech subset of S&P 500')
  if (t.includes('VGS') && t.includes('IVV'))  w.push('VGS (~68% US) and IVV (100% US) — significant US concentration')
  if (t.includes('DHHF') && (t.includes('VAS') || t.includes('VGS') || t.includes('IVV'))) w.push('DHHF already holds VAS/VGS/IVV internally — adding them separately creates unintended concentration')
  if (t.includes('VDHG') && (t.includes('VAS') || t.includes('VGS'))) w.push('VDHG is a fund-of-funds that already contains VAS and VGS')
  return w
}

function riskBadge(risk: string): { label: string; color: string; bg: string } {
  return { conservative: { label: 'Conservative', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    balanced:            { label: 'Balanced',     color: '#0284C7', bg: 'rgba(2,132,199,0.1)' },
    growth:              { label: 'Growth',        color: '#D97706', bg: 'rgba(217,119,6,0.1)'  },
    'high-growth':       { label: 'High Growth',  color: '#DC2626', bg: 'rgba(220,38,38,0.1)'  },
  }[risk] ?? { label: risk, color: '#0F1E3C', bg: 'rgba(15,30,60,0.08)' }
}

const CAT_COLORS: Record<string,string> = {
  'au-equity':'#00D4AA','intl-equity':'#534AB7','property':'#F59E0B',
  'bonds':'#6B7280','mixed':'#10B981','thematic':'#EF4444',
}
const CAT_LABELS: Record<string,string> = {
  'au-equity':'Australian Equity','intl-equity':'International Equity',
  'property':'Property / Infrastructure','bonds':'Fixed Income / Bonds',
  'mixed':'Diversified (multi-asset)','thematic':'Thematic',
}

// ─── PIE CHART ───────────────────────────────────────────────────────────────
function AllocationPie({ holdings, size = 100 }: { holdings: { ticker: string; weight: number }[]; size?: number }) {
  const cx = size/2, cy = size/2, r = size/2 - 6, ir = size/2 - 22
  let angle = -90
  const slices = holdings.map(h => {
    const etf = getETF(h.ticker)
    const color = CAT_COLORS[etf?.category ?? 'mixed'] ?? '#ccc'
    const sa = angle, sw = h.weight / 100 * 360
    angle += sw
    return { ...h, color, sa, sw }
  })
  const mer = calcPortfolioMER(holdings)

  function arc(sa: number, sw: number): string {
    if (sw >= 359.99) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
    const toXY = (a: number, rr: number) => ({ x: cx + rr * Math.cos(a * Math.PI / 180), y: cy + rr * Math.sin(a * Math.PI / 180) })
    const s = toXY(sa, r), e = toXY(sa + sw, r), lg = sw > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {slices.map(s => <path key={s.ticker} d={arc(s.sa, s.sw)} fill={s.color} opacity={0.85} />)}
      <circle cx={cx} cy={cy} r={ir} fill="white" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={size > 80 ? 9 : 7} fill="#0F1E3C" fontWeight="600">
        {mer.toFixed(2)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={size > 80 ? 7 : 6} fill="rgba(15,30,60,0.4)">MER</text>
    </svg>
  )
}

// ─── RETURN INDICATOR ────────────────────────────────────────────────────────
function ReturnIndicator({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>—</div>
  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: value >= 10 ? '#00D4AA' : value >= 7 ? '#D97706' : '#EF4444' }}>
        {value.toFixed(1)}%
      </div>
      <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.45)' }}>{label}</div>
    </div>
  )
}

// ─── CUSTOM BUILDER ──────────────────────────────────────────────────────────
function CustomBuilder({ balance, platform }: { balance: number; platform: string }) {
  const [search, setSearch] = useState('')
  const [holdings, setHoldings] = useState<{ ticker: string; weight: number }[]>([])

  const available = ALL_ETFS.filter(e =>
    (platform === 'smsf' ? e.smsf : platform === 'choiceplus' ? e.hp : e.md) &&
    !holdings.find(h => h.ticker === e.ticker) &&
    (!search || e.ticker.toLowerCase().includes(search.toLowerCase()) || e.name.toLowerCase().includes(search.toLowerCase()))
  )

  const totalW = holdings.reduce((a, h) => a + h.weight, 0)
  const mer = calcPortfolioMER(holdings)
  const ret3 = calcPortfolioReturn(holdings, 'ret3')
  const ret5 = calcPortfolioReturn(holdings, 'ret5')
  const overlaps = detectOverlap(holdings)

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>Custom portfolio — {platform === 'choiceplus' ? 'Hostplus Choiceplus' : platform === 'member-direct' ? 'AustralianSuper Member Direct' : 'SMSF'}</div>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ETF by ticker or name..." style={inp} />
        {search && available.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
            {available.slice(0, 10).map(etf => (
              <div key={etf.ticker} onClick={() => { setHoldings(p => [...p, { ticker: etf.ticker, weight: Math.max(0, 100 - totalW) }]); setSearch('') }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(15,30,60,0.05)', display: 'flex', justifyContent: 'space-between' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginRight: 8 }}>{etf.ticker}</span>
                  <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)' }}>{etf.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{etf.mer}% MER</span>
              </div>
            ))}
          </div>
        )}
        {search && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setSearch('')} />}
      </div>

      {holdings.length === 0
        ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>Search above to add ETFs to your custom portfolio</div>
        : <>
          {holdings.map(h => {
            const etf = getETF(h.ticker)!
            return (
              <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[etf.category], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{h.ticker} <span style={{ fontWeight: 400, fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>{etf.mer}% MER</span></div>
                  <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>{CAT_LABELS[etf.category]} {etf.ret3 ? `· 3yr: ${etf.ret3}%` : ''} {etf.ret5 ? `5yr: ${etf.ret5}%` : ''}</div>
                </div>
                <input type="number" min="0" max="100" value={h.weight} onChange={e => setHoldings(p => p.map(x => x.ticker === h.ticker ? { ...x, weight: +e.target.value } : x))}
                  style={{ width: 60, padding: '5px 8px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, textAlign: 'right', outline: 'none' }} />
                <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)' }}>%</span>
                <button onClick={() => setHoldings(p => p.filter(x => x.ticker !== h.ticker))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,30,60,0.3)', fontSize: 16, padding: '0 4px' }}>✕</button>
              </div>
            )
          })}

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total allocation', val: `${totalW}%`, good: totalW === 100, bad: totalW !== 100 },
              { label: 'Weighted MER', val: `${mer.toFixed(3)}%`, good: mer < 0.2, bad: mer >= 0.5 },
              { label: '3yr est. return', val: ret3 ? `${ret3.toFixed(1)}%` : '—', good: (ret3 ?? 0) >= 10, bad: false },
              { label: '5yr est. return', val: ret5 ? `${ret5.toFixed(1)}%` : '—', good: (ret5 ?? 0) >= 8, bad: false },
            ].map(r => (
              <div key={r.label} style={{ background: r.bad ? '#FEF2F2' : r.good ? 'rgba(0,212,170,0.08)' : 'rgba(15,30,60,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: r.bad ? '#991B1B' : r.good ? '#065F46' : '#0F1E3C' }}>{r.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>{r.label}</div>
              </div>
            ))}
          </div>

          {overlaps.length > 0 && (
            <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>⚠ Overlap detected</div>
              {overlaps.map((o, i) => <div key={i} style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>· {o}</div>)}
            </div>
          )}
          {balance > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
              Annual cost on {fmt(balance)}: <strong style={{ color: '#0F1E3C' }}>{fmt(balance * mer / 100 + calcPlatformFee(platform, balance).annual)}/yr</strong>
              {' '}(invest fees + platform)
            </div>
          )}
        </>
      }
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export function PortfoliosClient({ superProfile: sp }: { superProfile: any }) {
  const [activeTab, setActiveTab]         = useState<'models' | 'builder' | 'compare'>('models')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterRisk, setFilterRisk]       = useState<string>('all')
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [builderPlatform, setBuilderPlatform] = useState('smsf')

  const balance   = sp?.current_balance ?? 0
  const fundName  = sp?.fund_name ?? ''
  const userPlatform = fundName.toLowerCase().includes('hostplus') ? 'choiceplus' :
                       fundName.toLowerCase().includes('australiansuper') ? 'member-direct' : 'smsf'

  // ── BUG FIX: clear selected when filters change (selected may no longer be visible) ──
  const filteredPortfolios = useMemo(() => {
    const result = MODEL_PORTFOLIOS.filter(p => {
      if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false
      if (filterRisk !== 'all' && p.risk !== filterRisk) return false
      return true
    })
    return result
  }, [filterPlatform, filterRisk])

  // Auto-clear selected if it's no longer in filtered list
  const selectedVisible = filteredPortfolios.find(p => p.id === selectedId)
  const selected = selectedVisible ?? null

  function setFilter(type: 'platform' | 'risk', val: string) {
    if (type === 'platform') { setFilterPlatform(val); setSelectedId(null) }
    else                     { setFilterRisk(val);     setSelectedId(null) }
  }

  const tabBtn = (t: typeof activeTab): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: activeTab === t ? '#0F1E3C' : 'white',
    color: activeTab === t ? 'white' : 'rgba(15,30,60,0.6)',
    boxShadow: activeTab === t ? 'none' : '0 0 0 1px rgba(15,30,60,0.12)',
  })
  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer', border: 'none',
    background: active ? '#0F1E3C' : 'rgba(15,30,60,0.06)',
    color: active ? 'white' : 'rgba(15,30,60,0.6)', fontWeight: active ? 600 : 400,
  })
  const c: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }

  return (
    <div style={{ maxWidth: 1060 }}>

      {/* Contextual banner */}
      {userPlatform !== 'smsf' && (
        <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
            You're with <strong>{fundName}</strong>. Portfolios marked <strong>{userPlatform === 'choiceplus' ? 'Hostplus Choiceplus' : 'AustralianSuper Member Direct'}</strong> use ETFs already available within your fund — no SMSF required.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabBtn('models')}  onClick={() => setActiveTab('models')}>Model portfolios</button>
        <button style={tabBtn('builder')} onClick={() => setActiveTab('builder')}>Custom builder</button>
        <button style={tabBtn('compare')} onClick={() => setActiveTab('compare')}>Platform comparison</button>
      </div>

      {/* ═══ TAB 1 — MODEL PORTFOLIOS ══════════════════════════════════════════ */}
      {activeTab === 'models' && (<>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.45)', marginRight: 2 }}>Platform:</span>
          {[
            { val: 'all',            label: 'All' },
            { val: 'choiceplus',     label: 'Hostplus Choiceplus' },
            { val: 'member-direct',  label: 'AustralianSuper Member Direct' },
            { val: 'smsf',           label: 'SMSF' },
          ].map(f => <button key={f.val} onClick={() => setFilter('platform', f.val)} style={filterBtn(filterPlatform === f.val)}>{f.label}</button>)}
          <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.3)', margin: '0 4px' }}>|</span>
          <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.45)', marginRight: 2 }}>Risk:</span>
          {[
            { val: 'all',          label: 'All' },
            { val: 'conservative', label: 'Conservative' },
            { val: 'balanced',     label: 'Balanced' },
            { val: 'growth',       label: 'Growth' },
            { val: 'high-growth',  label: 'High Growth' },
          ].map(f => <button key={f.val} onClick={() => setFilter('risk', f.val)} style={filterBtn(filterRisk === f.val)}>{f.label}</button>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>

          {/* Portfolio tiles grid */}
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : '1fr 1fr', gap: 12, alignContent: 'start' }}>
            {filteredPortfolios.map(p => {
              const mer    = calcPortfolioMER(p.holdings)
              const ret3   = calcPortfolioReturn(p.holdings, 'ret3')
              const ret5   = calcPortfolioReturn(p.holdings, 'ret5')
              const rl     = riskBadge(p.risk)
              const isSel  = selectedId === p.id
              const pfFee  = calcPlatformFee(p.platform, balance)
              const total  = balance * mer / 100 + pfFee.annual

              return (
                <div key={p.id}
                  onClick={() => setSelectedId(isSel ? null : p.id)}
                  style={{ background: 'white', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s',
                    border: isSel ? '2px solid #00D4AA' : '1px solid rgba(15,30,60,0.1)',
                    boxShadow: isSel ? '0 4px 20px rgba(0,212,170,0.15)' : 'none' }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,170,0.35)' }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(15,30,60,0.1)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AllocationPie holdings={p.holdings} size={72} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, }}>{p.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{p.name}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 12, background: rl.bg, color: rl.color, fontWeight: 600 }}>{rl.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.55)', lineHeight: 1.5, marginBottom: 10 }}>{p.description}</div>

                      {/* Key metrics row */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: mer < 0.2 ? '#00D4AA' : mer < 0.4 ? '#D97706' : '#EF4444' }}>{mer.toFixed(3)}%</div>
                          <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)' }}>MER p.a.</div>
                        </div>
                        {ret3 !== null && (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: ret3 >= 10 ? '#00D4AA' : '#D97706' }}>{ret3.toFixed(1)}%</div>
                            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)' }}>3yr est.</div>
                          </div>
                        )}
                        {ret5 !== null && (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: ret5 >= 8 ? '#00D4AA' : '#D97706' }}>{ret5.toFixed(1)}%</div>
                            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)' }}>5yr est.</div>
                          </div>
                        )}
                        {balance > 0 && (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>{fmt(total)}/yr</div>
                            <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)' }}>on {fmtShort(balance)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredPortfolios.length === 0 && (
              <div style={{ ...c, textAlign: 'center', padding: '40px', color: 'rgba(15,30,60,0.4)', gridColumn: '1 / -1' }}>
                No portfolios match the selected filters. Try adjusting platform or risk level.
              </div>
            )}
          </div>

          {/* Detail panel — only shows when a portfolio from the current filtered list is selected */}
          {selected && (
            <div style={{ position: 'sticky', top: 20, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={c}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{selected.icon}</span>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C' }}>{selected.name}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.7, marginBottom: 16 }}>{selected.rationale}</div>

                {/* Return + MER summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Weighted MER', val: `${calcPortfolioMER(selected.holdings).toFixed(3)}%`, highlight: true },
                    { label: '3yr est. return', val: calcPortfolioReturn(selected.holdings, 'ret3') ? `${calcPortfolioReturn(selected.holdings, 'ret3')?.toFixed(1)}% p.a.` : '—', highlight: false },
                    { label: '5yr est. return', val: calcPortfolioReturn(selected.holdings, 'ret5') ? `${calcPortfolioReturn(selected.holdings, 'ret5')?.toFixed(1)}% p.a.` : '—', highlight: false },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'rgba(15,30,60,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, color: '#0F1E3C' }}>{m.val}</div>
                      <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.4)', marginBottom: 10 }}>Holdings</div>
                {selected.holdings.map(h => {
                  const etf = getETF(h.ticker)!
                  return (
                    <div key={h.ticker} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[etf.category], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{h.ticker}</span>
                          <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{etf.name}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 1 }}>
                          {etf.mer}% MER · {CAT_LABELS[etf.category]}
                          {etf.ret3 ? ` · 3yr ${etf.ret3}%` : ''}
                          {etf.ret5 ? ` · 5yr ${etf.ret5}%` : ''}
                          {etf.esg ? ' · ✓ ESG' : ''}
                          {!etf.unhedged ? ' · AUD hedged' : ''}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#0F1E3C', minWidth: 32, textAlign: 'right' }}>{h.weight}%</div>
                    </div>
                  )
                })}

                {/* Cost breakdown */}
                {balance > 0 && (
                  <div style={{ marginTop: 14, background: '#0F1E3C', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Annual cost on {fmt(balance)}</div>
                    {(() => {
                      const pf = calcPlatformFee(selected.platform, balance)
                      const invest = balance * calcPortfolioMER(selected.holdings) / 100
                      return [
                        { l: 'Investment fees (weighted MER)', v: fmt(invest) + '/yr' },
                        { l: pf.label, v: fmt(pf.annual) + '/yr' },
                        { l: 'Total annual cost', v: fmt(invest + pf.annual) + '/yr', hi: true },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.l}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: r.hi ? 700 : 400, color: r.hi ? '#00D4AA' : 'white' }}>{r.v}</span>
                        </div>
                      ))
                    })()}
                  </div>
                )}

                {detectOverlap(selected.holdings).length === 0
                  ? <div style={{ marginTop: 10, fontSize: 11, color: '#065F46', background: 'rgba(0,212,170,0.08)', borderRadius: 8, padding: '8px 12px' }}>✓ No significant ETF overlap detected</div>
                  : detectOverlap(selected.holdings).map((o, i) => (
                    <div key={i} style={{ marginTop: 6, fontSize: 11, color: '#78350F', background: '#FFFBEB', borderRadius: 8, padding: '8px 12px' }}>⚠ {o}</div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6 }}>
          ⚠ Return estimates are weighted averages of individual ETF historical returns to 30 Jun 2025. They are for illustration only — past returns do not indicate future performance. ETF returns may differ from the portfolio's actual return due to timing and rebalancing.
        </div>
      </>)}

      {/* ═══ TAB 2 — CUSTOM BUILDER ═══════════════════════════════════════════ */}
      {activeTab === 'builder' && (<>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>Build for:</span>
          {['smsf', 'choiceplus', 'member-direct'].map(p => (
            <button key={p} onClick={() => setBuilderPlatform(p)}
              style={filterBtn(builderPlatform === p)}>
              {p === 'smsf' ? 'SMSF' : p === 'choiceplus' ? 'Hostplus Choiceplus' : 'AustralianSuper Member Direct'}
            </button>
          ))}
        </div>
        <CustomBuilder balance={balance} platform={builderPlatform} />
      </>)}

      {/* ═══ TAB 3 — PLATFORM COMPARISON ════════════════════════════════════= */}
      {activeTab === 'compare' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { id:'choiceplus', name:'Hostplus Choiceplus', icon:'🏗',
              platformFee:'$168/yr flat', brokerage:'$11 per trade', maxAlloc:'80% of balance', etfCount:'40+ ETFs + LICs', minBalance:'No minimum',
              pros:['Very low flat admin fee','No balance minimum','Combines with Indexed Balanced (0.04%)','APRA regulated, no trustee duties','ASX 300 shares also available'],
              cons:['Limited ETF menu vs SMSF','Some ETFs capped at 20% of balance','Must keep 20% in standard Hostplus options','No international-listed ETFs'],
              suitable:'Members who want ETF access without SMSF complexity. Best under $500k balance.',
              link:'https://hostplus.com.au/members/our-products-and-services/investment-options/your-investment-options/choiceplus' },
            { id:'member-direct', name:'AustralianSuper Member Direct', icon:'🏛',
              platformFee:'$30–$180/yr (balance-tiered)', brokerage:'$13 per trade', maxAlloc:'80% of balance', etfCount:'80+ shares, ETFs, LICs', minBalance:'No minimum',
              pros:['Fee reduced to $30/yr for small balances (Feb 2026)','Access to full ASX 300 + ETFs','Real-time trading + independent research','Suitable for stock pickers too'],
              cons:['Higher brokerage than Choiceplus ($13 vs $11)','Must maintain 20% in PreMixed/DIY options','Cash account required (low interest)','Less ETF variety than SMSF'],
              suitable:'AustralianSuper members wanting individual shares + ETFs. Good for active investors.',
              link:'https://www.australiansuper.com/investments/your-investment-options/member-direct' },
            { id:'smsf', name:'Self-Managed Super Fund', icon:'🔑',
              platformFee:'$1,500–$3,000+/yr (accountant + audit + ASIC)', brokerage:'$2–$10 per trade (broker-dependent)', maxAlloc:'100% — full control', etfCount:'Any ASX-listed ETF, shares, bonds, property', minBalance:'Recommended $250k+ to justify costs',
              pros:['Complete investment control','Can hold direct property, international ETFs','Better estate planning flexibility','SMSF borrowing (LRBA) for property'],
              cons:['ATO/ASIC compliance obligations','Annual audit required (~$500–$1,000)','Personal liability as trustee','Not cost-effective below ~$250k'],
              suitable:'Sophisticated investors with $250k+ wanting full control, direct property, or complex strategies.',
              link:'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/self-managed-super-funds-smsf' },
          ].map(plat => (
            <div key={plat.id} style={{ background: 'white', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.1)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{plat.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 14 }}>{plat.name}</div>
              {[['Platform fee',plat.platformFee],['Brokerage',plat.brokerage],['Max ETF allocation',plat.maxAlloc],['ETF menu',plat.etfCount],['Min. balance',plat.minBalance]].map(([l,v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,30,60,0.05)', fontSize: 12 }}>
                  <span style={{ color: 'rgba(15,30,60,0.5)' }}>{l}</span><span style={{ color: '#0F1E3C', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', margin: '12px 0 5px' }}>✓ Advantages</div>
              {plat.pros.map(p => <div key={p} style={{ fontSize: 11, color: '#065F46', lineHeight: 1.5, marginBottom: 2 }}>· {p}</div>)}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', margin: '10px 0 5px' }}>✗ Limitations</div>
              {plat.cons.map(p => <div key={p} style={{ fontSize: 11, color: '#991B1B', lineHeight: 1.5, marginBottom: 2 }}>· {p}</div>)}
              <div style={{ marginTop: 12, background: 'rgba(15,30,60,0.04)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'rgba(15,30,60,0.65)', lineHeight: 1.5 }}>
                <strong>Best for:</strong> {plat.suitable}
              </div>
              <a href={plat.link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: '#534AB7', textDecoration: 'none', fontWeight: 500 }}>Official info →</a>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>General information only.</strong> ETF data from issuer PDSs and fund menus at June 2026. Return estimates are weighted averages of individual ETF historical returns to 30 Jun 2025 — past performance does not indicate future returns. Model portfolios are illustrative examples, not personalised investment advice. Platform fees are indicative; verify in the relevant PDS. SMSF costs are estimates only. Before changing your super investment strategy, consider seeking advice from a licensed financial adviser.
      </div>
    </div>
  )
}
