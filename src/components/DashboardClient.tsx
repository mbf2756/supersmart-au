'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { calcSuperScore, projectBalance, fmt, fmtShort } from '@/lib/calculations'
import type { SuperProfile, Subscription } from '@/types'

interface Props {
  profile: Record<string, unknown> | null
  superProfile: SuperProfile | null
  subscription: Subscription | null
  profileIsEmpty?: boolean
}

export function DashboardClient({ profile, superProfile, subscription, profileIsEmpty }: Props) {
  const router = useRouter()
  const sp = superProfile

  const score = useMemo(() => {
    if (!sp || profileIsEmpty) return null
    return calcSuperScore({
      fundFeePct: sp.fund_fee_pct ?? 0.78,
      apraStatus: 'passed',
      investmentOption: sp.fund_option ?? 'Balanced',
      age: sp.age ?? 40,
      hasCarryForwardUnused: true,
      accountCount: sp.account_count ?? 1,
    })
  }, [sp, profileIsEmpty])

  const projBalance = useMemo(() => {
    if (!sp || profileIsEmpty) return 0
    const yrs = Math.max(0, (sp.target_retirement_age ?? 65) - (sp.age ?? 40))
    const annual = (sp.salary ?? 0) * ((sp.employer_sg_rate ?? 12) / 100)
    return projectBalance(sp.current_balance ?? 0, annual, 0.07, yrs)
  }, [sp, profileIsEmpty])

  const arcLength = 251.3
  const arcOffset = score ? arcLength - (arcLength * score.total / 100) : arcLength

  // Show setup prompt if profile is empty
  if (profileIsEmpty || !sp) {
    return (
      <div className="max-w-5xl space-y-5">
        <div className="bg-white rounded-2xl border border-black/10 p-10 text-center">
          <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
            ⬡
          </div>
          <h2 className="text-xl font-semibold text-navy mb-2">Set up your super profile</h2>
          <p className="text-navy/60 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Enter your super details to get your personalised health score, see your fee drag,
            and unlock all 8 optimisation modules.
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="px-8 py-3 bg-teal text-navy font-semibold rounded-xl hover:bg-teal-dim transition-colors"
          >
            Set up my profile →
          </button>
          <p className="text-xs text-navy/40 mt-4">Takes about 2 minutes</p>
        </div>

        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none select-none">
          <div className="bg-white rounded-xl border border-black/10 p-5">
            <div className="text-[11px] font-medium text-navy/50 uppercase tracking-widest mb-1">Super balance</div>
            <div className="font-mono text-2xl font-medium text-navy">$0</div>
            <div className="text-xs text-navy/50 mt-0.5">Enter your details above</div>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-5">
            <div className="text-[11px] font-medium text-navy/50 uppercase tracking-widest mb-1">Employer SG (annual)</div>
            <div className="font-mono text-2xl font-medium text-navy">—</div>
            <div className="text-xs text-navy/50 mt-0.5">Enter your salary above</div>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-5">
            <div className="text-[11px] font-medium text-navy/50 uppercase tracking-widest mb-1">Projected at 65</div>
            <div className="font-mono text-2xl font-medium text-navy">—</div>
            <div className="text-xs text-navy/50 mt-0.5">Based on current contributions</div>
          </div>
        </div>
      </div>
    )
  }

  const hasCarryForwardAlert = (sp.current_balance ?? 0) < 500000
  const hasFeeAlert = (sp.fund_fee_pct ?? 0) > 0.55

  return (
    <div className="max-w-5xl space-y-5">

      {hasCarryForwardAlert && (
        <Alert variant="danger" title="Your 2020–21 carry-forward cap expires 30 June 2026">
          Up to $27,500 in unused concessional cap will be permanently lost if not used before EOFY. See Contributions for details.
        </Alert>
      )}
      {hasFeeAlert && (
        <Alert variant="warning" title="Your fund fee is above the lowest comparable option">
          At {sp.fund_fee_pct}% p.a., your fee is above the lowest-cost equivalent fund. See Fee Analyser for the dollar impact over time.
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Super balance"
          value={fmt(sp.current_balance ?? 0)}
          sub={`${sp.fund_name ?? '—'} · ${sp.fund_option ?? '—'}`}
        />
        <StatCard
          label="Employer SG (annual)"
          value={fmt((sp.salary ?? 0) * (sp.employer_sg_rate ?? 12) / 100)}
          sub={`${sp.employer_sg_rate ?? 12}% of ${fmt(sp.salary ?? 0)} from 1 Jul 2025`}
        />
        <StatCard
          label={`Projected at ${sp.target_retirement_age ?? 65}`}
          value={fmtShort(projBalance)}
          sub="At 7% p.a. · current contributions"
          accent
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
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
            {score?.label ?? 'Complete your profile'}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-xl border border-black/10 p-6">
          <div className="text-[11px] font-medium text-navy/40 uppercase tracking-widest mb-4">Score breakdown</div>
          {score ? (
            <div className="space-y-0">
              {score.breakdown.map(item => (
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
          ) : (
            <div className="text-center py-8 text-navy/40 text-sm">
              Complete your super profile to see your score breakdown
            </div>
          )}
        </div>
      </div>

      <div className="bg-navy/5 border border-navy/10 rounded-xl px-4 py-3 text-xs text-navy/50 leading-relaxed">
        <strong className="text-navy/70">General information only.</strong> This score is a modelled estimate based on the information you have entered and publicly available fund data. It does not take into account your personal financial objectives, situation or needs and is not financial advice. Scores and projections are illustrative — past fund performance is not indicative of future returns.
      </div>
    </div>
  )
}
