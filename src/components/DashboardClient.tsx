'use client'
import { useMemo } from 'react'
import { StatCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { calcSuperScore, projectBalance, fmt, fmtShort } from '@/lib/calculations'
import type { SuperProfile, Subscription } from '@/types'

interface Props {
  profile: any
  superProfile: SuperProfile | null
  subscription: Subscription | null
}

export function DashboardClient({ profile, superProfile, subscription }: Props) {
  const sp = superProfile

  const score = useMemo(() => {
    if (!sp) return null
    return calcSuperScore({
      fundFeePct: sp.fund_fee_pct ?? 0.78,
      apraStatus: 'passed',
      investmentOption: sp.fund_option ?? 'Balanced',
      age: sp.age ?? 40,
      hasCarryForwardUnused: true,
      accountCount: sp.account_count ?? 1,
    })
  }, [sp])

  const projBalance = useMemo(() => {
    if (!sp) return 0
    const yrs = Math.max(0, (sp.target_retirement_age ?? 65) - (sp.age ?? 40))
    const annual = (sp.salary ?? 80000) * ((sp.employer_sg_rate ?? 12) / 100)
    return projectBalance(sp.current_balance ?? 0, annual, 0.07, yrs)
  }, [sp])

  const arcLength = 251.3
  const arcOffset = score ? arcLength - (arcLength * score.total / 100) : arcLength

  const gradeColour = score
    ? score.grade === 'excellent' ? '#00D4AA'
      : score.grade === 'good' ? '#00D4AA'
      : score.grade === 'needs-attention' ? '#F59E0B'
      : '#EF4444'
    : '#8A9BB5'

  return (
    <div className="max-w-5xl space-y-5">
      {/* Alerts */}
      <Alert variant="danger" title="Your 2020–21 carry-forward cap expires 30 June 2026">
        Up to $27,500 in unused concessional cap will be permanently lost. See Contributions to act now.
      </Alert>
      <Alert variant="warning" title="Your fund fee is 1.4× the lowest comparable option">
        Over 20 years this costs an estimated $68,400. See Fee Analyser for details.
      </Alert>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Super balance"
          value={sp ? fmt(sp.current_balance ?? 0) : '—'}
          sub={`${sp?.fund_name ?? '—'} · ${sp?.fund_option ?? '—'}`}
        />
        <StatCard
          label="Employer SG (annual)"
          value={sp ? fmt((sp.salary ?? 0) * (sp.employer_sg_rate ?? 12) / 100) : '—'}
          sub={`${sp?.employer_sg_rate ?? 12}% of ${sp ? fmt(sp.salary ?? 0) : '—'}`}
        />
        <StatCard
          label={`Projected at ${sp?.target_retirement_age ?? 65}`}
          value={fmtShort(projBalance)}
          sub="At 7% p.a. · current contributions"
          accent
        />
      </div>

      {/* Score + Breakdown */}
      <div className="grid grid-cols-5 gap-4">
        {/* Gauge */}
        <div className="col-span-2 bg-white rounded-xl border border-black/10 flex flex-col items-center justify-center py-8 px-6">
          <svg viewBox="0 0 180 90" className="w-44 h-24 overflow-visible mb-3">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
            <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#ECEAE4" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={arcOffset}
            />
          </svg>
          <div className="font-mono text-5xl font-medium text-navy">{score?.total ?? '—'}</div>
          <div className="text-sm text-navy/50 mt-1">out of 100</div>
          <div className={`mt-3 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${
            score?.grade === 'excellent' ? 'bg-teal/10 text-teal-900'
            : score?.grade === 'good' ? 'bg-teal/10 text-teal-900'
            : score?.grade === 'needs-attention' ? 'bg-amber-50 text-amber-800'
            : 'bg-red-50 text-red-700'
          }`}>
            {score?.label ?? 'Set up your profile'}
          </div>
        </div>

        {/* Breakdown */}
        <div className="col-span-3 bg-white rounded-xl border border-black/10 p-6">
          <div className="text-[11px] font-medium text-navy/40 uppercase tracking-widest mb-4">Score breakdown</div>
          <div className="space-y-0">
            {score?.breakdown.map(item => (
              <div key={item.key} className="flex items-center gap-3 py-2.5 border-b border-black/5 last:border-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                  item.status === 'good' ? 'bg-teal/10 text-teal-800'
                  : item.status === 'ok' ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
                }`}>
                  {item.status === 'good' ? '✓' : item.status === 'ok' ? '~' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-navy font-medium">{item.label}</div>
                  <div className="text-xs text-navy/50 truncate">{item.sublabel}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.score / item.maxScore) * 100}%`,
                        background: item.status === 'good' ? '#00D4AA' : item.status === 'ok' ? '#F59E0B' : '#EF4444'
                      }}
                    />
                  </div>
                  <span className={`font-mono text-xs font-medium w-10 text-right ${
                    item.status === 'good' ? 'text-teal' : item.status === 'ok' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {item.score}/{item.maxScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="bg-navy/5 border border-navy/10 rounded-xl px-4 py-3 text-xs text-navy/50 leading-relaxed">
        <strong className="text-navy/70">General information only.</strong> This score is a modelled estimate based on the information you have entered and publicly available fund data. It does not take into account your personal financial objectives, situation or needs and is not financial advice. Scores and projections are illustrative — past fund performance is not indicative of future returns.
      </div>
    </div>
  )
}
