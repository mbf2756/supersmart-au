import {
  getMarginalRate, calcConcessionalCap, calcFeeDrag, calcSpouseOffset,
  calcDiv296Exposure, projectBalance, fmt, fmtShort,
  CONCESSIONAL_CAP_2526, DIV296_THRESHOLD, CARRY_FORWARD_TSB_LIMIT
} from './calculations'

export interface Opportunity {
  id: string
  icon: string
  title: string
  subtitle: string
  explanation: string
  impact: number          // dollar amount
  impactLabel: string     // e.g. "$87,000 by retirement" or "$1,080/year"
  impactType: 'retirement' | 'annual' | 'oneoff' | 'risk'
  priority: 'high' | 'medium' | 'low'
  category: 'fees' | 'contributions' | 'investment' | 'spouse' | 'structure' | 'tax'
  actionUrl: string
  actionLabel: string
  confidence: 'certain' | 'estimated' | 'indicative'
}

// Best-in-category fee benchmarks (from fund PDSs June 2026)
const BEST_FEE_BY_CATEGORY: Record<string, { fee: number; fund: string; option: string }> = {
  'indexed':          { fee: 0.02, fund: 'Hostplus', option: 'Indexed Shares' },
  'high-growth':      { fee: 0.04, fund: 'Hostplus', option: 'Indexed High Growth' },
  'balanced-active':  { fee: 0.41, fund: 'UniSuper', option: 'Balanced' },
  'growth':           { fee: 0.43, fund: 'UniSuper', option: 'Growth' },
  'conservative':     { fee: 0.37, fund: 'UniSuper', option: 'Conservative Balanced' },
  'cash':             { fee: 0.01, fund: 'Hostplus', option: 'Cash' },
}

function detectCategory(optionName: string): string {
  const opt = (optionName ?? '').toLowerCase()
  if (opt.includes('indexed') || opt.includes('index ')) return 'indexed'
  if (opt.includes('high growth') || opt.includes('highgrowth')) return 'high-growth'
  if (opt.includes('growth') && !opt.includes('balanced') && !opt.includes('conservative')) return 'growth'
  if (opt.includes('conservative') || opt.includes('capital stable') || opt.includes('stable')) return 'conservative'
  if (opt.includes('cash')) return 'cash'
  return 'balanced-active'
}

export interface OpportunityInputs {
  // From profile (locked)
  balance: number
  salary: number
  age: number
  retirementAge: number
  fundName: string
  fundOption: string
  fundFeePct: number
  employerSgRate: number
  accountCount: number

  // User-supplied extras (editable on action plan page)
  spouseIncome: number
  spouseTSB: number
  monthlySS: number           // current salary sacrifice amount
  carryForwardBalance: number // from profile or user-entered
  makingVoluntaryContribs: boolean
}

