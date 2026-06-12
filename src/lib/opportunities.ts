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
  whyNow: string              // urgency — why act this financial year
  impact: number
  impactLabel: string
  impactType: 'retirement' | 'annual' | 'oneoff' | 'risk'
  steps: string[]             // 2-3 concrete action steps
  priority: 'high' | 'medium' | 'low'
  category: 'fees' | 'contributions' | 'investment' | 'spouse' | 'structure' | 'tax' | 'modelling'
  actionUrl: string
  actionLabel: string
  confidence: 'certain' | 'estimated' | 'indicative'
  timeToAct: string           // e.g. "Before 30 June" or "Anytime"
}

const BEST_FEE: Record<string, { fee: number; fund: string; option: string }> = {
  'indexed':         { fee: 0.02, fund: 'Hostplus', option: 'Indexed Shares' },
  'high-growth':     { fee: 0.04, fund: 'Hostplus', option: 'Indexed High Growth' },
  'balanced-active': { fee: 0.41, fund: 'UniSuper', option: 'Balanced' },
  'growth':          { fee: 0.43, fund: 'UniSuper', option: 'Growth' },
  'conservative':    { fee: 0.37, fund: 'UniSuper', option: 'Conservative Balanced' },
  'cash':            { fee: 0.01, fund: 'Hostplus', option: 'Cash' },
}

function detectCategory(option: string) {
  const o = (option ?? '').toLowerCase()
  if (o.includes('indexed') || o.includes('index ')) return 'indexed'
  if (o.includes('high growth') || o.includes('highgrowth')) return 'high-growth'
  if (o.includes('growth') && !o.includes('balanced') && !o.includes('conservative')) return 'growth'
  if (o.includes('conservative') || o.includes('capital stable') || o.includes('stable')) return 'conservative'
  if (o.includes('cash')) return 'cash'
  return 'balanced-active'
}

export interface OpportunityInputs {
  balance: number
  salary: number
  age: number
  retirementAge: number
  fundName: string
  fundOption: string
  fundFeePct: number
  employerSgRate: number
  accountCount: number
  spouseIncome: number
  spouseTSB: number
  monthlySS: number
  carryForwardBalance: number
  makingVoluntaryContribs: boolean
}

