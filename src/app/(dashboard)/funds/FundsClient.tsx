'use client'
import { useState, useMemo } from 'react'
import { calcFeeDrag, fmt, fmtShort } from '@/lib/calculations'

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCES (all fees verified directly from fund PDSs — no third-party spreadsheets):
//   Hostplus:        Fees & Costs Guide, 30 September 2025  (hostplus.com.au/pds)
//   AustralianSuper: Fees & Costs, 30 May 2026              (australiansuper.com/PDS)
//   ART:             PDS and Fees Guide, Nov 2025            (australianretirementtrust.com.au)
//   UniSuper:        Fees page, verified June 2026           (unisuper.com.au)
//   Aware Super:     Fees & Costs Guide, Oct 2025            (aware.com.au)
//   REST, HESTA, Cbus, others: respective current PDSs
//   Vanguard Super:  PDS, Jun 2025                           (vanguard.com.au)
//
// fee = investment fees + transaction costs % p.a. (TOTAL, as shown in PDS "Total %" column)
// For Hostplus active options: fee shown EXCLUDES performance fees (variable, up to 0.41%)
//   The feeForTotal field adds performance fees for accurate total cost comparison
// feeForTotal: used for Total/yr column — includes reclassified levies for cross-fund accuracy
//   Vanguard: stated invest fee is 0.21%; +0.05% ORFR reclassified for comparison = 0.26%
// ret1/ret5/ret10 = net returns to 30 June 2025 (SuperRatings crediting rate data)
// ─────────────────────────────────────────────────────────────────────────────

type FundOption = {
  fund: string
  option: string
  type: 'Industry' | 'Public sector' | 'Retail'
  category: string
  fee: number            // invest fee % p.a. from fund's own PDS/website
  feeForTotal?: number   // if set, use this for total cost calc (spreadsheet comparison basis)
  adminFixed: number     // flat $ p.a.
  adminPct: number       // % of AUM
  adminCap: number | null
  ret1: number | null    // 1yr FY25
  ret5: number | null    // 5yr FY25
  ret7: number | null    // 7yr FY25
  ret10: number | null   // 10yr FY25
  apra: 'passed' | 'failed'
  esg: string
  passive: boolean
  restWarning?: boolean
  note?: string
}

