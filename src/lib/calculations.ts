// ─── FORMATTING ──────────────────────────────────────────

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
  }).format(n)
}

export function fmtShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return fmt(n)
}

export function fmtPct(n: number, decimals = 2): string {
  return `${n.toFixed(decimals)}%`
}

// ─── TAX ────────────────────────────────────────────────

export function getMarginalRate(salary: number): number {
  if (salary <= 18200) return 0
  if (salary <= 45000) return 0.19
  if (salary <= 120000) return 0.325
  if (salary <= 180000) return 0.37
  return 0.45
}

// ─── CONTRIBUTIONS ───────────────────────────────────────

export const CONCESSIONAL_CAP_2526 = 30000
export const NCC_CAP_2526 = 120000
export const TRANSFER_BALANCE_CAP = 2_000_000
export const DIV296_THRESHOLD = 3_000_000
export const CARRY_FORWARD_TSB_LIMIT = 500_000

export function calcConcessionalCap(salary: number, sgRate: number, extraContrib: number) {
  const sgAmount = salary * (sgRate / 100)
  const totalUsed = sgAmount + extraContrib
  const headroom = Math.max(0, CONCESSIONAL_CAP_2526 - totalUsed)
  const marginal = getMarginalRate(salary)
  const taxSaving = headroom * (marginal - 0.15)
  return { cap: CONCESSIONAL_CAP_2526, sgAmount, totalUsed, headroom, taxSaving: Math.max(0, taxSaving) }
}

export function calcSalarySacrificeSaving(salary: number, monthlyAmount: number) {
  const annual = monthlyAmount * 12
  const marginal = getMarginalRate(salary)
  const taxSaving = annual * (marginal - 0.15)
  const takeHomeCost = annual - taxSaving
  const div293Risk = salary > 250_000
  return { annual, taxSaving: Math.max(0, taxSaving), takeHomeCost, div293Risk }
}

// ─── FEE DRAG ────────────────────────────────────────────

export function calcFeeDrag(
  balance: number,
  currentFeePct: number,
  comparatorFeePct: number,
  years: number,
  annualContrib = 0,
  returnRate = 0.07
) {
  let you = balance
  let low = balance
  for (let i = 0; i < years; i++) {
    you = (you + annualContrib) * (1 + returnRate - currentFeePct / 100)
    low = (low + annualContrib) * (1 + returnRate - comparatorFeePct / 100)
  }
  const drag = low - you
  const annualDiff = balance * Math.abs(currentFeePct - comparatorFeePct) / 100
  return { youBalance: you, lowFeeBalance: low, drag, annualDiff }
}

// ─── PROJECTION ──────────────────────────────────────────

export function projectBalance(
  currentBalance: number,
  annualContrib: number,
  returnRate: number,
  years: number
): number {
  let bal = currentBalance
  for (let i = 0; i < years; i++) {
    bal = (bal + annualContrib) * (1 + returnRate)
  }
  return bal
}

export function yearsToThreshold(
  balance: number,
  annualContrib: number,
  returnRate: number,
  threshold: number
): number | null {
  let bal = balance
  for (let i = 0; i < 50; i++) {
    bal = (bal + annualContrib) * (1 + returnRate)
    if (bal >= threshold) return i + 1
  }
  return null
}

// ─── CARRY FORWARD ───────────────────────────────────────

export interface CarryForwardYear {
  year: string
  cap: number
  used: number
  unused: number
  expiry: string
  isExpiringSoon: boolean
}

export function buildCarryForwardYears(
  sgContribsByYear: number[] = [16200, 16200, 14800, 6200, 0]
): CarryForwardYear[] {
  const years = [
    { year: '2020–21', cap: 27500, expiry: '30 Jun 2026', isExpiringSoon: true },
    { year: '2021–22', cap: 27500, expiry: '30 Jun 2027', isExpiringSoon: false },
    { year: '2022–23', cap: 27500, expiry: '30 Jun 2028', isExpiringSoon: false },
    { year: '2023–24', cap: 30000, expiry: '30 Jun 2029', isExpiringSoon: false },
    { year: '2024–25', cap: 30000, expiry: '30 Jun 2030', isExpiringSoon: false },
  ]
  return years.map((y, i) => ({
    ...y,
    used: sgContribsByYear[i] ?? 0,
    unused: Math.max(0, y.cap - (sgContribsByYear[i] ?? 0)),
  }))
}

// ─── DIVISION 296 ────────────────────────────────────────

export function calcDiv296Exposure(balance: number, annualEarningsRate = 0.07) {
  if (balance <= DIV296_THRESHOLD) return { exposed: false, annualTax: 0, excessBalance: 0 }
  const excessBalance = balance - DIV296_THRESHOLD
  const proportionAbove = excessBalance / balance
  const estimatedEarnings = balance * annualEarningsRate
  const attributableEarnings = estimatedEarnings * proportionAbove
  const annualTax = attributableEarnings * 0.15
  return { exposed: true, annualTax, excessBalance, proportionAbove, attributableEarnings }
}