export function calcOpportunities(inputs: OpportunityInputs): Opportunity[] {
  const {
    balance, salary, age, retirementAge, fundOption, fundFeePct,
    employerSgRate, accountCount, spouseIncome, spouseTSB,
    monthlySS, carryForwardBalance, makingVoluntaryContribs
  } = inputs

  const yrs = Math.max(1, retirementAge - age)
  const annualContrib = salary * (employerSgRate / 100) + monthlySS * 12
  const sgAmount = salary * (employerSgRate / 100)
  const marginal = getMarginalRate(salary)
  const category = detectCategory(fundOption)
  const bestFee = BEST_FEE_BY_CATEGORY[category] ?? BEST_FEE_BY_CATEGORY['balanced-active']
  const capInfo = calcConcessionalCap(salary, employerSgRate, monthlySS * 12)

  const opportunities: Opportunity[] = []

  // ── 1. FEE SWITCH ────────────────────────────────────────────────────────
  if (fundFeePct > bestFee.fee + 0.1) {
    const drag = calcFeeDrag(balance, fundFeePct, bestFee.fee, yrs, annualContrib).drag
    if (drag > 5000) {
      const isIndexed = category === 'indexed' || fundFeePct > 0.5
      opportunities.push({
        id: 'fee-switch',
        icon: '💸',
        title: isIndexed
          ? `Switch to ${bestFee.fund} ${bestFee.option} (${bestFee.fee}% fee)`
          : `Switch to a lower-cost option in your category`,
        subtitle: `From ${fundFeePct}% → ${bestFee.fee}% (save ${(fundFeePct - bestFee.fee).toFixed(2)}% p.a.)`,
        explanation: `Your fund charges ${fundFeePct}% in investment fees. The lowest-cost equivalent option in your category is ${bestFee.fund} ${bestFee.option} at ${bestFee.fee}%. Over ${yrs} years, the fee difference compounds to a significant retirement balance gap.`,
        impact: Math.round(drag),
        impactLabel: `${fmtShort(drag)} extra at retirement`,
        impactType: 'retirement',
        priority: drag > 50000 ? 'high' : drag > 20000 ? 'medium' : 'low',
        category: 'fees',
        actionUrl: '/funds',
        actionLabel: 'Compare funds →',
        confidence: 'estimated',
      })
    }
  }

  // ── 2. SALARY SACRIFICE ───────────────────────────────────────────────────
  if (capInfo.headroom > 2000 && marginal > 0.19) {
    const maxMonthly = Math.floor(capInfo.headroom / 12)
    const annualTaxSaving = capInfo.headroom * (marginal - 0.15)
    const additionalToSuper = capInfo.headroom
    const retirementGain = projectBalance(balance + additionalToSuper, annualContrib, 0.07 - fundFeePct / 100, yrs)
      - projectBalance(balance, annualContrib, 0.07 - fundFeePct / 100, yrs)
    if (annualTaxSaving > 500) {
      opportunities.push({
        id: 'salary-sacrifice',
        icon: '📈',
        title: `Salary sacrifice up to ${fmt(maxMonthly)}/month`,
        subtitle: `${fmt(Math.round(capInfo.headroom))} of concessional cap unused`,
        explanation: `You have ${fmt(Math.round(capInfo.headroom))} of your $30,000 concessional cap unused. Salary sacrificing the full amount saves ${(marginal * 100).toFixed(0)}% income tax on that amount, costing you only ${(((marginal - 0.15) / marginal) * 100).toFixed(0)}% of the take-home reduction in real terms.`,
        impact: Math.round(annualTaxSaving),
        impactLabel: `${fmt(Math.round(annualTaxSaving))} tax saved/year`,
        impactType: 'annual',
        priority: annualTaxSaving > 3000 ? 'high' : 'medium',
        category: 'contributions',
        actionUrl: '/salary',
        actionLabel: 'Open salary sacrifice →',
        confidence: 'estimated',
      })
    }
  }

  // ── 3. CARRY-FORWARD CAP ─────────────────────────────────────────────────
  if (balance < CARRY_FORWARD_TSB_LIMIT && carryForwardBalance > 0) {
    const taxSaving = Math.min(carryForwardBalance, CONCESSIONAL_CAP_2526 + carryForwardBalance) * (marginal - 0.15)
    opportunities.push({
      id: 'carry-forward',
      icon: '⏰',
      title: 'Use your carry-forward concessional cap',
      subtitle: `${fmt(Math.round(carryForwardBalance))} unused cap available — 2020–21 expires 30 Jun 2026`,
      explanation: `Your total super balance is under $500,000, making you eligible to use unused concessional caps from the past 5 years. The oldest year (2020–21) expires permanently on 30 June 2026 — any unused amount is lost.`,
      impact: Math.round(taxSaving),
      impactLabel: `${fmt(Math.round(taxSaving))} potential tax saving`,
      impactType: 'oneoff',
      priority: 'high',
      category: 'contributions',
      actionUrl: '/contributions',
      actionLabel: 'Check carry-forward →',
      confidence: 'estimated',
    })
  }

  // ── 4. ACCOUNT CONSOLIDATION ─────────────────────────────────────────────
  if (accountCount > 1) {
    const adminFeePerAccount = 78  // Hostplus-equivalent annual admin fee
    const annualSaving = (accountCount - 1) * adminFeePerAccount
    const retirementSaving = projectBalance(0, annualSaving, 0.07, yrs) - 0
    opportunities.push({
      id: 'consolidate',
      icon: '🔗',
      title: `Consolidate your ${accountCount} super accounts into one`,
      subtitle: `Eliminate duplicate admin fees across ${accountCount} accounts`,
      explanation: `You have ${accountCount} super accounts, each charging separate admin fees and potentially separate insurance premiums. Consolidating into your primary fund eliminates these duplicate costs. Use MyGov → ATO → Super to find and transfer accounts.`,
      impact: Math.round(annualSaving),
      impactLabel: `${fmt(Math.round(annualSaving))} saved/year`,
      impactType: 'annual',
      priority: 'medium',
      category: 'structure',
      actionUrl: '/dashboard',
      actionLabel: 'Check MyGov for accounts →',
      confidence: 'estimated',
    })
  }

  // ── 5. SPOUSE CONTRIBUTION OFFSET ────────────────────────────────────────
  if (spouseIncome < 40000 && spouseTSB < 2_000_000) {
    const offsetResult = calcSpouseOffset(spouseIncome, 3000, spouseTSB)
    if (offsetResult.eligible && offsetResult.offset > 0) {
      opportunities.push({
        id: 'spouse-offset',
        icon: '👫',
        title: 'Contribute $3,000 to spouse\'s super for the tax offset',
        subtitle: `${fmt(Math.round(offsetResult.offset))} direct credit on your tax return`,
        explanation: `Because your spouse earns under $40,000, contributing $3,000 to their super from your after-tax income earns you a tax offset of ${fmt(Math.round(offsetResult.offset))} — a direct credit on your personal tax return (not a deduction).`,
        impact: Math.round(offsetResult.offset),
        impactLabel: `${fmt(Math.round(offsetResult.offset))} tax offset (certain)`,
        impactType: 'annual',
        priority: 'high',
        category: 'spouse',
        actionUrl: '/spouse',
        actionLabel: 'Open spouse analysis →',
        confidence: 'certain',
      })
    }
  }

  // ── 6. INVESTMENT ALIGNMENT ───────────────────────────────────────────────
  const opt = fundOption.toLowerCase()
  const isConservative = opt.includes('conservative') || opt.includes('cash') || opt.includes('stable')
  const isBalanced = opt.includes('balanced') && !opt.includes('high')
  if (yrs > 15 && (isConservative || (isBalanced && balance > 50000))) {
    const targetOption = yrs > 20 ? 'high growth' : 'growth'
    const currentReturn = 0.07 - fundFeePct / 100
    const higherReturn = (targetOption === 'high growth' ? 0.09 : 0.08) - 0.04 / 100
    const projCurrent = projectBalance(balance, annualContrib, currentReturn, yrs)
    const projGrowth  = projectBalance(balance, annualContrib, higherReturn, yrs)
    const gain = projGrowth - projCurrent
    if (gain > 10000) {
      opportunities.push({
        id: 'investment-align',
        icon: '🚀',
        title: `Switch to a ${targetOption} option`,
        subtitle: `With ${yrs} years to retirement, your option may be too conservative`,
        explanation: `Research shows ${targetOption} options significantly outperform balanced/conservative over 15+ year horizons, despite short-term volatility. With ${yrs} years until retirement, you have time to recover from market downturns.`,
        impact: Math.round(gain),
        impactLabel: `~${fmtShort(gain)} extra at retirement (estimated)`,
        impactType: 'retirement',
        priority: yrs > 20 && isConservative ? 'high' : 'medium',
        category: 'investment',
        actionUrl: '/funds',
        actionLabel: 'Compare options →',
        confidence: 'indicative',
      })
    }
  }

  // ── 7. DIVISION 296 ───────────────────────────────────────────────────────
  if (balance > 1_500_000) {
    const projAtRetirement = projectBalance(balance, annualContrib, 0.07, yrs)
    if (projAtRetirement > DIV296_THRESHOLD) {
      const excess = projAtRetirement - DIV296_THRESHOLD
      const proportionAbove = excess / projAtRetirement
      const annualTax = projAtRetirement * 0.07 * proportionAbove * 0.15
      opportunities.push({
        id: 'div296',
        icon: '⚠',
        title: 'Manage Division 296 exposure via contribution splitting',
        subtitle: `Your balance is projected to exceed $3M threshold`,
        explanation: `Division 296 tax (commencing 1 July 2026) applies a 15% additional tax on super earnings attributable to the portion above $3M. At your projected retirement balance of ${fmtShort(projAtRetirement)}, you will be significantly exposed. Contribution splitting to a spouse can slow the growth of your balance.`,
        impact: Math.round(annualTax),
        impactLabel: `~${fmt(Math.round(annualTax))}/year tax (at retirement balance)`,
        impactType: 'annual',
        priority: balance > 2_500_000 ? 'high' : 'medium',
        category: 'tax',
        actionUrl: '/div296',
        actionLabel: 'Model Div 296 exposure →',
        confidence: 'indicative',
      })
    }
  }

  // Sort by priority then impact
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return opportunities
    .sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority])
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      return b.impact - a.impact
    })
    .slice(0, 8)
}

