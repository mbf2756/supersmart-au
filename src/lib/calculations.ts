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
  grade: 'excellent' | 'good' | 'needs-attention' | 'poor'
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
}): SuperScore {
  const breakdown = [
    {
      key: 'performance',
      label: 'Fund performance',
      sublabel: params.apraStatus === 'passed' ? 'Passed 2025 APRA benchmark test' : 'Failed or unknown APRA status',
      score: params.apraStatus === 'passed' ? 20 : params.apraStatus === 'failed' ? 5 : 12,
      maxScore: 20,
      status: (params.apraStatus === 'passed' ? 'good' : params.apraStatus === 'failed' ? 'bad' : 'ok') as 'good' | 'ok' | 'bad',
    },
    {
      key: 'fees',
      label: 'Fund fees',
      sublabel: `${params.fundFeePct}% p.a. — ${params.fundFeePct <= 0.40 ? 'excellent' : params.fundFeePct <= 0.65 ? 'competitive' : 'above average'}`,
      score: params.fundFeePct <= 0.40 ? 20 : params.fundFeePct <= 0.65 ? 14 : params.fundFeePct <= 1.0 ? 9 : 4,
      maxScore: 20,
      status: (params.fundFeePct <= 0.65 ? 'good' : params.fundFeePct <= 1.0 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad',
    },
    {
      key: 'option',
      label: 'Investment option',
      sublabel: `${params.investmentOption} — ${params.age < 50 ? 'growth focus appropriate' : 'consider reviewing for retirement'}`,
      score: 15,
      maxScore: 20,
      status: 'ok' as 'good' | 'ok' | 'bad',
    },
    {
      key: 'contributions',
      label: 'Contribution strategy',
      sublabel: params.hasCarryForwardUnused ? 'Carry-forward cap available — not yet used' : 'Contributions on track',
      score: params.hasCarryForwardUnused ? 6 : 18,
      maxScore: 20,
      status: (params.hasCarryForwardUnused ? 'bad' : 'good') as 'good' | 'ok' | 'bad',
    },
    {
      key: 'consolidation',
      label: 'Account consolidation',
      sublabel: params.accountCount === 1 ? 'Single fund — no fee duplication' : `${params.accountCount} funds — consolidation recommended`,
      score: params.accountCount === 1 ? 20 : Math.max(4, 20 - (params.accountCount - 1) * 8),
      maxScore: 20,
      status: (params.accountCount === 1 ? 'good' : params.accountCount === 2 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad',
    },
  ]
  const total = breakdown.reduce((s, b) => s + b.score, 0)
  const grade = total >= 80 ? 'excellent' : total >= 60 ? 'good' : total >= 40 ? 'needs-attention' : 'poor'
  const label = total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Needs attention' : 'Poor'
  return { total, grade, label, breakdown }
}