export function calcOpportunities(inputs: OpportunityInputs): Opportunity[] {
  const {
    balance, salary, age, retirementAge, fundName, fundOption, fundFeePct,
    employerSgRate, accountCount, spouseIncome, spouseTSB,
    monthlySS, carryForwardBalance, makingVoluntaryContribs
  } = inputs

  const yrs        = Math.max(1, retirementAge - age)
  const sgAmount   = salary * (employerSgRate / 100)
  const annualSS   = monthlySS * 12
  const annualContrib = sgAmount + annualSS
  const marginal   = getMarginalRate(salary)
  const category   = detectCategory(fundOption)
  const bestFee    = BEST_FEE[category] ?? BEST_FEE['balanced-active']
  const capInfo    = calcConcessionalCap(salary, employerSgRate, annualSS)
  const opt        = fundOption.toLowerCase()

  // Base projection (current path)
  const baseBalance = projectBalance(balance, annualContrib, (7 - fundFeePct) / 100, yrs)
  const baseIncome  = baseBalance * 0.04

  const opps: Opportunity[] = []

  // ── 1. FEE SWITCH ─────────────────────────────────────────────────────────
  if (fundFeePct > bestFee.fee + 0.1) {
    const drag = calcFeeDrag(balance, fundFeePct, bestFee.fee, yrs, annualContrib).drag
    if (drag > 5000) {
      opps.push({
        id: 'fee-switch',
        icon: '💸',
        title: `Reduce your investment fee from ${fundFeePct}% to ${bestFee.fee}%`,
        subtitle: `Switch to a lower-cost option — same index, fraction of the cost`,
        explanation: `${fundName} charges ${fundFeePct}% p.a. in investment fees — ${fmt(Math.round(balance * fundFeePct / 100))}/year on your current balance. The lowest-cost option in your category is ${bestFee.fund} ${bestFee.option} at ${bestFee.fee}%. That ${(fundFeePct - bestFee.fee).toFixed(2)}% gap compounds silently every year.`,
        whyNow: `Every year you wait costs you approximately ${fmt(Math.round(balance * (fundFeePct - bestFee.fee) / 100))} in unnecessary fees. Switching investment options is instant and free within most funds — no exit fees, no new paperwork.`,
        impact: Math.round(drag),
        impactLabel: `${fmtShort(drag)} extra at retirement`,
        impactType: 'retirement',
        steps: [
          `Log in to your ${fundName} member portal`,
          `Go to "Investment options" or "Change my investments"`,
          `Switch to an indexed option — it takes under 5 minutes`,
        ],
        priority: drag > 50000 ? 'high' : 'medium',
        category: 'fees',
        actionUrl: '/funds',
        actionLabel: 'Compare all funds →',
        confidence: 'estimated',
        timeToAct: 'Anytime — do it this week',
      })
    }
  }

  // ── 2. SALARY SACRIFICE ───────────────────────────────────────────────────
  if (capInfo.headroom > 2000 && marginal > 0.19) {
    const maxMonthly    = Math.floor(capInfo.headroom / 12)
    const annualTaxSave = capInfo.headroom * (marginal - 0.15)
    const netCostPerMo  = Math.round((capInfo.headroom / 12) * (1 - (marginal - 0.15)))
    opps.push({
      id: 'salary-sacrifice',
      icon: '📈',
      title: `Salary sacrifice up to ${fmt(maxMonthly)}/month — save ${fmt(Math.round(annualTaxSave))}/yr in tax`,
      subtitle: `${fmt(Math.round(capInfo.headroom))} of your $30,000 concessional cap is going unused`,
      explanation: `Every dollar you salary sacrifice is taxed at 15% inside super instead of your ${(marginal * 100).toFixed(0)}% marginal rate. Sacrificing ${fmt(maxMonthly)}/month only reduces your take-home pay by ${fmt(netCostPerMo)}/month — the rest is tax you were going to pay anyway.`,
      whyNow: `The concessional cap resets on 1 July each year — unused headroom is permanently lost. You cannot go back and sacrifice income you've already received, so this must be arranged before your next payroll.`,
      impact: Math.round(annualTaxSave),
      impactLabel: `${fmt(Math.round(annualTaxSave))} tax saved every year`,
      impactType: 'annual',
      steps: [
        `Contact your payroll or HR team and ask to set up a salary sacrifice arrangement`,
        `Specify the amount (${fmt(maxMonthly)}/month keeps you within the $30,000 cap)`,
        `Must be agreed before the income is earned — it cannot be applied retrospectively`,
      ],
      priority: annualTaxSave > 3000 ? 'high' : 'medium',
      category: 'contributions',
      actionUrl: '/salary',
      actionLabel: 'Open salary sacrifice calculator →',
      confidence: 'estimated',
      timeToAct: 'Before next pay period',
    })
  }

  // ── 3. CARRY-FORWARD ──────────────────────────────────────────────────────
  if (balance < CARRY_FORWARD_TSB_LIMIT && carryForwardBalance > 0) {
    const taxSave = carryForwardBalance * (marginal - 0.15)
    opps.push({
      id: 'carry-forward',
      icon: '⏰',
      title: `Use your carry-forward cap — ${fmt(Math.round(carryForwardBalance))} available`,
      subtitle: `The 2020–21 unused amount expires permanently on 30 June 2026`,
      explanation: `Because your total super balance is under $500,000, you can make a large concessional contribution this year using unused caps from the past 5 years. This is a one-time opportunity to inject up to ${fmt(Math.round(carryForwardBalance))} into super at the 15% contributions tax rate instead of your ${(marginal * 100).toFixed(0)}% income tax rate.`,
      whyNow: `The oldest unused year (2020–21) expires on 30 June 2026 — permanently. Once expired it cannot be recovered. You must make the contribution before EOFY.`,
      impact: Math.round(taxSave),
      impactLabel: `${fmt(Math.round(taxSave))} one-off tax saving`,
      impactType: 'oneoff',
      steps: [
        `Confirm your exact carry-forward balance on MyGov → ATO → Super → Carry-forward contributions`,
        `Make a personal deductible contribution to your super fund before 30 June`,
        `Lodge a Notice of Intent to Claim a Deduction with your fund before your tax return`,
      ],
      priority: 'high',
      category: 'contributions',
      actionUrl: '/contributions',
      actionLabel: 'Open contributions tracker →',
      confidence: 'estimated',
      timeToAct: '⚠ Before 30 June 2026',
    })
  }

  // ── 4. ACCOUNT CONSOLIDATION ──────────────────────────────────────────────
  if (accountCount > 1) {
    const annualSave = (accountCount - 1) * 78
    opps.push({
      id: 'consolidate',
      icon: '🔗',
      title: `Consolidate your ${accountCount} super accounts into one`,
      subtitle: `You're paying duplicate admin fees and possibly duplicate insurance`,
      explanation: `Each additional super account charges its own admin fee (typically $52–$104/yr) and usually default insurance premiums too. With ${accountCount} accounts you're likely paying ${fmt(annualSave)}+ per year in fees on accounts that aren't receiving contributions — money that compounds against you over time.`,
      whyNow: `Lost and inactive super accounts are common — the ATO estimates over $17 billion in unclaimed super. Each year they sit idle, fees erode the balance. Consolidation via MyGov takes under 5 minutes.`,
      impact: Math.round(annualSave),
      impactLabel: `${fmt(annualSave)}+/year in eliminated fees`,
      impactType: 'annual',
      steps: [
        `Log in to MyGov → ATO → Super to see all your accounts`,
        `Identify which fund you want to keep as your primary`,
        `Use the ATO online tool to roll over the other accounts — it's free and instant`,
      ],
      priority: 'medium',
      category: 'structure',
      actionUrl: '/dashboard',
      actionLabel: 'Check health score →',
      confidence: 'estimated',
      timeToAct: 'Anytime — takes 5 minutes',
    })
  }

  // ── 5. SPOUSE CONTRIBUTION OFFSET ─────────────────────────────────────────
  if (spouseIncome > 0 && spouseIncome < 40000 && spouseTSB < 2_000_000) {
    const offsetResult = calcSpouseOffset(spouseIncome, 3000, spouseTSB)
    if (offsetResult.eligible && offsetResult.offset > 0) {
      opps.push({
        id: 'spouse-offset',
        icon: '👫',
        title: `Contribute $3,000 to your spouse's super — get ${fmt(Math.round(offsetResult.offset))} back on tax`,
        subtitle: `Direct credit on your tax return — not a deduction, actual cash back`,
        explanation: `Contributing $3,000 to your spouse's super from your after-tax income earns you a ${fmt(Math.round(offsetResult.offset))} tax offset — a direct reduction in the tax you owe (not just a deduction). This is one of the few genuine tax offsets still available to individuals under Australian tax law.`,
        whyNow: `The offset resets each financial year — you must make the contribution before 30 June to claim it on this year's tax return. You cannot carry this forward.`,
        impact: Math.round(offsetResult.offset),
        impactLabel: `${fmt(Math.round(offsetResult.offset))} tax offset — certain`,
        impactType: 'annual',
        steps: [
          `Transfer $3,000 to your spouse's super fund (not your own) before 30 June`,
          `Keep a receipt from the fund confirming the contribution`,
          `Claim the offset on your personal tax return under "Spouse super contributions"`,
        ],
        priority: 'high',
        category: 'spouse',
        actionUrl: '/spouse',
        actionLabel: 'Open spouse analysis →',
        confidence: 'certain',
        timeToAct: '⚠ Before 30 June 2026',
      })
    }
  }

  // ── 6. INVESTMENT ALIGNMENT ───────────────────────────────────────────────
  const isConservative = opt.includes('conservative') || opt.includes('cash') || opt.includes('stable')
  const isBalanced = opt.includes('balanced') && !opt.includes('high')
  if (yrs > 15 && (isConservative || (isBalanced && balance > 50000))) {
    const targetReturn  = yrs > 20 ? 8.5 : 8.0
    const targetLabel   = yrs > 20 ? 'high growth' : 'growth'
    const projCurrent   = projectBalance(balance, annualContrib, (7 - fundFeePct) / 100, yrs)
    const projGrowth    = projectBalance(balance, annualContrib, (targetReturn - 0.50) / 100, yrs)
    const gain          = projGrowth - projCurrent
    if (gain > 10000) {
      opps.push({
        id: 'investment-align',
        icon: '🚀',
        title: `Switch to a ${targetLabel} option — your time horizon supports it`,
        subtitle: `${yrs} years to retirement · current option may be too conservative`,
        explanation: `With ${yrs} years until retirement you have time to ride out market downturns and benefit from long-term compounding. ${isConservative ? 'Conservative options protect capital short-term but significantly underperform over 15+ year horizons.' : 'Balanced options have historically underperformed growth options over 20+ year periods.'} The long-run difference can be substantial.`,
        whyNow: `The compounding effect means switching earlier has exponentially more impact than switching later. Every year in a lower-return option is a year of missed compounding that cannot be recovered.`,
        impact: Math.round(gain),
        impactLabel: `~${fmtShort(gain)} extra at retirement`,
        impactType: 'retirement',
        steps: [
          `Log in to your fund's member portal`,
          `Review the ${targetLabel} option — compare fees, historical returns, and asset allocation`,
          `Switch your investment option (free and immediate inside your current fund)`,
        ],
        priority: yrs > 20 && isConservative ? 'high' : 'medium',
        category: 'investment',
        actionUrl: '/funds',
        actionLabel: 'Compare investment options →',
        confidence: 'indicative',
        timeToAct: 'Anytime — sooner = more compounding',
      })
    }
  }

  // ── 7. INSURANCE REVIEW ───────────────────────────────────────────────────
  if (age >= 45 || balance > 300_000) {
    opps.push({
      id: 'insurance-review',
      icon: '🛡️',
      title: 'Review your super insurance cover',
      subtitle: 'Default cover may be under- or over-insuring you — both cost money',
      explanation: `Super funds provide default death, TPD, and income protection insurance deducted from your balance each year. These premiums quietly erode your super — often $500–$2,000+/year depending on fund and age. Many members are either massively over-insured (duplicate cover from multiple funds or employer) or significantly under-insured (still on low default cover with a large mortgage).`,
      whyNow: `Insurance premiums inside super increase significantly with age — at ${age} you may be paying more than you realise. If you have insurance through your employer or another policy, your super insurance may be a duplication you're paying for unnecessarily.`,
      impact: 0,
      impactLabel: 'Varies — could save $500–$2,000/yr',
      impactType: 'risk',
      steps: [
        `Log in to your fund portal and look for "Insurance" to see your current cover and annual premium`,
        `Check whether you have income protection or life insurance elsewhere (employer, standalone policy)`,
        `Adjust cover to match your actual needs — reduce if duplicated, increase if under-covered`,
      ],
      priority: 'medium',
      category: 'structure',
      actionUrl: '/dashboard',
      actionLabel: 'Check health score →',
      confidence: 'indicative',
      timeToAct: 'Within this financial year',
    })
  }

  // ── 8. CONTRIBUTION SPLITTING ─────────────────────────────────────────────
  if (spouseTSB > 0 && Math.abs(balance - spouseTSB) > 50000 && annualContrib > 10000) {
    const gap = Math.abs(balance - spouseTSB)
    const maxSplit = Math.min(annualSS + sgAmount * 0.85, CONCESSIONAL_CAP_2526)
    if (maxSplit > 5000) {
      opps.push({
        id: 'contribution-split',
        icon: '⚖️',
        title: `Split contributions to close the ${fmtShort(gap)} balance gap`,
        subtitle: `Redirect up to ${fmt(Math.round(maxSplit))} of contributions to your spouse's super`,
        explanation: `You can redirect up to 85% of your annual concessional contributions (employer SG + salary sacrifice) to your spouse's super each year. The money still counts against your cap — it's just transferred across at year end. This gradually equalises your balances and reduces Division 296 exposure for the higher-balance partner.`,
        whyNow: `You must apply to your super fund by 30 June each year to split contributions from the prior financial year. The deadline is firm — missing it means waiting another 12 months.`,
        impact: Math.round(maxSplit),
        impactLabel: `${fmt(Math.round(maxSplit))}/yr redirected to equalise balances`,
        impactType: 'annual',
        steps: [
          `Contact your super fund and request a "Contribution Splitting Application" form`,
          `Specify the dollar amount to split to your spouse's fund`,
          `Lodgements must be made before 30 June for the prior year's contributions`,
        ],
        priority: gap > 150000 ? 'high' : 'medium',
        category: 'spouse',
        actionUrl: '/spouse',
        actionLabel: 'Open spouse analysis →',
        confidence: 'estimated',
        timeToAct: '⚠ Before 30 June 2026',
      })
    }
  }

  // ── 9. EOFY PERSONAL DEDUCTIBLE CONTRIBUTION ─────────────────────────────
  if (!makingVoluntaryContribs && capInfo.headroom > 5000 && marginal >= 0.325) {
    const maxContrib   = capInfo.headroom
    const taxSave      = maxContrib * (marginal - 0.15)
    opps.push({
      id: 'personal-deductible',
      icon: '🏦',
      title: `Make a personal deductible contribution before 30 June`,
      subtitle: `Contribute ${fmt(Math.round(maxContrib))} directly to your fund and claim a tax deduction`,
      explanation: `If you can't arrange salary sacrifice through your employer, you can make a personal (after-tax) contribution directly to your super fund and then claim it as a tax deduction. The effect is the same — your income is reduced by the contribution amount, saving you ${(marginal * 100).toFixed(0)}% income tax and only paying 15% inside super.`,
      whyNow: `This must be made before 30 June and the Notice of Intent to Claim must be lodged before you lodge your tax return. It's a common end-of-year tax planning tool that many salaried employees overlook.`,
      impact: Math.round(taxSave),
      impactLabel: `${fmt(Math.round(taxSave))} tax saving this year`,
      impactType: 'oneoff',
      steps: [
        `Transfer up to ${fmt(Math.round(maxContrib))} to your super fund before 30 June`,
        `Lodge a "Notice of Intent to Claim a Deduction" with your fund (form available on fund website)`,
        `Claim the deduction on your tax return under "Personal super contributions"`,
      ],
      priority: taxSave > 2000 ? 'high' : 'medium',
      category: 'contributions',
      actionUrl: '/contributions',
      actionLabel: 'Open contributions page →',
      confidence: 'estimated',
      timeToAct: '⚠ Before 30 June 2026',
    })
  }

  // ── 10. DIVISION 296 EXPOSURE ─────────────────────────────────────────────
  if (balance > 1_500_000) {
    const proj          = projectBalance(balance, annualContrib, 0.07, yrs)
    const div296        = calcDiv296Exposure(proj, 0.07)
    if (proj > DIV296_THRESHOLD) {
      const annualTax   = div296.annualTax
      opps.push({
        id: 'div296',
        icon: '⚠',
        title: 'Your balance is on track to trigger Division 296 tax',
        subtitle: `Projected balance of ${fmtShort(proj)} at retirement — above the $3M threshold`,
        explanation: `Division 296 (commencing 1 July 2026) applies a 15% additional tax on super earnings attributable to the portion above $3M. At ${fmtShort(proj)} projected balance, roughly ${((Math.max(0, proj - DIV296_THRESHOLD) / proj) * 100).toFixed(0)}% of your investment earnings would attract an extra 15% tax — in addition to the standard 15% already paid inside super.`,
        whyNow: `The $3M threshold is not indexed to inflation — it will capture more people every year. Acting now (contribution splitting, reducing voluntary contributions into your own account) slows the rate at which your balance approaches the threshold.`,
        impact: Math.round(annualTax),
        impactLabel: `~${fmt(Math.round(annualTax))}/year extra tax at projected balance`,
        impactType: 'annual',
        steps: [
          `Model your exact exposure in the Division 296 tool`,
          `Consider contribution splitting to spouse to reduce your balance growth rate`,
          `Review whether making voluntary contributions into your own account still makes sense`,
        ],
        priority: balance > 2_500_000 ? 'high' : 'medium',
        category: 'tax',
        actionUrl: '/div296',
        actionLabel: 'Model Div 296 exposure →',
        confidence: 'indicative',
        timeToAct: 'Plan this financial year',
      })
    }
  }

  // ── 11. COMBINED SCENARIOS — from Advanced Modelling ────────────────────
  const baseProj      = projectBalance(balance, annualContrib, (7 - fundFeePct) / 100, yrs)
  const indexedProj   = projectBalance(balance, annualContrib, (7.8 - 0.08) / 100, yrs)
  const ssProj        = projectBalance(balance, annualContrib + 18000, (7 - fundFeePct) / 100, yrs)
  const laterProj     = projectBalance(balance, annualContrib, (7 - fundFeePct) / 100, yrs + 3)
  const combinedProj  = projectBalance(balance, annualContrib + 18000, (7.8 - 0.08) / 100, yrs + 3)
  const combinedGain  = combinedProj - baseProj

  if (combinedGain > 50000) {
    const scenarios = [
      { label: 'Switch to indexed fund', gain: indexedProj - baseProj },
      { label: 'Maximise salary sacrifice', gain: ssProj - baseProj },
      { label: 'Work 3 more years', gain: laterProj - baseProj },
    ].filter(s => s.gain > 0).sort((a, b) => b.gain - a.gain)

    opps.push({
      id: 'combined-scenario',
      icon: '⭐',
      title: `Combining strategies could add ${fmtShort(combinedGain)} to your retirement`,
      subtitle: `Indexed fund + max salary sacrifice + 3 more years = maximum outcome`,
      explanation: `Your advanced modelling shows that no single change is as powerful as combining multiple strategies. Individually: switching to an indexed fund adds ${fmtShort(scenarios[0]?.gain ?? 0)}, maximising salary sacrifice adds ${fmtShort(scenarios[1]?.gain ?? 0)}, and working 3 more years adds ${fmtShort(scenarios[2]?.gain ?? 0)}. Together they compound significantly.`,
      whyNow: `Each of these strategies is more valuable when started now. The compounding effect of an extra ${retirementAge + 3 - age} years means early decisions have disproportionate impact vs the same decision made in 5 years.`,
      impact: Math.round(combinedGain),
      impactLabel: `${fmtShort(combinedGain)} extra at retirement`,
      impactType: 'retirement',
      steps: [
        `Open Advanced Modelling to explore each scenario interactively`,
        `Start with the easiest change — switching investment options (free, 5 minutes)`,
        `Set up salary sacrifice before next payroll to start capturing tax savings immediately`,
      ],
      priority: combinedGain > 200000 ? 'high' : 'medium',
      category: 'modelling',
      actionUrl: '/simulator',
      actionLabel: 'Open advanced modelling →',
      confidence: 'indicative',
      timeToAct: 'Start now — compounding rewards early action',
    })
  }

  // ── 12. RETIREMENT GAP ────────────────────────────────────────────────────
  const ASFA_COMFORTABLE = 51000
  if (baseIncome < ASFA_COMFORTABLE && yrs > 5) {
    const gap = ASFA_COMFORTABLE - baseIncome
    const extraNeeded = gap / 0.04
    opps.push({
      id: 'retirement-gap',
      icon: '🎯',
      title: `Close your ${fmt(Math.round(gap))}/year retirement income gap`,
      subtitle: `Projected ${fmt(Math.round(baseIncome))}/yr vs ASFA Comfortable standard of ${fmt(ASFA_COMFORTABLE)}/yr`,
      explanation: `At your current trajectory you're projected to retire with ${fmt(Math.round(baseIncome))}/year in retirement income (using the 4% safe withdrawal rate). The ASFA Comfortable standard — covering a reasonable lifestyle without financial stress — is ${fmt(ASFA_COMFORTABLE)}/year for a single person. Closing this gap requires approximately ${fmtShort(extraNeeded)} more in super at retirement.`,
      whyNow: `The retirement readiness score page shows your full gap analysis and the specific combination of changes that would close it. Small changes now compound into large differences at retirement.`,
      impact: Math.round(extraNeeded),
      impactLabel: `${fmtShort(extraNeeded)} more needed to meet ASFA Comfortable`,
      impactType: 'retirement',
      steps: [
        `Check your Retirement Readiness Score for a detailed breakdown`,
        `Identify which of the other opportunities above has the biggest impact on closing the gap`,
        `Model different scenarios in Advanced Modelling to find the most realistic path`,
      ],
      priority: gap > 20000 ? 'high' : gap > 10000 ? 'medium' : 'low',
      category: 'modelling',
      actionUrl: '/retirement-score',
      actionLabel: 'Check retirement readiness →',
      confidence: 'estimated',
      timeToAct: 'Start planning this financial year',
    })
  }

  // Sort: priority first, then impact
  const order = { high: 0, medium: 1, low: 2 }
  return opps
    .sort((a, b) => {
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
      return b.impact - a.impact
    })
    .slice(0, 10)
}

