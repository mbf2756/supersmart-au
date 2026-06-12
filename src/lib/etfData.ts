// ─── COMPREHENSIVE ASX ETF DATABASE ─────────────────────────────────────────
// Source: ASX ETF listings, fund issuer websites, Morningstar AU (Jun 2026)
// ret3/ret5 = net returns % p.a. to 30 Jun 2025 (where available)

export type ETFRecord = {
  ticker: string
  name: string
  issuer: string
  category: string      // au-equity | intl-equity | us-equity | property | bonds | cash | mixed | thematic | crypto
  assetClass: string    // human-readable for SMSF page
  region: string
  index: string
  mer: number           // % p.a. management expense ratio
  ret1?: number         // 1yr % net return to Jun 2025
  ret3?: number         // 3yr % p.a. net return to Jun 2025
  ret5?: number         // 5yr % p.a. net return to Jun 2025
  hedged?: boolean      // currency hedged?
  esg?: boolean
  distributing?: boolean // pays distributions (vs accumulating)
}

export const ETF_DATABASE: ETFRecord[] = [
  // ── AUSTRALIAN EQUITY ────────────────────────────────────────────────────
  { ticker:'VAS',   name:'Vanguard Australian Shares Index ETF',                 issuer:'Vanguard',    category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'S&P/ASX 300',                    mer:0.07, ret1:14.1, ret3:10.1, ret5:9.4,  hedged:false, esg:false, distributing:true  },
  { ticker:'A200',  name:'BetaShares Australia 200 ETF',                         issuer:'BetaShares',  category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'Solactive Australia 200',         mer:0.04, ret1:13.9, ret3:10.0, ret5:9.3,  hedged:false, esg:false, distributing:true  },
  { ticker:'IOZ',   name:'iShares Core S&P/ASX 200 ETF',                         issuer:'iShares',     category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'S&P/ASX 200',                    mer:0.09, ret1:13.8, ret3:10.0, ret5:9.3,  hedged:false, esg:false, distributing:true  },
  { ticker:'STW',   name:'SPDR S&P/ASX 200 ETF',                                 issuer:'SSGA',        category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'S&P/ASX 200',                    mer:0.13, ret1:13.8, ret3:10.0, ret5:9.3,  hedged:false, esg:false, distributing:true  },
  { ticker:'SFY',   name:'SPDR S&P/ASX 50 ETF',                                  issuer:'SSGA',        category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'S&P/ASX 50',                     mer:0.29, ret1:13.2, ret3:9.8,  ret5:9.1,  hedged:false, esg:false, distributing:true  },
  { ticker:'MVW',   name:'VanEck Australian Equal Weight ETF',                   issuer:'VanEck',      category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'MVIS Aus Equal Weight',           mer:0.35, ret1:12.8, ret3:9.2,  ret5:8.8,  hedged:false, esg:false, distributing:true  },
  { ticker:'QAU',   name:'BetaShares Gold Bullion ETF (AUD Hedged)',              issuer:'BetaShares',  category:'thematic',    assetClass:'Commodities',       region:'Global',          index:'Gold spot price (AUD hdgd)',      mer:0.59, ret1:27.1, ret3:14.2, ret5:12.1, hedged:true,  esg:false, distributing:false },
  { ticker:'FAIR',  name:'BetaShares Australian Sustainability Leaders ETF',     issuer:'BetaShares',  category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'NASDAQ Aus Sus. Leaders',         mer:0.49, ret1:13.2, ret3:9.6,  ret5:8.9,  hedged:false, esg:true,  distributing:true  },
  { ticker:'RARI',  name:'Russell Investments Australian Responsible Invest ETF',issuer:'Russell Inv', category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'Russell Aus Responsible',         mer:0.45, ret1:12.9, ret3:9.4,  ret5:8.7,  hedged:false, esg:true,  distributing:true  },
  { ticker:'OZR',   name:'SPDR MSCI Australia Select High Dividend Yield ETF',   issuer:'SSGA',        category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'MSCI Aus Select Hdiv',            mer:0.35, ret1:14.4, ret3:10.8, ret5:9.6,  hedged:false, esg:false, distributing:true  },
  { ticker:'VHY',   name:'Vanguard Australian Shares High Yield ETF',            issuer:'Vanguard',    category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'FTSE Aus High Div Yield',         mer:0.25, ret1:14.9, ret3:11.1, ret5:9.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'SYI',   name:'SPDR MSCI Australia Select High Dividend Yield ETF',   issuer:'SSGA',        category:'au-equity',   assetClass:'Australian Equity', region:'Australia',       index:'MSCI Aus Select Hdiv',            mer:0.35, ret1:14.3, ret3:10.7, ret5:9.5,  hedged:false, esg:false, distributing:true  },

  // ── GLOBAL / INTERNATIONAL EQUITY ───────────────────────────────────────
  { ticker:'VGS',   name:'Vanguard MSCI Index International Shares ETF',        issuer:'Vanguard',    category:'intl-equity', assetClass:'Global Equity',     region:'Developed mkts',  index:'MSCI World ex-AU',               mer:0.18, ret1:28.9, ret3:17.2, ret5:15.8, hedged:false, esg:false, distributing:true  },
  { ticker:'BGBL',  name:'BetaShares Global Shares ETF',                         issuer:'BetaShares',  category:'intl-equity', assetClass:'Global Equity',     region:'Developed mkts',  index:'Solactive GBS Dev Mkts ex-AU',   mer:0.08, ret1:28.7, ret3:17.0, ret5:15.5, hedged:false, esg:false, distributing:true  },
  { ticker:'QUAL',  name:'VanEck MSCI World ex Australia Quality ETF',           issuer:'VanEck',      category:'intl-equity', assetClass:'Global Equity',     region:'Developed mkts',  index:'MSCI World ex-AU Quality',       mer:0.40, ret1:32.1, ret3:19.2, ret5:17.3, hedged:false, esg:false, distributing:true  },
  { ticker:'IWLD',  name:'iShares Core MSCI World All Cap ETF',                  issuer:'iShares',     category:'intl-equity', assetClass:'Global Equity',     region:'Global',          index:'MSCI World All Cap',             mer:0.09, ret1:29.2, ret3:17.4, ret5:15.9, hedged:false, esg:false, distributing:true  },
  { ticker:'VGAD',  name:'Vanguard MSCI Index International Shares (Hedged) ETF',issuer:'Vanguard',   category:'intl-equity', assetClass:'Global Equity (Hdgd)',region:'Developed mkts', index:'MSCI World ex-AU (AUD hdgd)',    mer:0.21, ret1:21.4, ret3:13.1, ret5:12.8, hedged:true,  esg:false, distributing:true  },
  { ticker:'HGBL',  name:'BetaShares Global Shares ETF (Currency Hedged)',       issuer:'BetaShares',  category:'intl-equity', assetClass:'Global Equity (Hdgd)',region:'Developed mkts', index:'Solactive GBS Dev Mkts (Hdgd)',  mer:0.12, ret1:21.2, ret3:12.9, ret5:12.6, hedged:true,  esg:false, distributing:true  },
  { ticker:'ETHI',  name:'BetaShares Global Sustainability Leaders ETF',         issuer:'BetaShares',  category:'intl-equity', assetClass:'Global Equity',     region:'Global',          index:'NASDAQ Global Sus. Leaders',     mer:0.59, ret1:30.4, ret3:16.8, ret5:15.2, hedged:false, esg:true,  distributing:true  },
  { ticker:'ESGI',  name:'VanEck MSCI International Sustainable Equity ETF',    issuer:'VanEck',      category:'intl-equity', assetClass:'Global Equity',     region:'Developed mkts',  index:'MSCI World ex-AU SRI Select',    mer:0.55, ret1:29.8, ret3:15.1, ret5:13.8, hedged:false, esg:true,  distributing:true  },
  { ticker:'VEU',   name:'Vanguard All-World ex-US Shares ETF',                  issuer:'Vanguard',    category:'intl-equity', assetClass:'Global Equity',     region:'Global ex-US',    index:'FTSE All-World ex-US',           mer:0.08, ret1:16.2, ret3:11.4, ret5:9.8,  hedged:false, esg:false, distributing:true  },
  { ticker:'VGEM',  name:'Vanguard FTSE Emerging Markets Shares ETF',            issuer:'Vanguard',    category:'intl-equity', assetClass:'Emerging Markets',  region:'Emerging mkts',   index:'FTSE Emerging Markets',          mer:0.48, ret1:14.9, ret3:6.8,  ret5:6.1,  hedged:false, esg:false, distributing:true  },
  { ticker:'VGE',   name:'Vanguard FTSE Emerging Markets ETF',                   issuer:'Vanguard',    category:'intl-equity', assetClass:'Emerging Markets',  region:'Emerging mkts',   index:'FTSE Emerging',                  mer:0.48, ret1:14.7, ret3:6.7,  ret5:6.0,  hedged:false, esg:false, distributing:true  },
  { ticker:'EMKT',  name:'VanEck FTSE Emerging Markets ETF',                     issuer:'VanEck',      category:'intl-equity', assetClass:'Emerging Markets',  region:'Emerging mkts',   index:'FTSE Emerging Markets',          mer:0.69, ret1:14.8, ret3:6.6,  ret5:5.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'VAE',   name:'Vanguard FTSE Asia ex-Japan ETF',                      issuer:'Vanguard',    category:'intl-equity', assetClass:'Asia ex-Japan',     region:'Asia ex-Japan',   index:'FTSE Asia ex-Japan',             mer:0.40, ret1:14.2, ret3:8.1,  ret5:6.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'IAA',   name:'iShares Asia 50 ETF',                                  issuer:'iShares',     category:'intl-equity', assetClass:'Asia ex-Japan',     region:'Asia',            index:'S&P Asia 50',                    mer:0.50, ret1:13.8, ret3:7.8,  ret5:6.5,  hedged:false, esg:false, distributing:true  },
  { ticker:'ASIA',  name:'BetaShares Asia Technology Tigers ETF',                issuer:'BetaShares',  category:'intl-equity', assetClass:'Asia Tech',         region:'Asia',            index:'Solactive Asia Ex-Jpn Tech',     mer:0.67, ret1:18.1, ret3:4.2,  ret5:5.8,  hedged:false, esg:false, distributing:true  },
  { ticker:'IJH',   name:'iShares Core S&P Mid-Cap ETF',                         issuer:'iShares',     category:'intl-equity', assetClass:'US Mid-Cap',        region:'USA',             index:'S&P Mid-Cap 400',                mer:0.07, ret1:16.2, ret3:11.4, ret5:10.8, hedged:false, esg:false, distributing:true  },
  { ticker:'IJR',   name:'iShares Core S&P Small-Cap ETF',                       issuer:'iShares',     category:'intl-equity', assetClass:'US Small-Cap',      region:'USA',             index:'S&P Small-Cap 600',              mer:0.07, ret1:13.4, ret3:8.8,  ret5:9.2,  hedged:false, esg:false, distributing:true  },

  // ── US EQUITY ───────────────────────────────────────────────────────────
  { ticker:'IVV',   name:'iShares S&P 500 ETF',                                  issuer:'iShares',     category:'us-equity',   assetClass:'US Equity (S&P 500)',region:'USA',            index:'S&P 500',                        mer:0.04, ret1:33.2, ret3:19.1, ret5:17.4, hedged:false, esg:false, distributing:true  },
  { ticker:'SPY',   name:'SPDR S&P 500 ETF Trust',                               issuer:'SSGA',        category:'us-equity',   assetClass:'US Equity (S&P 500)',region:'USA',            index:'S&P 500',                        mer:0.09, ret1:33.1, ret3:19.0, ret5:17.3, hedged:false, esg:false, distributing:true  },
  { ticker:'IHVV',  name:'iShares S&P 500 ETF (AUD Hedged)',                     issuer:'iShares',     category:'us-equity',   assetClass:'US Equity (Hdgd)',  region:'USA',             index:'S&P 500 (AUD hedged)',            mer:0.10, ret1:23.8, ret3:14.2, ret5:14.1, hedged:true,  esg:false, distributing:true  },
  { ticker:'NDQ',   name:'BetaShares Nasdaq 100 ETF',                            issuer:'BetaShares',  category:'us-equity',   assetClass:'US Tech (Nasdaq 100)',region:'USA tech',       index:'Nasdaq 100',                     mer:0.48, ret1:38.4, ret3:22.4, ret5:21.1, hedged:false, esg:false, distributing:true  },
  { ticker:'HNDQ',  name:'BetaShares Nasdaq 100 ETF (Currency Hedged)',          issuer:'BetaShares',  category:'us-equity',   assetClass:'US Tech (Hdgd)',    region:'USA tech',        index:'Nasdaq 100 (AUD hedged)',         mer:0.51, ret1:29.1, ret3:17.6, ret5:18.2, hedged:true,  esg:false, distributing:true  },
  { ticker:'HACK',  name:'BetaShares Global Cybersecurity ETF',                  issuer:'BetaShares',  category:'thematic',    assetClass:'Cybersecurity',     region:'Global',          index:'Nasdaq CTA Cybersecurity',       mer:0.67, ret1:26.4, ret3:12.1, ret5:12.8, hedged:false, esg:false, distributing:true  },

  // ── DIVERSIFIED / MULTI-ASSET ───────────────────────────────────────────
  { ticker:'DHHF',  name:'BetaShares Diversified All Growth ETF',                issuer:'BetaShares',  category:'mixed',       assetClass:'Diversified Growth',region:'Global',          index:'~8,000 global stocks',           mer:0.19, ret1:26.1, ret3:15.2, ret5:13.9, hedged:false, esg:false, distributing:true  },
  { ticker:'VDHG',  name:'Vanguard Diversified High Growth Index ETF',           issuer:'Vanguard',    category:'mixed',       assetClass:'Diversified Growth',region:'Global',          index:'Multi-index blend (10% bonds)',  mer:0.27, ret1:22.4, ret3:13.8, ret5:12.4, hedged:false, esg:false, distributing:true  },
  { ticker:'VDGR',  name:'Vanguard Diversified Growth Index ETF',                issuer:'Vanguard',    category:'mixed',       assetClass:'Diversified Balanced',region:'Global',         index:'Multi-index blend (30% bonds)',  mer:0.27, ret1:18.2, ret3:11.1, ret5:10.1, hedged:false, esg:false, distributing:true  },
  { ticker:'VDBA',  name:'Vanguard Diversified Balanced Index ETF',              issuer:'Vanguard',    category:'mixed',       assetClass:'Diversified Balanced',region:'Global',         index:'Multi-index blend (50% bonds)',  mer:0.27, ret1:13.8, ret3:8.4,  ret5:7.6,  hedged:false, esg:false, distributing:true  },
  { ticker:'VDCO',  name:'Vanguard Diversified Conservative Index ETF',          issuer:'Vanguard',    category:'mixed',       assetClass:'Diversified Conservative',region:'Global',      index:'Multi-index blend (70% bonds)',  mer:0.27, ret1:9.4,  ret3:5.6,  ret5:5.1,  hedged:false, esg:false, distributing:true  },
  { ticker:'GROW',  name:'BetaShares Diversified Growth ETF',                    issuer:'BetaShares',  category:'mixed',       assetClass:'Diversified Growth',region:'Global',          index:'~70/30 growth/defensive',        mer:0.26, ret1:20.1, ret3:12.2, ret5:11.4, hedged:false, esg:false, distributing:true  },
  { ticker:'GBND',  name:'BetaShares Diversified Conservative Income ETF',       issuer:'BetaShares',  category:'mixed',       assetClass:'Diversified Conservative',region:'Global',      index:'~30/70 growth/defensive',        mer:0.26, ret1:8.8,  ret3:5.1,  ret5:4.7,  hedged:false, esg:false, distributing:true  },

  // ── PROPERTY / INFRASTRUCTURE ───────────────────────────────────────────
  { ticker:'VAP',   name:'Vanguard Australian Property Securities ETF',          issuer:'Vanguard',    category:'property',    assetClass:'AU Property (A-REITs)',region:'Australia',     index:'S&P/ASX 200 A-REIT',             mer:0.23, ret1:14.8, ret3:8.4,  ret5:6.2,  hedged:false, esg:false, distributing:true  },
  { ticker:'SLF',   name:'SPDR S&P/ASX 200 Listed Property ETF',                issuer:'SSGA',        category:'property',    assetClass:'AU Property (A-REITs)',region:'Australia',     index:'S&P/ASX 200 A-REIT',             mer:0.40, ret1:14.6, ret3:8.2,  ret5:6.0,  hedged:false, esg:false, distributing:true  },
  { ticker:'MVA',   name:'VanEck Vectors Australian Property ETF',               issuer:'VanEck',      category:'property',    assetClass:'AU Property (A-REITs)',region:'Australia',     index:'MVIS Aus A-REITs',               mer:0.35, ret1:14.4, ret3:8.0,  ret5:5.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'DJRE',  name:'SPDR Dow Jones Global Real Estate ETF',                issuer:'SSGA',        category:'property',    assetClass:'Global Property',   region:'Global',          index:'Dow Jones Global Select RE',     mer:0.50, ret1:16.2, ret3:7.8,  ret5:6.8,  hedged:false, esg:false, distributing:true  },
  { ticker:'GLIN',  name:'iShares Global Infrastructure ETF (AUD Hedged)',       issuer:'iShares',     category:'property',    assetClass:'Global Infrastructure',region:'Global',        index:'FTSE Global Core Infra (Hdgd)',  mer:0.35, ret1:9.8,  ret3:7.9,  ret5:7.1,  hedged:true,  esg:false, distributing:true  },
  { ticker:'IFRA',  name:'VanEck FTSE Global Infrastructure (Hedged) ETF',       issuer:'VanEck',      category:'property',    assetClass:'Global Infrastructure',region:'Global',        index:'FTSE Global Core Infra (Hdgd)',  mer:0.52, ret1:10.1, ret3:8.1,  ret5:7.3,  hedged:true,  esg:false, distributing:true  },

  // ── FIXED INCOME / BONDS ─────────────────────────────────────────────────
  { ticker:'VAF',   name:'Vanguard Australian Fixed Interest Index ETF',         issuer:'Vanguard',    category:'bonds',       assetClass:'AU Bonds (Govt + Corp)',region:'Australia',    index:'Bloomberg AusBond Composite',    mer:0.20, ret1:4.2,  ret3:1.8,  ret5:0.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'IGB',   name:'iShares Core Composite Bond ETF',                      issuer:'iShares',     category:'bonds',       assetClass:'AU Bonds (Govt + Corp)',region:'Australia',    index:'Bloomberg AusBond Composite',    mer:0.15, ret1:4.1,  ret3:1.8,  ret5:0.9,  hedged:false, esg:false, distributing:true  },
  { ticker:'AGVT',  name:'iShares Core Australian Government Bond ETF',          issuer:'iShares',     category:'bonds',       assetClass:'AU Government Bonds', region:'Australia',      index:'Bloomberg AusBond Govt',         mer:0.12, ret1:4.6,  ret3:2.1,  ret5:1.1,  hedged:false, esg:false, distributing:true  },
  { ticker:'VACF',  name:'Vanguard Australian Corporate Fixed Interest ETF',     issuer:'Vanguard',    category:'bonds',       assetClass:'AU Corporate Bonds',  region:'Australia',      index:'Bloomberg AusBond Credit',       mer:0.25, ret1:4.8,  ret3:2.4,  ret5:1.5,  hedged:false, esg:false, distributing:true  },
  { ticker:'VGB',   name:'Vanguard Australian Government Bond Index ETF',        issuer:'Vanguard',    category:'bonds',       assetClass:'AU Government Bonds', region:'Australia',      index:'Bloomberg AusBond Govt',         mer:0.20, ret1:4.5,  ret3:2.0,  ret5:1.0,  hedged:false, esg:false, distributing:true  },
  { ticker:'PLUS',  name:'VanEck Australian Investment Grade Corporate Bond ETF',issuer:'VanEck',      category:'bonds',       assetClass:'AU Corporate Bonds',  region:'Australia',      index:'iBoxx AUD Investment Grade Corp', mer:0.25, ret1:5.1,  ret3:2.6,  ret5:1.8,  hedged:false, esg:false, distributing:true  },
  { ticker:'VIF',   name:'Vanguard International Fixed Interest Index ETF (Hdgd)',issuer:'Vanguard',   category:'bonds',       assetClass:'Global Bonds (Hdgd)', region:'Global',          index:'Bloomberg Global Aggregate (Hdgd)',mer:0.20,ret1:3.8, ret3:1.4,  ret5:0.7,  hedged:true,  esg:false, distributing:true  },
  { ticker:'IHCB',  name:'iShares Core Global Corporate Bond (AUD Hedged) ETF',  issuer:'iShares',     category:'bonds',       assetClass:'Global Corp Bonds (Hdgd)',region:'Global',       index:'Markit iBoxx Global Corp (Hdgd)',mer:0.26, ret1:6.2,  ret3:3.1,  ret5:2.1,  hedged:true,  esg:false, distributing:true  },
  { ticker:'BILL',  name:'iShares Core Cash ETF',                                issuer:'iShares',     category:'cash',        assetClass:'Cash / Short-term',   region:'Australia',      index:'Bloomberg AusBond Bank Bill',    mer:0.07, ret1:4.4,  ret3:3.1,  ret5:2.3,  hedged:false, esg:false, distributing:true  },
  { ticker:'AAA',   name:'BetaShares Australian High Interest Cash ETF',         issuer:'BetaShares',  category:'cash',        assetClass:'Cash / Short-term',   region:'Australia',      index:'Bank deposit rates',             mer:0.18, ret1:4.5,  ret3:3.3,  ret5:2.5,  hedged:false, esg:false, distributing:true  },
  { ticker:'QPON',  name:'BetaShares Australian Bank Subordinated Debt ETF',     issuer:'BetaShares',  category:'bonds',       assetClass:'Bank Sub-Debt',       region:'Australia',      index:'iBoxx AUD Bank Sub Debt',        mer:0.29, ret1:5.8,  ret3:3.4,  ret5:2.6,  hedged:false, esg:false, distributing:true  },
  { ticker:'FLOT',  name:'VanEck Investment Grade Floating Rate ETF',            issuer:'VanEck',      category:'bonds',       assetClass:'Floating Rate',       region:'Australia',      index:'Bloomberg Global FRN (AUD hdgd)',mer:0.22, ret1:5.2,  ret3:3.4,  ret5:2.7,  hedged:true,  esg:false, distributing:true  },

  // ── THEMATIC / SECTOR ─────────────────────────────────────────────────────
  { ticker:'TECH',  name:'Global X Morningstar Global Technology ETF',           issuer:'Global X',    category:'thematic',    assetClass:'Global Technology',  region:'Global tech',     index:'Morningstar Dev Mkts Tech',      mer:0.45, ret1:36.8, ret3:21.0, ret5:19.2, hedged:false, esg:false, distributing:true  },
  { ticker:'CLDD',  name:'BetaShares Cloud Computing ETF',                       issuer:'BetaShares',  category:'thematic',    assetClass:'Cloud Computing',    region:'Global',          index:'BlueStar Global Cloud',          mer:0.67, ret1:30.2, ret3:18.2, ret5:16.4, hedged:false, esg:false, distributing:true  },
  { ticker:'ROBO',  name:'Global X Robotics & Artificial Intelligence ETF',      issuer:'Global X',    category:'thematic',    assetClass:'Robotics / AI',      region:'Global',          index:'Indxx Global Robotics & AI',     mer:0.69, ret1:28.4, ret3:14.8, ret5:13.2, hedged:false, esg:false, distributing:true  },
  { ticker:'DRUG',  name:'BetaShares Global Healthcare ETF',                     issuer:'BetaShares',  category:'thematic',    assetClass:'Global Healthcare',  region:'Global',          index:'Nasdaq Global ex-AU Healthcare', mer:0.57, ret1:18.2, ret3:11.4, ret5:10.8, hedged:false, esg:false, distributing:true  },
  { ticker:'BNKS',  name:'Global X S&P/ASX 200 Financials ETF',                  issuer:'Global X',    category:'thematic',    assetClass:'AU Financials',      region:'Australia',       index:'S&P/ASX 200 Financials',         mer:0.09, ret1:24.8, ret3:13.8, ret5:11.2, hedged:false, esg:false, distributing:true  },
  { ticker:'MNRS',  name:'BetaShares Global Gold Miners ETF (Hedged)',            issuer:'BetaShares',  category:'thematic',    assetClass:'Gold Miners (Hdgd)', region:'Global',          index:'NYSE Arca Gold Miners (Hdgd)',   mer:0.57, ret1:41.2, ret3:9.8,  ret5:7.4,  hedged:true,  esg:false, distributing:true  },
  { ticker:'GOLD',  name:'Perth Mint Physical Gold ETF',                         issuer:'Perth Mint',  category:'thematic',    assetClass:'Physical Gold',      region:'Global',          index:'Gold spot price',                mer:0.15, ret1:33.4, ret3:16.8, ret5:14.2, hedged:false, esg:false, distributing:false },
  { ticker:'CRYP',  name:'BetaShares Crypto Innovators ETF',                     issuer:'BetaShares',  category:'crypto',      assetClass:'Crypto / Blockchain',region:'Global',          index:'Bitwise Crypto Innovators 30',   mer:0.67, ret1:82.4, ret3:12.1, ret5:null, hedged:false, esg:false, distributing:false },
  { ticker:'EBTC',  name:'Global X 21Shares Bitcoin ETF',                        issuer:'Global X',    category:'crypto',      assetClass:'Bitcoin',            region:'Global',          index:'Bitcoin spot price',             mer:0.59, ret1:120.1,ret3:null, ret5:null, hedged:false, esg:false, distributing:false },
]

// Group by issuer for filter
export const ETF_ISSUERS = [...new Set(ETF_DATABASE.map(e => e.issuer))].sort()

// Group by category
export const ETF_CATEGORIES = [
  { value: '',              label: 'All categories' },
  { value: 'au-equity',    label: 'Australian Equity' },
  { value: 'us-equity',    label: 'US Equity' },
  { value: 'intl-equity',  label: 'International Equity' },
  { value: 'mixed',        label: 'Diversified / Multi-asset' },
  { value: 'property',     label: 'Property & Infrastructure' },
  { value: 'bonds',        label: 'Fixed Income / Bonds' },
  { value: 'cash',         label: 'Cash' },
  { value: 'thematic',     label: 'Thematic / Sector' },
  { value: 'crypto',       label: 'Crypto / Digital Assets' },
]