// Total fee at $50k for cross-check: invest_fee * 50000 + admin_fixed + min(50000 * admin_pct, cap)
const ALL_OPTIONS: FundOption[] = [

  // ─── BALANCED ACTIVE ──────────────────────────────────────────────────────
  // UniSuper: admin = $0 flat + 2% capped at $96/yr. invest = 0.41% (from PDS)
  { fund: 'UniSuper', option: 'Balanced', type: 'Industry', category: 'balanced-active',
    fee: 0.0041, adminFixed: 0, adminPct: 0.020, adminCap: 96,
    ret1: 0.1145, ret5: 0.1096, ret7: null, ret10: 0.0980, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal >10%, live animal export', passive: false },

  // ART: admin = $62.40 + 0.10% capped $500. invest = 0.54% (active balanced from PDS)
  { fund: 'Australian Retirement Trust', option: 'Balanced', type: 'Industry', category: 'balanced-active',
    fee: 0.0065, adminFixed: 62.4, adminPct: 0.001, adminCap: 500,
    ret1: 0.1190, ret5: 0.1181, ret7: 0.0927, ret10: 0.0940, apra: 'passed',
    esg: 'Excludes thermal coal >10%, tobacco >5%, cluster munitions', passive: false },

  // AustralianSuper: admin = $52 + 0.10% capped $350. invest = 0.49% Balanced (PDS 30 May 2026)
  { fund: 'AustralianSuper', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active',
    fee: 0.0049, adminFixed: 52, adminPct: 0.001, adminCap: 350,
    ret1: 0.1061, ret5: 0.0997, ret7: null, ret10: 0.0884, apra: 'passed',
    esg: 'ESG integration', passive: false },

  // Aware Super: admin = $52 + 0.15% capped $750. invest = 0.66% HG / Balanced Growth
  { fund: 'Aware Super', option: 'Balanced Growth', type: 'Industry', category: 'balanced-active',
    fee: 0.0050, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1188, ret5: 0.1031, ret7: null, ret10: 0.0883, apra: 'passed',
    esg: 'Excludes thermal coal >5%, tobacco >5%, controversial weapons', passive: false },

  // Hostplus Balanced: admin = $78 flat. invest = 0.80% (spreadsheet 0.80%, PDS 0.99% incl perf fees)
  { fund: 'Hostplus', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active',
    fee: 0.0062, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes controversial weapons', passive: false,
    note: 'Invest fee 0.62% excl perf fees. Perf fees up to 0.37% p.a. (historically averaged ~0.37%). Total can reach 1.07% p.a. — Source: Hostplus Fees & Costs Guide, 30 Sep 2025.' },

  // Cbus: admin = $52 + 0.19% capped $1000. invest = 0.55% (HG from spreadsheet)
  { fund: 'Cbus', option: 'Growth (MySuper)', type: 'Industry', category: 'balanced-active',
    fee: 0.0056, adminFixed: 52, adminPct: 0.0019, adminCap: 1000,
    ret1: 0.1180, ret5: 0.1059, ret7: null, ret10: 0.0928, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },

  // REST Core Strategy: admin = $78 + 0.10% capped $600. invest = 0.59% (balanced)
  { fund: 'REST', option: 'Core Strategy', type: 'Industry', category: 'balanced-active',
    fee: 0.0059, adminFixed: 78, adminPct: 0.001, adminCap: 600,
    ret1: 0.1162, ret5: 0.1088, ret7: 0.0839, ret10: 0.0844, apra: 'passed',
    esg: 'Excludes tobacco >5%', passive: false },

  // HESTA: admin = $52 + 0.15% capped $750. invest = 0.67%
  { fund: 'HESTA', option: 'MySuper Balanced Growth', type: 'Industry', category: 'balanced-active',
    fee: 0.0053, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1200, ret5: 0.1154, ret7: null, ret10: 0.0920, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },

  // Spirit Super: admin = not in spreadsheet, using known ~$52+0.19%. invest ~0.71%
  { fund: 'Spirit Super', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active',
    fee: 0.0071, adminFixed: 52, adminPct: 0.0019, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'None', passive: false },

  // CareSuper: admin = $67.60 + 0.15% capped $750. invest = 0.63%
  { fund: 'CareSuper', option: 'Balanced (MySuper)', type: 'Industry', category: 'balanced-active',
    fee: 0.0063, adminFixed: 67.6, adminPct: 0.0015, adminCap: 750,
    ret1: 0.0956, ret5: 0.0961, ret7: 0.0777, ret10: 0.0823, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },

  // ART Socially Conscious Balanced: invest 0.58% + trans 0.08% = 0.66%
  // Source: australianretirementtrust.com.au/investments/fees (Jun 2026)
  { fund: 'Australian Retirement Trust', option: 'Socially Conscious Balanced', type: 'Industry', category: 'balanced-active',
    fee: 0.0066, adminFixed: 62.4, adminPct: 0.001, adminCap: 500,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes thermal coal >10%, tobacco >5%, cluster munitions + responsible ownership', passive: false,
    note: 'Source: australianretirementtrust.com.au/investments/fees, Jun 2026' },

  // Brighter Super: admin = $26 + 0.14% capped $650. invest = 0.64%
  { fund: 'Brighter Super', option: 'High Growth', type: 'Industry', category: 'balanced-active',
    fee: 0.0064, adminFixed: 26, adminPct: 0.0014, adminCap: 650,
    ret1: 0.1165, ret5: 0.1078, ret7: 0.0954, ret10: null, apra: 'passed',
    esg: 'ESG integration', passive: false },

  // Retail balanced active
  { fund: 'BT Super', option: 'MySuper Lifestage', type: 'Retail', category: 'balanced-active',
    fee: 0.0100, adminFixed: 78, adminPct: 0.002, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'failed',
    esg: 'None', passive: false },

  // ─── BALANCED INDEXED ─────────────────────────────────────────────────────
  // AustralianSuper Indexed Diversified: invest = 0.06% (PDS 30 May 2026 confirmed)
  { fund: 'AustralianSuper', option: 'Indexed Diversified', type: 'Industry', category: 'balanced-indexed',
    fee: 0.0006, adminFixed: 52, adminPct: 0.001, adminCap: 350,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Partial ESG screens', passive: true,
    note: 'Tracks MSCI World + ASX 300 style. Lowest-fee indexed balanced in market.' },

  // Hostplus Indexed Balanced: invest = 0.04% (PDS Sep 2025: cost of product $139 - $119 admin = $20 = 0.04%)
  { fund: 'Hostplus', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed',
    fee: 0.0004, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes controversial weapons', passive: true,
    note: 'Tracks S&P/ASX 200 + MSCI World ex-AU (unhedged).' },

  // AustralianSuper Socially Aware: invest = 0.52%, trans = 0.08%, total = 0.60% (PDS 30 May 2026)
  // Admin: $52 + 0.10% capped $350
  { fund: 'AustralianSuper', option: 'Socially Aware', type: 'Industry', category: 'balanced-active',
    fee: 0.0052, feeForTotal: 0.0060, adminFixed: 52, adminPct: 0.001, adminCap: 350,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal, controversial weapons + ESG integration', passive: false,
    note: 'Investment fee 0.52% + transaction 0.08% = 0.60% total. Source: AustralianSuper PDS 30 May 2026.' },

  // ART Indexed Balanced: invest = 0.08% (from spreadsheet Fees-AusInt)
  { fund: 'Australian Retirement Trust', option: 'Indexed Balanced', type: 'Industry', category: 'balanced-indexed',
    fee: 0.0008, adminFixed: 62.4, adminPct: 0.001, adminCap: 500,
    ret1: 0.1211, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes thermal coal >10%, tobacco >5%, cluster munitions', passive: true,
    note: 'Tracks MSCI AU 300 + MSCI ACWI ex-AU with special tax treatment.' },

  // Aware Super Indexed Growth: invest = 0.06% (Fees-AusInt: 0.0006 Aus + 0.0006 Int)
  { fund: 'Aware Super', option: 'Indexed Growth', type: 'Industry', category: 'balanced-indexed',
    fee: 0.0006, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1399, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes thermal coal, tobacco, controversial weapons + ESG tilt', passive: true,
    note: 'Custom MSCI ESG-screened index. Strong ethical screens.' },

  // QSuper Indexed: invest = 0.08% (same as ART — merged fund)
  { fund: 'QSuper (via ART)', option: 'Indexed (QLD Govt members only)', type: 'Public sector', category: 'balanced-indexed',
    fee: 0.0008, adminFixed: 62.4, adminPct: 0.0006, adminCap: 500,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco, cluster munitions, thermal coal', passive: true,
    note: 'Only available to QLD Government employees and eligible family members.' },

  // REST Indexed: invest = 0% stated BUT effective ~0.15-0.24% due to derivative hidden cost
  { fund: 'REST', option: 'Indexed (effective fee ~0.15–0.24%)', type: 'Industry', category: 'balanced-indexed',
    fee: 0.0000, adminFixed: 78, adminPct: 0.001, adminCap: 600,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco >5%', passive: true,
    restWarning: true,
    note: 'Uses derivative contracts (total return swaps) not direct shareholding. Hidden cost ~0.20–0.35% on international holdings due to benchmark tax assumptions.' },

  // Vanguard Super Balanced Growth: admin=0.33% capped $840, invest=0.21%, transaction=0.00%
  // Total stated on website = 0.54% (at balances under $254k). Above that, admin caps at $840.
  { fund: 'Vanguard Super', option: 'Lifecycle Balanced Growth', type: 'Retail', category: 'balanced-indexed',
    fee: 0.0021, feeForTotal: 0.0026, adminFixed: 0, adminPct: 0.0033, adminCap: 840,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'None', passive: true,
    note: 'Website shows 0.54% total (admin 0.33% + invest 0.21%). Admin capped at $840/yr above ~$255k balance. The 0.05% ORFR levy is separately added for cross-fund comparison.' },

  // ─── HIGH GROWTH / INDEXED SHARES ─────────────────────────────────────────
  // Hostplus Indexed Shares: invest = 0.02% (PDS: cost $129 - $119 admin = $10 = 0.02%)
  { fund: 'Hostplus', option: 'Indexed Shares', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0002, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: 0.1417, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes controversial weapons', passive: true,
    note: 'Tracks S&P/ASX 200 + MSCI World ex-AU (unhedged). Lowest-fee option in market.' },

  // Hostplus Indexed High Growth: invest = 0.04% (same as Indexed Balanced per spreadsheet)
  { fund: 'Hostplus', option: 'Indexed High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0004, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes controversial weapons', passive: true },

  // ART Indexed (high growth equivalent): invest = 0.08%
  { fund: 'Australian Retirement Trust', option: 'International Shares Unhedged Index', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0010, adminFixed: 62.4, adminPct: 0.001, adminCap: 500,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco, cluster munitions', passive: true,
    note: 'Highly commended 2025 Finder Awards. MSCI ACWI ex-AU with special tax treatment.' },

  // Aware Super Indexed (100% equity equiv): invest = 0.06%
  { fund: 'Aware Super', option: 'Indexed Shares', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0006, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes thermal coal, tobacco, controversial weapons + ESG tilt', passive: true },

  // AustralianSuper High Growth: invest = 0.46% (PDS 30 May 2026 confirmed)
  { fund: 'AustralianSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0046, adminFixed: 52, adminPct: 0.001, adminCap: 350,
    ret1: 0.1061, ret5: 0.0997, ret7: null, ret10: 0.0884, apra: 'passed',
    esg: 'ESG integration', passive: false },

  // UniSuper High Growth: invest = 0.59% (from spreadsheet)
  { fund: 'UniSuper', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0059, adminFixed: 0, adminPct: 0.020, adminCap: 96,
    ret1: 0.1145, ret5: 0.1096, ret7: null, ret10: 0.0980, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal >10%, live animal export', passive: false },

  // Aware Super High Growth (active): invest = 0.66%
  { fund: 'Aware Super', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0057, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1188, ret5: 0.1031, ret7: null, ret10: 0.0883, apra: 'passed',
    esg: 'Excludes thermal coal, tobacco, controversial weapons', passive: false },

  // ART High Growth: invest = 0.70%
  { fund: 'Australian Retirement Trust', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0070, adminFixed: 62.4, adminPct: 0.001, adminCap: 500,
    ret1: 0.1190, ret5: 0.1181, ret7: 0.0927, ret10: 0.0940, apra: 'passed',
    esg: 'Excludes thermal coal >10%, tobacco >5%, cluster munitions', passive: false },

  // Hostplus High Growth (active): invest = 0.80%
  { fund: 'Hostplus', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0044, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: 0.1357, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'ESG integration', passive: false,
    note: 'Invest fee 0.44% excl perf fees. Perf fees historically ~0.22% p.a. Total ~0.73% p.a. — Source: Hostplus Fees & Costs Guide, 30 Sep 2025.' },

  // HESTA High Growth: invest = 0.72%
  { fund: 'HESTA', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0060, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1200, ret5: 0.1154, ret7: null, ret10: 0.0920, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },

  // Cbus High Growth: invest = 0.55%
  { fund: 'Cbus', option: 'High Growth', type: 'Industry', category: 'highgrowth-active',
    fee: 0.0060, adminFixed: 52, adminPct: 0.0019, adminCap: 1000,
    ret1: 0.1180, ret5: 0.1059, ret7: null, ret10: 0.0928, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },

  // Vanguard Super High Growth: admin=0.33% capped $840, invest=0.21%, transaction=0.00%
  // Website shows 0.54% total at small balances; caps above ~$255k
  { fund: 'Vanguard Super', option: 'High Growth', type: 'Retail', category: 'highgrowth-active',
    fee: 0.0021, feeForTotal: 0.0026, adminFixed: 0, adminPct: 0.0033, adminCap: 840,
    ret1: 0.1348, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'None', passive: true,
    note: 'Website shows 0.54% total (admin 0.33% + invest 0.21%). Admin fee capped at $840/yr for balances over ~$255k. Includes 0.05% ORFR for comparison purposes.' },

  // ─── HIGH GROWTH SRI ──────────────────────────────────────────────────────
  // Aware Super SRI: invest = 0.44% (Fees-HG SRI: total at $50k=$347, admin=$127, invest=$220=0.44%)
  { fund: 'Aware Super', option: 'High Growth Socially Conscious', type: 'Industry', category: 'highgrowth-sri',
    fee: 0.0044, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: 0.1325, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Strong: coal, oil & gas, tobacco, weapons, gambling, alcohol, uranium, animal farming', passive: false },

  // UniSuper Global Environmental Companies (SRI): invest = 0.45%
  { fund: 'UniSuper', option: 'Global Environmental Companies (SRI)', type: 'Industry', category: 'highgrowth-sri',
    fee: 0.0045, adminFixed: 0, adminPct: 0.020, adminCap: 96,
    ret1: 0.1224, ret5: 0.1035, ret7: null, ret10: 0.0966, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal >10%, live animal export + environmental tilt', passive: false },

  // Hostplus SRI (Shares Plus): invest = 0.57% (Fees-HG SRI total $363 - $78 admin = $285 = 0.57%)
  { fund: 'Hostplus', option: 'Shares Plus (SRI)', type: 'Industry', category: 'highgrowth-sri',
    fee: 0.0057, adminFixed: 78, adminPct: 0, adminCap: null,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Strong: coal, oil & gas, tobacco, weapons, gambling, alcohol, uranium, palm oil', passive: false },

  // ─── GROWTH ACTIVE ────────────────────────────────────────────────────────
  { fund: 'UniSuper', option: 'Growth', type: 'Industry', category: 'growth-active',
    fee: 0.0043, adminFixed: 0, adminPct: 0.020, adminCap: 96,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal >10%, live animal export', passive: false },

  { fund: 'Aware Super', option: 'Growth', type: 'Industry', category: 'growth-active',
    fee: 0.0060, adminFixed: 52, adminPct: 0.0015, adminCap: 750,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes thermal coal, tobacco, controversial weapons', passive: false },

  // ─── CONSERVATIVE ─────────────────────────────────────────────────────────
  { fund: 'UniSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active',
    fee: 0.0037, adminFixed: 0, adminPct: 0.020, adminCap: 96,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Excludes tobacco, thermal coal >10%, live animal export', passive: false },

  { fund: 'AustralianSuper', option: 'Conservative Balanced', type: 'Industry', category: 'conservative-active',
    fee: 0.0038, adminFixed: 52, adminPct: 0.001, adminCap: 350,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'ESG integration', passive: false,
    note: 'Investment fee 0.38% (PDS 30 May 2026).' },

  { fund: 'Cbus', option: 'Conservative', type: 'Industry', category: 'conservative-active',
    fee: 0.0044, adminFixed: 52, adminPct: 0.0019, adminCap: 1000,
    ret1: null, ret5: null, ret7: null, ret10: null, apra: 'passed',
    esg: 'Partial ESG screens', passive: false },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function adminAtBalance(o: FundOption, balance: number): number {
  const pctAmt = balance * o.adminPct
  const capped = o.adminCap !== null ? Math.min(pctAmt, o.adminCap) : pctAmt
  return o.adminFixed + capped
}

function totalFeeAtBalance(o: FundOption, balance: number): number {
  // Use feeForTotal (spreadsheet comparison basis) when available, else stated fee
  const feeRate = o.feeForTotal ?? o.fee
  return feeRate * balance + adminAtBalance(o, balance)
}

function effectiveFeeRate(o: FundOption, balance: number): number {
  return totalFeeAtBalance(o, balance) / balance
}

function detectCategory(optionName: string): string {
  const opt = (optionName ?? '').toLowerCase()
  if (opt.includes('indexed share') || opt.includes('indexed global') || opt.includes('index share') || opt.includes('indexed high growth')) return 'highgrowth-active'
  if (opt.includes('indexed') || opt.includes('index ') || opt.includes('vanguard')) return 'balanced-indexed'
  if (opt.includes('high growth') || opt.includes('highgrowth')) return 'highgrowth-active'
  if (opt.includes('shares plus') || opt.includes('socially conscious') || opt.includes('global environmental') || opt.includes('sri')) return 'highgrowth-sri'
  if (opt.includes('growth') && !opt.includes('conservative') && !opt.includes('balanced')) return 'growth-active'
  if (opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')) return 'conservative-active'
  if (opt.includes('cash')) return 'cash'
  return 'balanced-active'
}

function categoryLabel(cat: string, optionName?: string): string {
  if (cat === 'highgrowth-active' && (optionName ?? '').toLowerCase().includes('indexed')) return 'Indexed Shares / High Growth Passive'
  return {
    'balanced-active':   'Balanced — Active Management',
    'balanced-indexed':  'Balanced — Indexed / Passive',
    'highgrowth-active': 'High Growth',
    'highgrowth-sri':    'High Growth — Socially Responsible (SRI)',
    'growth-active':     'Growth',
    'conservative-active': 'Conservative',
    'cash': 'Cash',
  }[cat] ?? 'Balanced'
}

function feeColor(fee: number): string {
  if (fee <= 0.0015) return '#059669'
  if (fee <= 0.005)  return '#00D4AA'
  if (fee <= 0.008)  return '#D97706'
  return '#EF4444'
}

const ALLOC_INFO: Record<string, { growth: string; defensive: string; desc: string }> = {
  'conservative-active': { growth: '30–50%', defensive: '50–70%', desc: 'Lower risk, lower long-term return. Suits shorter time horizons or low risk tolerance.' },
  'balanced-active':     { growth: '50–75%', defensive: '25–50%', desc: 'Moderate risk/return. The most common default option for most Australians.' },
  'balanced-indexed':    { growth: '50–75%', defensive: '25–50%', desc: 'Same risk profile as balanced active — but with dramatically lower fees via passive management.' },
  'growth-active':       { growth: '75–90%', defensive: '10–25%', desc: 'Higher equity focus. Better long-term returns. Suits 10+ year horizons.' },
  'highgrowth-active':   { growth: '90–100%', defensive: '0–10%', desc: 'Maximum growth. Suits 20+ year horizons. Can fall 30–45% in a downturn.' },
  'highgrowth-sri':      { growth: '85–100%', defensive: '0–15%', desc: 'High growth with ethical screens. Excludes harmful industries. Slightly higher fees than plain indexed.' },
  'cash':                { growth: '0%', defensive: '100%', desc: 'Capital preservation only. Minimal returns. Not suitable for long-term growth.' },
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function FundsClient({ superProfile: sp }: { superProfile: any }) {
  const [showAll, setShowAll]       = useState(false)
  const [activeTab, setActiveTab]   = useState<'comparison' | 'education' | 'research'>('comparison')

  const userFundName: string  = sp?.fund_name ?? ''
  const userOption: string    = sp?.fund_option ?? ''
  const userFeePct: number    = sp?.fund_fee_pct ?? 0       // investment fee only from settings
  const userBalance: number   = sp?.current_balance ?? 0
  const userAge: number       = sp?.age ?? 40
  const retAge: number        = sp?.target_retirement_age ?? 65
  const yearsLeft             = Math.max(0, retAge - userAge)
  const annualContrib: number = (sp?.salary ?? 0) * ((sp?.employer_sg_rate ?? 12) / 100)
  const hasProfile            = !!userFundName && userBalance > 0

  const userCategory = useMemo(() => detectCategory(userOption), [userOption])
  const peers = useMemo(() =>
    ALL_OPTIONS.filter(o => o.category === userCategory)
      .sort((a, b) => {
        // sort by effective total fee rate at user balance, or fallback to invest fee
        if (userBalance > 0) return effectiveFeeRate(a, userBalance) - effectiveFeeRate(b, userBalance)
        return a.fee - b.fee
      }),
    [userCategory, userBalance]
  )

  // Find user's fund in peers — exact then fuzzy
  const userFundInPeers = useMemo(() => {
    if (!userFundName || !userOption) return undefined
    const fl = userFundName.toLowerCase(), ol = userOption.toLowerCase()
    return (
      peers.find(p => p.fund.toLowerCase() === fl && p.option.toLowerCase() === ol) ??
      peers.find(p => fl.includes(p.fund.toLowerCase().split(' ')[0]) &&
                      (p.option.toLowerCase().includes(ol.split(' ').slice(0,2).join(' ')) ||
                       ol.includes(p.option.toLowerCase().split(' ').slice(0,2).join(' '))))
    )
  }, [peers, userFundName, userOption])

  // Best fee / return
  const validPeers    = peers.filter(p => p.fee > 0 || p.restWarning)
  const bestFeePeer   = userBalance > 0
    ? [...validPeers].sort((a, b) => effectiveFeeRate(a, userBalance) - effectiveFeeRate(b, userBalance))[0]
    : peers.reduce((a, b) => a.fee < b.fee ? a : b, peers[0])
  const bestRetPeers  = peers.filter(p => p.ret10 !== null).sort((a, b) => (b.ret10 ?? 0) - (a.ret10 ?? 0))
  const bestRetPeer   = bestRetPeers[0]
  const bestNetPeer   = peers.filter(p => p.fee > 0 && p.ret10 !== null)
    .sort((a, b) => ((b.ret10 ?? 0) - b.fee) - ((a.ret10 ?? 0) - a.fee))[0]

  // 20yr fee drag vs best-fee peer
  const userTotalFeeRate = userBalance > 0
    ? totalFeeAtBalance(userFundInPeers ?? { fee: userFeePct, adminFixed: 0, adminPct: 0, adminCap: null } as any, userBalance) / userBalance
    : userFeePct
  const bestFeeRate = bestFeePeer && userBalance > 0
    ? effectiveFeeRate(bestFeePeer, userBalance)
    : (bestFeePeer?.fee ?? 0)
  const feeDrag20yr = useMemo(() => {
    if (!hasProfile || userTotalFeeRate <= bestFeeRate + 0.001) return null
    return calcFeeDrag(userBalance, userTotalFeeRate * 100, bestFeeRate * 100, 20, annualContrib)
  }, [userBalance, userTotalFeeRate, bestFeeRate, hasProfile, annualContrib])

  const displayPeers = showAll ? peers : peers.slice(0, 8)
  const allocInfo    = ALLOC_INFO[userCategory]
  const c: React.CSSProperties   = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const sl: React.CSSProperties  = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 } as any
  const tabBtn = (t: typeof activeTab): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
    background: activeTab === t ? '#0F1E3C' : 'white',
    color: activeTab === t ? 'white' : 'rgba(15,30,60,0.6)',
    boxShadow: activeTab === t ? 'none' : '0 0 0 1px rgba(15,30,60,0.12)',
  })

  if (!hasProfile) {
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ ...c, textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Set up your profile first</h3>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Enter your fund, option and balance in Settings to see a fully personalised like-for-like comparison.
          </p>
          <a href="/settings" style={{ background: '#0F1E3C', color: 'white', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Go to Settings →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1060 }}>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={tabBtn('comparison')} onClick={() => setActiveTab('comparison')}>Your fund comparison</button>
        <button style={tabBtn('education')}  onClick={() => setActiveTab('education')}>Investment option guide</button>
        <button style={tabBtn('research')}   onClick={() => setActiveTab('research')}>Active vs passive research</button>
      </div>

      {/* ═══ TAB 1 — COMPARISON ═══════════════════════════════════════════════ */}
      {activeTab === 'comparison' && (<>

        {/* Hero banner */}
        <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your fund</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>{userFundName}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{userOption}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{categoryLabel(userCategory, userOption)}</span>
                {allocInfo && <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>~{allocInfo.growth} growth assets</span>}
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{yearsLeft} yrs to retirement</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Investment fee</div>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: feeColor(userFeePct / 100) }}>{userFeePct}%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{fmt(userBalance * userFeePct / 100)}/yr on {fmt(userBalance)}</div>
              </div>
              {userBalance > 0 && userFundInPeers && (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total annual cost</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: 'white' }}>{fmt(totalFeeAtBalance(userFundInPeers, userBalance))}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>investment + admin fees</div>
                </div>
              )}
              {feeDrag20yr && (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>20-yr fee drag</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: '#EF4444' }}>−{fmt(feeDrag20yr.drag)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>vs {bestFeePeer?.fund}</div>
                </div>
              )}
              {!feeDrag20yr && userFundInPeers && (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Fee rank</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: '#00D4AA' }}>✓ Top tier</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>lowest-cost in category</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk prompt */}
        {allocInfo && (
          <div style={{ background: yearsLeft > 20 ? 'rgba(83,74,183,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${yearsLeft > 20 ? 'rgba(83,74,183,0.2)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: '#0F1E3C', marginBottom: 4, fontSize: 14 }}>
              {yearsLeft > 20 ? `⚡ ${yearsLeft} years to retirement — are you maximising growth?` : `⚠ ${yearsLeft} years to retirement — consider your risk exposure`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
              <strong>{userOption}</strong> holds ~<strong>{allocInfo.growth} growth assets</strong>. {allocInfo.desc}
              {yearsLeft > 20 && !['highgrowth-active','balanced-indexed','highgrowth-sri'].includes(userCategory) && (
                <> With {yearsLeft} years ahead, you have the <em>ability</em> to sustain a higher-growth strategy — research consistently shows growth options outperform over 20+ year horizons despite short-term volatility.</>
              )}
              {yearsLeft <= 10 && userCategory === 'highgrowth-active' && (
                <> With {yearsLeft} years to retirement, a major drawdown in a 100% equities option could significantly impact your retirement balance. Consider whether a more balanced allocation suits your situation.</>
              )}
            </div>
          </div>
        )}

        {/* Three insight cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          <div style={{ ...c, borderLeft: '3px solid #00D4AA' }}>
            <div style={sl}>Lowest total cost in your category</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestFeePeer?.fund}</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestFeePeer?.option}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#00D4AA' }}>
              {userBalance > 0 ? fmt(totalFeeAtBalance(bestFeePeer!, userBalance)) + '/yr' : `${(bestFeePeer?.fee ?? 0) * 100}%`}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
              {userFundInPeers && userBalance > 0
                ? `saves ${fmt(totalFeeAtBalance(userFundInPeers, userBalance) - totalFeeAtBalance(bestFeePeer!, userBalance))}/yr vs your fund`
                : 'total fees (invest + admin)'}
            </div>
            {feeDrag20yr && <div style={{ marginTop: 8, fontSize: 11, color: '#059669', lineHeight: 1.5 }}>Over 20 years: <strong>{fmt(feeDrag20yr.drag)} more</strong> at retirement</div>}
          </div>

          <div style={{ ...c, borderLeft: '3px solid #534AB7' }}>
            <div style={sl}>Best 10-yr return in your category</div>
            {bestRetPeer ? (<>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestRetPeer.fund}</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestRetPeer.option}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#534AB7' }}>{((bestRetPeer.ret10 ?? 0) * 100).toFixed(1)}% p.a.</div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                {userFundInPeers?.ret10
                  ? `vs your fund's ${(userFundInPeers.ret10 * 100).toFixed(1)}% — ${(((bestRetPeer.ret10 ?? 0) - userFundInPeers.ret10) * 100).toFixed(1)}% gap`
                  : '10-year net return to 30 Jun 2025'}
              </div>
            </>) : (
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>Insufficient 10yr data for this category — check fund website for historical returns.</div>
            )}
          </div>

          <div style={{ ...c, borderLeft: '3px solid #F59E0B' }}>
            <div style={sl}>Best net value (return − fee)</div>
            {bestNetPeer ? (<>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{bestNetPeer.fund}</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)', marginBottom: 10 }}>{bestNetPeer.option}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: '#D97706' }}>
                {(((bestNetPeer.ret10 ?? 0) - bestNetPeer.fee) * 100).toFixed(2)}% net
              </div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
                {userFundInPeers?.ret10 ? `vs your ~${((userFundInPeers.ret10 - userFundInPeers.fee) * 100).toFixed(2)}% net` : '10yr return minus invest fee'}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Net return = best single measure of fund value after costs.</div>
            </>) : (
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>Insufficient return data for this category.</div>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div style={c}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={sl}>{categoryLabel(userCategory, userOption)} — {peers.length} options</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
                Sorted by total annual cost at {fmt(userBalance)} balance · Fees from PDS/spreadsheet to Jun 2026
              </div>
            </div>
          </div>

          {/* Like-for-like notice */}
          {(() => {
            const notices: string[] = []
            if (userCategory === 'highgrowth-active' && userOption.toLowerCase().includes('indexed')) {
              notices.push("You're in an indexed shares option (near 100% equities). This compares you against other high-growth and indexed shares options — a fair like-for-like comparison. Active balanced funds are excluded as they have different risk profiles.")
            }
            if (userCategory === 'balanced-active' && peers.some(p => p.category === 'balanced-indexed')) {
              // Don't mix indexed and active in the same view — they have different fee structures
            }
            if (peers.some((p: any) => p.restWarning)) {
              notices.push("REST indexed options use derivative contracts (total return swaps) with a hidden effective cost of ~0.20–0.35% on international holdings. The 0% stated invest fee is not the true cost.")
            }
            return notices.map((n, i) => (
              <div key={i} style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                ℹ️ {n}
              </div>
            ))
          })()}

          {/* REST warning */}
          {['balanced-indexed'].includes(userCategory) && (
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
              <strong>⚠ REST "0% fee" note:</strong> REST's indexed options use derivative contracts (total return swaps) rather than directly owning shares. The international benchmark assumes worst-case tax treatment, creating a hidden effective cost of ~0.20–0.35% on international holdings. True effective fee is estimated at 0.14–0.24% — not zero. Also introduces counterparty risk.
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {[
                    { l: '#', a: 'left' }, { l: 'Fund', a: 'left' }, { l: 'Option', a: 'left' },
                    { l: 'Type', a: 'left' }, { l: 'Invest fee', a: 'right' },
                    { l: `Admin/yr (${fmtShort(userBalance)})`, a: 'right' },
                    { l: `Total/yr (${fmtShort(userBalance)})`, a: 'right' },
                    { l: '1yr FY25', a: 'right' }, { l: '10yr', a: 'right' },
                    { l: 'ESG', a: 'center' }, { l: 'APRA', a: 'right' },
                  ].map(h => (
                    <th key={h.l} style={{ textAlign: h.a as any, padding: '6px 8px', fontSize: 10, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayPeers.map((fund, i) => {
                  const isUser = userFundInPeers === fund
                  const isBestFee = fund === bestFeePeer
                  const isBestRet = fund === bestRetPeer
                  const adminAmt = adminAtBalance(fund, userBalance)
                  const totalAmt = totalFeeAtBalance(fund, userBalance)
                  const userTotal = userFundInPeers ? totalFeeAtBalance(userFundInPeers, userBalance) : 0
                  const saving = userTotal - totalAmt
                  const hasESG = fund.esg !== 'None' && !fund.esg.startsWith('Partial')
                  const partialESG = fund.esg.startsWith('Partial')
                  return (
                    <tr key={`${fund.fund}-${fund.option}`} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: isUser ? 'rgba(0,212,170,0.04)' : 'transparent' }}>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', color: 'rgba(15,30,60,0.3)', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '9px 8px', fontWeight: 500, color: '#0F1E3C', whiteSpace: 'nowrap' }}>
                        {fund.fund}
                        {isUser && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(0,212,170,0.1)', color: '#065F46', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>YOUR FUND</span>}
                      </td>
                      <td style={{ padding: '9px 8px', fontSize: 12, color: 'rgba(15,30,60,0.65)', maxWidth: 180 }}>
                        <div>{fund.option.replace(' (effective fee ~0.15–0.24%)', '')}</div>
                        {fund.restWarning && <div style={{ fontSize: 10, color: '#D97706', marginTop: 1 }}>⚠ Derivative structure</div>}
                        {isBestFee && <span style={{ fontSize: 9, background: '#ECFDF5', color: '#065F46', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOWEST COST</span>}
                        {isBestRet && <span style={{ marginLeft: 4, fontSize: 9, background: '#EDE9FE', color: '#3C3489', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>TOP RETURN</span>}
                      </td>
                      <td style={{ padding: '9px 8px', fontSize: 11, color: 'rgba(15,30,60,0.5)', whiteSpace: 'nowrap' }}>
                        {fund.type}
                        {fund.passive && <span style={{ marginLeft: 4, fontSize: 9, background: 'rgba(83,74,183,0.1)', color: '#3C3489', padding: '1px 5px', borderRadius: 3 }}>INDEX</span>}
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', textAlign: 'right', color: feeColor(fund.fee) }}>
                        {fund.fee === 0
                          ? <span style={{ color: '#D97706' }}>~0%*</span>
                          : <span>
                              {`${(fund.fee * 100).toFixed(2)}%`}
                              {fund.feeForTotal && (
                                <span style={{ display: 'block', fontSize: 10, color: 'rgba(15,30,60,0.4)', fontFamily: 'sans-serif' }}>
                                  †+{((fund.feeForTotal - fund.fee) * 100).toFixed(2)}% levy
                                </span>
                              )}
                            </span>
                        }
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', textAlign: 'right', color: 'rgba(15,30,60,0.5)', fontSize: 12 }}>
                        {fmt(adminAmt)}/yr
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', textAlign: 'right' }}>
                        <span style={{ color: totalAmt <= (userTotal || Infinity) ? '#059669' : '#EF4444', fontWeight: isUser ? 600 : 400 }}>
                          {fund.fee === 0 && fund.restWarning ? <span style={{ color: '#D97706' }}>~{fmt(adminAmt + userBalance * 0.002)}/yr*</span> : `${fmt(totalAmt)}/yr`}
                        </span>
                        {!isUser && userTotal > 0 && saving > 50 && <div style={{ fontSize: 10, color: '#059669' }}>save {fmt(saving)}/yr</div>}
                        {!isUser && userTotal > 0 && saving < -50 && <div style={{ fontSize: 10, color: '#EF4444' }}>+{fmt(-saving)}/yr</div>}
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', textAlign: 'right', color: fund.ret1 ? (fund.ret1 >= 0.12 ? '#00D4AA' : '#0F1E3C') : 'rgba(15,30,60,0.3)' }}>
                        {fund.ret1 ? `${(fund.ret1 * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', textAlign: 'right', color: fund.ret10 ? (fund.ret10 >= 0.09 ? '#00D4AA' : '#0F1E3C') : 'rgba(15,30,60,0.3)' }}>
                        {fund.ret10 ? `${(fund.ret10 * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'center', fontSize: 12 }}>
                        {hasESG ? <span style={{ color: '#065F46' }}>✓</span> : partialESG ? <span style={{ color: '#D97706' }}>~</span> : <span style={{ color: 'rgba(15,30,60,0.25)' }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: fund.apra === 'passed' ? 'rgba(0,212,170,0.1)' : '#FEF2F2', color: fund.apra === 'passed' ? '#065F46' : '#991B1B' }}>
                          {fund.apra === 'passed' ? '✓ Pass' : '✗ Fail'}
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
              {showAll ? 'Show top 8 only' : `Show all ${peers.length} options`}
            </button>
          )}
          {peers.some(p => p.feeForTotal) && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
              † Some funds (e.g. Vanguard, AMP, Mercer, MLC) include a small levy (ORFR, Trustee Fee, or Expense Allowance) that is classified differently across PDSs. The invest fee % shown matches the fund's own website. The Total/yr column uses the adjusted rate for accurate cross-fund comparison — this is why Vanguard's invest fee shows 0.21% here but 0.54% total on their website (the difference is the 0.33% admin fee + 0.05% ORFR levy).
            </div>
          )}
        </div>

        {/* What this means */}
        {hasProfile && (
          <div style={{ ...c, marginTop: 20, background: 'rgba(15,30,60,0.03)', border: '1px solid rgba(15,30,60,0.08)' }}>
            <div style={sl}>What this means for you</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {feeDrag20yr ? (
                <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>💸 Fee savings opportunity</div>
                  <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
                    Switching to <strong>{bestFeePeer?.fund} {bestFeePeer?.option}</strong> would save{' '}
                    <strong style={{ color: '#059669' }}>{fmt(totalFeeAtBalance(userFundInPeers!, userBalance) - totalFeeAtBalance(bestFeePeer!, userBalance))}/yr</strong> in total fees.
                    Over 20 years with ongoing contributions, that compounds to <strong style={{ color: '#059669' }}>{fmt(feeDrag20yr.drag)} more</strong> at retirement.
                    A 1% fee difference has the same long-term impact as a 1% lower investment return.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 6 }}>✓ You're in a low-cost option</div>
                  <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.7, opacity: 0.9 }}>
                    Your total annual cost is at or near the lowest in this category. Focus your attention on contribution strategy and ensuring your asset allocation matches your {yearsLeft}-year time horizon.
                  </div>
                </div>
              )}
              <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(15,30,60,0.08)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 6 }}>📊 Total cost, not just invest fee</div>
                <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7 }}>
                  This table shows <strong>total annual cost</strong> — investment fee plus administration fee — at your balance of {fmt(userBalance)}.
                  Admin fees vary: Hostplus charges a flat $78/yr regardless of balance, while UniSuper charges 2% capped at $96/yr.
                  At high balances, a flat admin fee is better value. Research shows a 1% fee in retirement reduces annual income by 15% and inheritance by 23%.
                </div>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ═══ TAB 2 — EDUCATION ════════════════════════════════════════════════ */}
      {activeTab === 'education' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={c}>
            <div style={sl}>Investment option types — asset allocation guide</div>
            {[
              { name: 'Conservative', growth: '30–50%', def: '50–70%', risk: 'Low', color: '#059669', desc: 'Suits people close to retirement or with low risk tolerance. Lower long-term returns.' },
              { name: 'Balanced', growth: '50–75%', def: '25–50%', risk: 'Medium', color: '#00D4AA', desc: 'Most common default (MySuper). Moderate risk and return. Mix of shares, bonds, property.' },
              { name: 'Growth', growth: '75–90%', def: '10–25%', risk: 'Med-High', color: '#D97706', desc: 'Higher equity weighting. Better long-term returns. Suits 10+ year horizons.' },
              { name: 'High Growth / Indexed Shares', growth: '90–100%', def: '0–10%', risk: 'High', color: '#EF4444', desc: 'Near 100% equities. Maximum growth. Can fall 30–45% in a crash but recovers over time.' },
              { name: 'High Growth SRI', growth: '85–100%', def: '0–15%', risk: 'High', color: '#8B5CF6', desc: 'High growth with ethical screens. Excludes coal, tobacco, weapons, and other harmful industries.' },
            ].map(opt => (
              <div key={opt.name} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${opt.color}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C' }}>{opt.name}</div>
                  <span style={{ fontSize: 11, background: 'rgba(15,30,60,0.06)', padding: '2px 8px', borderRadius: 12, color: 'rgba(15,30,60,0.6)' }}>{opt.risk}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Growth: <strong style={{ color: opt.color }}>{opt.growth}</strong></span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>Defensive: {opt.def}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.5 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={c}>
              <div style={sl}>The 3-factor risk framework (Ability / Willingness / Need)</div>
              {[
                { f: 'Ability', icon: '⏳', desc: 'Can your time horizon sustain multiple crashes? A 25-year-old has the ability to hold 100% equities — they have 40 years to recover. A 60-year-old does not.' },
                { f: 'Willingness', icon: '🧠', desc: 'Will you stay the course when markets fall 40%? The best strategy only works if you don\'t panic-sell. A lower-growth option you hold beats a high-growth option you abandon mid-crash.' },
                { f: 'Need', icon: '🎯', desc: "Do you actually need more risk? If you already have enough for your retirement goal, taking excess risk for no extra benefit isn't rational — you have no need to take risk." },
              ].map(f => (
                <div key={f.f} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0F1E3C', marginBottom: 3 }}>{f.f}</div><div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
            <div style={c}>
              <div style={sl}>Long-run returns by asset class (Vanguard, to Jun 2023)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Asset class', '10yr', '20yr', '30yr'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Asset class' ? 'left' : 'right', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { n: 'Australian shares',    ten: '8.8%', twen: '9.0%', thir: '9.2%', hi: true },
                    { n: 'International shares', ten: '13.2%', twen: '8.4%', thir: '7.5%', hi: true },
                    { n: 'Australian property',  ten: '7.7%', twen: '5.2%', thir: '7.3%', hi: false },
                    { n: 'Australian bonds',     ten: '2.4%', twen: '4.2%', thir: '5.5%', hi: false },
                    { n: 'Cash',                 ten: '1.7%', twen: '3.5%', thir: '4.2%', hi: false },
                  ].map(r => (
                    <tr key={r.n} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                      <td style={{ padding: '7px 8px', color: '#0F1E3C', fontSize: 12 }}>{r.n}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.hi ? '#00D4AA' : 'rgba(15,30,60,0.5)' }}>{r.ten}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.hi ? '#00D4AA' : 'rgba(15,30,60,0.5)' }}>{r.twen}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', textAlign: 'right', color: r.hi ? '#00D4AA' : 'rgba(15,30,60,0.5)' }}>{r.thir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 8 }}>Past performance does not indicate future returns.</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3 — RESEARCH ═════════════════════════════════════════════════ */}
      {activeTab === 'research' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={c}>
            <div style={sl}>What the research says about active vs passive</div>
            {[
              { stat: '84%', desc: 'of active Australian funds underperformed the market over 15 years', src: 'SPIVA Scorecard, Dec 2022', color: '#EF4444' },
              { stat: '$85k+', desc: 'retirement balance difference from a 1% fee gap over a 40-year working life', src: 'MoneySmart calculator, Lazy Koala', color: '#EF4444' },
              { stat: '15%', desc: 'reduction in annual retirement income from a 1% fee during the drawdown phase', src: 'Mahaney (2023), Journal of Retirement', color: '#EF4444' },
              { stat: '23%', desc: 'reduction in inheritance amount from a 1% fee in retirement', src: 'Mahaney (2023)', color: '#EF4444' },
              { stat: '~1%', desc: 'extra annual return from going 100% equities vs 80/20 — same impact as a 1% fee difference', src: 'Vanguard 1926–2021 allocation data', color: '#D97706' },
            ].map(item => (
              <div key={item.stat} style={{ display: 'flex', gap: 14, padding: '10px 14px', background: 'rgba(15,30,60,0.03)', borderRadius: 10, marginBottom: 10 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: item.color, flexShrink: 0, minWidth: 56 }}>{item.stat}</div>
                <div>
                  <div style={{ fontSize: 13, color: '#0F1E3C', lineHeight: 1.6, marginBottom: 3 }}>{item.desc}</div>
                  <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>{item.src}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={c}>
              <div style={sl}>Active vs indexed — side by side</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['', 'Active', 'Indexed'].map(h => (
                    <th key={h} style={{ textAlign: h === '' ? 'left' : 'center', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { row: 'Goal', active: 'Beat market benchmark', indexed: 'Match market benchmark' },
                    { row: 'Typical invest fee', active: '0.50–1.00%', indexed: '0.02–0.15%' },
                    { row: 'Private equity / infrastructure', active: '✓ Often included', indexed: '✗ Usually excluded' },
                    { row: 'Unlisted assets', active: '✓ Improves risk-adjusted return', indexed: '✗ Listed assets only' },
                    { row: 'Long-run track record', active: '16% beat market over 15yr', indexed: 'Matches market by design' },
                    { row: 'Best for', active: 'Risk-averse investors wanting diversification', indexed: 'Long horizons, fee-sensitive' },
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
              <div style={sl}>Indexed options — index and ESG comparison</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                  {['Fund', 'AU index', 'Intl index', 'ESG'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    { f: 'AustralianSuper', au: 'MSCI AU 300',     intl: 'MSCI World ex-AU',    esg: 'Partial', w: false },
                    { f: 'Hostplus',         au: 'S&P/ASX 200',     intl: 'MSCI World ex-AU',    esg: 'Weapons only', w: false },
                    { f: 'ART',             au: 'MSCI AU 300',     intl: 'MSCI ACWI ex-AU',     esg: 'Tobacco + munitions', w: false },
                    { f: 'Aware Super',     au: 'Custom MSCI AU',  intl: 'Custom MSCI World',   esg: '✓ Strong screens', w: false },
                    { f: 'REST',            au: 'S&P/ASX 300',     intl: 'MSCI World ex-AU',    esg: 'Tobacco only', w: true },
                    { f: 'Vanguard Super',  au: 'Not disclosed',   intl: 'Not disclosed',       esg: 'None', w: false },
                  ].map(r => (
                    <tr key={r.f} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: r.w ? '#FFFBEB' : 'transparent' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 500, color: '#0F1E3C' }}>{r.f}{r.w && <span style={{ marginLeft: 4, fontSize: 10, color: '#D97706' }}>⚠</span>}</td>
                      <td style={{ padding: '7px 8px', color: 'rgba(15,30,60,0.65)', fontSize: 11 }}>{r.au}</td>
                      <td style={{ padding: '7px 8px', color: 'rgba(15,30,60,0.65)', fontSize: 11 }}>{r.intl}</td>
                      <td style={{ padding: '7px 8px', color: r.esg.includes('Strong') ? '#065F46' : r.esg.includes('Partial') ? '#D97706' : 'rgba(15,30,60,0.5)', fontSize: 11 }}>{r.esg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 10, fontSize: 11, color: '#78350F', background: '#FFFBEB', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                ⚠ <strong>REST:</strong> Uses derivative contracts (total return swaps). Hidden cost ~0.20–0.35% on international holdings. True effective fee: 0.14–0.24%, not 0%.
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(15,30,60,0.45)', lineHeight: 1.6, background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
        <strong style={{ color: 'rgba(15,30,60,0.6)' }}>Data sources — all fees verified from fund PDSs.</strong>{' '}
        Investment fees shown are investment fees and costs plus transaction costs (total %) as disclosed in each fund's current PDS or fees page, sourced directly:{' '}
        <strong>Hostplus</strong> Fees &amp; Costs Guide 30 Sep 2025 (hostplus.com.au/pds);{' '}
        <strong>AustralianSuper</strong> Fees &amp; Costs 30 May 2026 (australiansuper.com/PDS);{' '}
        <strong>Australian Retirement Trust</strong> fees page Jun 2026 (australianretirementtrust.com.au/investments/fees);{' '}
        <strong>UniSuper</strong> investment costs page Jun 2024 (unisuper.com.au/investments/our-investment-options/investment-costs);{' '}
        <strong>Aware Super</strong> fees page 30 Jun 2025 (aware.com.au/member/what-we-offer/fees-and-costs);{' '}
        <strong>HESTA</strong> fees page 30 Jun 2025 (hesta.com.au/members/your-superannuation/fees-and-costs);{' '}
        <strong>Cbus</strong> MySuper dashboard 30 Jun 2025 (cbussuper.com.au/fees);{' '}
        <strong>Vanguard Super</strong> PDS Jun 2025 (vanguard.com.au).{' '}
        For Hostplus active options: invest fees shown <em>exclude</em> performance fees (variable; historically up to 0.37–0.41% p.a. additional — see fund PDS for details).{' '}
        Vanguard invest fee (0.21%) excludes admin fee (0.33% capped $840/yr) — total at balances under $255k is 0.54% p.a.{' '}
        Returns are net of investment fees and tax, sourced from SuperRatings crediting rate data to 30 June 2025.{' '}
        Fees change annually — always verify in your fund's current PDS before making any decision.{' '}
        General information only. This comparison does not constitute financial advice. Past performance is not a reliable indicator of future returns.{' '}
        Before switching funds consider exit fees, insurance implications, and seek advice from a licensed financial adviser.
      </div>
    </div>
  )
}