export function calcRetirementReadiness(inputs: {
  balance: number; salary: number; age: number; retirementAge: number
  feePct: number; annualContrib: number; investmentOption: string
  makingVoluntaryContribs: boolean
}) {
  const { balance, salary, age, retirementAge, feePct, annualContrib, investmentOption, makingVoluntaryContribs } = inputs
  const yrs = Math.max(1, retirementAge - age)
  const projBalance = projectBalance(balance, annualContrib, 0.07 - feePct / 100, yrs)
  const projIncome  = projBalance * 0.04
  const ASFA_COMFORTABLE = 51000
  const ASFA_MODEST      = 31000

  const incomeScore = projIncome >= ASFA_COMFORTABLE ? 30
    : projIncome >= ASFA_MODEST + (ASFA_COMFORTABLE - ASFA_MODEST) * 0.75 ? 22
    : projIncome >= ASFA_MODEST ? 14 : 5

  const gap      = Math.max(0, ASFA_COMFORTABLE - projIncome)
  const gapScore = gap === 0 ? 25 : gap < 5000 ? 20 : gap < 15000 ? 12 : gap < 25000 ? 6 : 0

  const contribRate  = annualContrib / (salary || 1)
  const contribScore = makingVoluntaryContribs
    ? (contribRate > 0.20 ? 25 : contribRate > 0.15 ? 20 : 15)
    : (contribRate > 0.15 ? 18 : contribRate > 0.12 ? 12 : 8)

  const o             = investmentOption.toLowerCase()
  const isAggressive  = o.includes('high growth') || o.includes('indexed')
  const isConservative = o.includes('conservative') || o.includes('cash')
  const suitScore     = yrs > 20 ? (isAggressive ? 20 : isConservative ? 6 : 13)
    : yrs > 10 ? (isConservative ? 10 : 16) : 16

  const total     = incomeScore + gapScore + contribScore + suitScore
  const grade     = total >= 85 ? 'On Track' : total >= 65 ? 'Nearly There' : total >= 45 ? 'At Risk' : 'Action Required'
  const gradeColor = total >= 85 ? '#00D4AA' : total >= 65 ? '#F59E0B' : total >= 45 ? '#F97316' : '#EF4444'

  return {
    total, grade, gradeColor, projBalance, projIncome, gap,
    asfaComfortable: ASFA_COMFORTABLE,
    breakdown: [
      { label: 'Projected retirement income', score: incomeScore, max: 30,
        detail: `${fmt(Math.round(projIncome))}/yr projected at ${retirementAge} vs ${fmt(ASFA_COMFORTABLE)}/yr ASFA Comfortable`,
        status: (incomeScore >= 22 ? 'good' : incomeScore >= 14 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad' },
      { label: 'Retirement income gap', score: gapScore, max: 25,
        detail: gap > 0 ? `${fmt(Math.round(gap))}/yr shortfall — need ${fmtShort(gap / 0.04)} more` : 'No gap — on track for ASFA Comfortable',
        status: (gapScore >= 20 ? 'good' : gapScore >= 12 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad' },
      { label: 'Contribution strategy', score: contribScore, max: 25,
        detail: `Contributing ${(contribRate * 100).toFixed(1)}% of salary${makingVoluntaryContribs ? ' + voluntary' : ' (SG only)'}`,
        status: (contribScore >= 20 ? 'good' : contribScore >= 12 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad' },
      { label: 'Investment suitability', score: suitScore, max: 20,
        detail: `${yrs} years to retire — ${isAggressive ? 'growth-oriented option is appropriate' : isConservative ? 'consider more growth exposure' : 'balanced option is reasonable'}`,
        status: (suitScore >= 16 ? 'good' : suitScore >= 10 ? 'ok' : 'bad') as 'good' | 'ok' | 'bad' },
    ],
  }
}