// ─── SPOUSE CONTRIBUTIONS ────────────────────────────────

export function calcSpouseOffset(
  spouseIncome: number,
  contributionAmount: number,
  spouseTSB: number
) {
  if (spouseTSB >= TRANSFER_BALANCE_CAP) {
    return { eligible: false, offset: 0, reason: 'Spouse TSB exceeds $2M cap' }
  }
  if (spouseIncome > 40000) {
    return { eligible: false, offset: 0, reason: 'Spouse income above $40,000 threshold' }
  }
  const effectiveContrib = Math.min(contributionAmount, 3000)
  let offset = 0
  if (spouseIncome <= 37000) {
    offset = effectiveContrib * 0.18
  } else {
    const taper = (40000 - spouseIncome) / 3000
    offset = effectiveContrib * 0.18 * taper
  }
  return { eligible: true, offset: Math.min(offset, 540), reason: null }
}

// ─── SUPER SCORE ─────────────────────────────────────────

export interface SuperScore {
  total: number
  grade: 'excellent' | 'good' | 'fair' | 'needs-work' | 'poor'
  label: string
  breakdown: Array<{
    key: string
    label: string
    sublabel: string
    score: number
    maxScore: number
    status: 'good' | 'ok' | 'bad'
  }>
}

export function calcSuperScore(params: {
  fundFeePct: number
  apraStatus: 'passed' | 'failed' | 'unknown'
  investmentOption: string
  age: number
  hasCarryForwardUnused: boolean
  accountCount: number
  salary?: number
  makingVoluntaryContribs?: boolean
  netReturnRank?: 'top' | 'mid' | 'bottom' | 'unknown'
}): SuperScore {
  const {
    fundFeePct, apraStatus, investmentOption, age,
    hasCarryForwardUnused, accountCount,
    salary = 80000,
    makingVoluntaryContribs = false,
    netReturnRank = 'mid',
  } = params

  const yrsToRetire = Math.max(1, 65 - age)
  const opt = investmentOption.toLowerCase()
  const isIndexed     = opt.includes('indexed') || opt.includes('index ')
  const isHighGrowth  = opt.includes('high growth') || opt.includes('highgrowth')
  const isConservative = opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')
  const isCash        = opt.includes('cash')

  // ── 1. FEE EFFICIENCY /25 ────────────────────────────────────────────────
  // Score relative to best available fee in user's option category.
  // Rewards genuinely optimised options. Penalises relative overpaying.
  const bestAvailable = isIndexed ? 0.04 : isHighGrowth ? 0.26 : 0.41
  const feeGap = fundFeePct - bestAvailable
  const feeScore = feeGap <= 0.02 ? 25
    : feeGap <= 0.10 ? 20
    : feeGap <= 0.25 ? 14
    : feeGap <= 0.50 ? 8
    : feeGap <= 0.80 ? 4
    : 1

  const feeGapDollars = feeGap > 0 ? Math.round(feeGap / 100 * (salary * 3)) : 0 // rough 3x salary proxy
  const feeLabel = feeGap <= 0.02
    ? `${fundFeePct}% — near-optimal for this category`
    : feeGap <= 0.15
    ? `${fundFeePct}% — paying ~${(feeGap).toFixed(2)}% above the lowest-cost equivalent`
    : feeGap <= 0.40
    ? `${fundFeePct}% — paying significantly more than the low-cost alternative`
    : `${fundFeePct}% — well above the lowest-cost option in this category`

  // ── 2. INVESTMENT ALIGNMENT /25 ──────────────────────────────────────────
  // Is this option appropriate for the member's time horizon?
  // Key insight: most Australians are in Balanced when they should be in Growth/High Growth.
  let alignScore: number
  let alignLabel: string

  if (isCash) {
    alignScore = yrsToRetire > 5 ? 3 : 20
    alignLabel = yrsToRetire > 5
      ? 'Cash — too defensive for your time horizon. Missing years of compound growth.'
      : 'Cash — appropriate given proximity to retirement'
  } else if (isConservative) {
    alignScore = yrsToRetire >= 20 ? 5 : yrsToRetire >= 10 ? 10 : 22
    alignLabel = yrsToRetire >= 20
      ? `Conservative with ${yrsToRetire} years to go — likely costing you significant long-term growth`
      : yrsToRetire >= 10
      ? `Conservative with ${yrsToRetire} years to retirement — consider reviewing risk level`
      : 'Conservative — appropriate approaching retirement'
  } else if (isIndexed || isHighGrowth) {
    alignScore = yrsToRetire >= 15 ? 25 : yrsToRetire >= 7 ? 20 : 12
    alignLabel = yrsToRetire >= 15
      ? `${investmentOption} — strong alignment with your ${yrsToRetire}-year horizon`
      : yrsToRetire >= 7
      ? `${investmentOption} — reasonable for your time horizon`
      : `${investmentOption} — consider reducing risk ${yrsToRetire} years from retirement`
  } else {
    // Balanced / Growth
    alignScore = yrsToRetire >= 20 ? 12 : yrsToRetire >= 10 ? 18 : 22
    alignLabel = yrsToRetire >= 20
      ? `Balanced with ${yrsToRetire} years ahead — research shows growth options significantly outperform over 20+ year horizons`
      : yrsToRetire >= 10
      ? `Balanced — reasonable, though a growth option could improve long-term returns`
      : 'Balanced — appropriate for your time horizon'
  }

  // ── 3. CONTRIBUTION STRATEGY /20 ─────────────────────────────────────────
  // Penalise for carry-forward unused AND for no voluntary contributions
  let contribScore = 20
  const contribIssues: string[] = []

  if (hasCarryForwardUnused) {
    contribScore -= 10
    contribIssues.push('unused carry-forward cap')
  }
  if (!makingVoluntaryContribs && salary < 250000) {
    contribScore -= 6
    contribIssues.push('no salary sacrifice above SG')
  }
  contribScore = Math.max(2, contribScore)

  const contribLabel = contribIssues.length === 0
    ? 'Salary sacrifice active — maximising concessional contributions'
    : contribIssues.length === 1
    ? `${contribIssues[0].charAt(0).toUpperCase() + contribIssues[0].slice(1)} — opportunity to reduce tax`
    : `${contribIssues.join(' + ')} — significant tax-saving opportunities not being used`

  // ── 4. FUND QUALITY /15 ──────────────────────────────────────────────────
  // APRA pass is the minimum bar — not something to celebrate with full marks
  let qualityScore: number
  let qualityLabel: string

  if (apraStatus === 'failed') {
    qualityScore = 3
    qualityLabel = 'Failed 2025 APRA performance benchmark — fund must notify members'
  } else if (netReturnRank === 'top') {
    qualityScore = 15
    qualityLabel = 'Passed APRA test · Top quartile 7-year net return'
  } else if (netReturnRank === 'bottom') {
    qualityScore = 6
    qualityLabel = 'Passed APRA test · Below-median net return for this category'
  } else {
    qualityScore = 10
    // "Passed APRA" is expected minimum, not worth celebrating with high marks
    qualityLabel = 'Passed APRA test · Mid-table 7-year return — better options exist'
  }

  // ── 5. ACCOUNT STRUCTURE /15 ─────────────────────────────────────────────
  const structScore = accountCount === 1 ? 15 : accountCount === 2 ? 7 : 2
  const structLabel = accountCount === 1
    ? 'Single account — no duplicate fees or insurance'
    : `${accountCount} super accounts — duplicate admin fees and insurance premiums`

  const breakdown: SuperScore['breakdown'] = [
    {
      key: 'fees',
      label: 'Fee efficiency',
      sublabel: feeLabel,
      score: feeScore,
      maxScore: 25,
      status: feeScore >= 20 ? 'good' : feeScore >= 12 ? 'ok' : 'bad',
    },
    {
      key: 'alignment',
      label: 'Investment alignment',
      sublabel: alignLabel,
      score: alignScore,
      maxScore: 25,
      status: alignScore >= 20 ? 'good' : alignScore >= 12 ? 'ok' : 'bad',
    },
    {
      key: 'contributions',
      label: 'Contribution strategy',
      sublabel: contribLabel,
      score: contribScore,
      maxScore: 20,
      status: contribScore >= 16 ? 'good' : contribScore >= 10 ? 'ok' : 'bad',
    },
    {
      key: 'quality',
      label: 'Fund quality',
      sublabel: qualityLabel,
      score: qualityScore,
      maxScore: 15,
      status: qualityScore >= 13 ? 'good' : qualityScore >= 8 ? 'ok' : 'bad',
    },
    {
      key: 'structure',
      label: 'Account structure',
      sublabel: structLabel,
      score: structScore,
      maxScore: 15,
      status: structScore >= 14 ? 'good' : structScore >= 8 ? 'ok' : 'bad',
    },
  ]

  const total = breakdown.reduce((s, b) => s + b.score, 0)

  // Tighter grade bands — most people should land in Fair or Needs Work
  const grade = total >= 80 ? 'excellent'
    : total >= 65 ? 'good'
    : total >= 45 ? 'fair'
    : total >= 30 ? 'needs-work'
    : 'poor'

  const label = total >= 80 ? 'Excellent'
    : total >= 65 ? 'Good'
    : total >= 45 ? 'Fair'
    : total >= 30 ? 'Needs work'
    : 'Poor'

  return { total, grade, label, breakdown }


}