export function calcRetirementReadiness(inputs: {
  balance: number; salary: number; age: number; retirementAge: number
  feePct: number; annualContrib: number; investmentOption: string
  makingVoluntaryContribs: boolean
}) {
  const { balance, salary, age, retirementAge, feePct, annualContrib, investmentOption, makingVoluntaryContribs } = inputs
  const yrs = Math.max(1, retirementAge - age)
  const projBalance = projectBalance(balance, annualContrib, 0.07 - feePct / 100, yrs)
  const projIncome = projBalance * 0.04
  const ASFA_COMFORTABLE = 51000
  const ASFA_MODEST = 31000

  const incomeScore = projIncome >= ASFA_COMFORTABLE ? 30
    : projIncome >= ASFA_MODEST + (ASFA_COMFORTABLE - ASFA_MODEST) * 0.75 ? 22
    : projIncome >= ASFA_MODEST ? 14 : 5

  const gap = Math.max(0, ASFA_COMFORTABLE - projIncome)
  const gapScore = gap === 0 ? 25 : gap < 5000 ? 20 : gap < 15000 ? 12 : gap < 25000 ? 6 : 0

  const contribRate = annualContrib / (salary || 1)
  const contribScore = makingVoluntaryContribs
    ? (contribRate > 0.20 ? 25 : contribRate > 0.15 ? 20 : 15)
    : (contribRate > 0.15 ? 18 : contribRate > 0.12 ? 12 : 8)

  const opt = investmentOption.toLowerCase()
  const isAggressive = opt.includes('high growth') || opt.includes('indexed')
  const isConservative = opt.includes('conservative') || opt.includes('cash')
  const suitScore = yrs > 20 ? (isAggressive ? 20 : isConservative ? 6 : 13)
    : yrs > 10 ? (isConservative ? 10 : 16) : 16

  const total = incomeScore + gapScore + contribScore + suitScore
  const grade = total >= 85 ? 'On Track' : total >= 65 ? 'Nearly There' : total >= 45 ? 'At Risk' : 'Action Required'
  const gradeColor = total >= 85 ? '#00D4AA' : total >= 65 ? '#F59E0B' : total >= 45 ? '#F97316' : '#EF4444'

  return {
    total, grade, gradeColor, projBalance, projIncome, gap,
    asfaComfortable: ASFA_COMFORTABLE,
    breakdown: [
      {
        label: 'Projected retirement income', score: incomeScore, max: 30,
        detail: `${fmt(Math.round(projIncome))}/yr projected at ${retirementAge} vs ${fmt(ASFA_COMFORTABLE)}/yr ASFA Comfortable standard`,
        status: incomeScore >= 22 ? 'good' : incomeScore >= 14 ? 'ok' : 'bad' as 'good' | 'ok' | 'bad',
      },
      {
        label: 'Retirement income gap', score: gapScore, max: 25,
        detail: gap > 0 ? `${fmt(Math.round(gap))}/yr shortfall — need ${fmtShort(gap / 0.04)} more in super` : 'No gap — projected to meet ASFA Comfortable standard',
        status: gapScore >= 20 ? 'good' : gapScore >= 12 ? 'ok' : 'bad' as 'good' | 'ok' | 'bad',
      },
      {
        label: 'Contribution strategy', score: contribScore, max: 25,
        detail: `Contributing ${(contribRate * 100).toFixed(1)}% of salary${makingVoluntaryContribs ? ' + voluntary contributions' : ' (employer SG only)'}`,
        status: contribScore >= 20 ? 'good' : contribScore >= 12 ? 'ok' : 'bad' as 'good' | 'ok' | 'bad',
      },
      {
        label: 'Investment suitability', score: suitScore, max: 20,
        detail: `${yrs} years to retire — ${isAggressive ? 'growth-oriented option is well-suited' : isConservative ? 'consider more growth exposure for this time horizon' : 'balanced option is reasonable'}`,
        status: suitScore >= 16 ? 'good' : suitScore >= 10 ? 'ok' : 'bad' as 'good' | 'ok' | 'bad',
      },
    ],
  }
}
