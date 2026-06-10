'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calcSuperScore, projectBalance, fmt, fmtShort } from '@/lib/calculations'
import type { SuperProfile, Subscription } from '@/types'

interface Props {
  profile: Record<string, unknown> | null
  superProfile: SuperProfile | null
  subscription: Subscription | null
  profileIsEmpty?: boolean
}

function Alert({ variant, title, children }: { variant: 'danger' | 'warning'; title: string; children: React.ReactNode }) {
  const styles = {
    danger: { background: '#FEF2F2', border: '1px solid rgba(232,93,93,0.25)', color: '#7F1D1D', icon: '⚠' },
    warning: { background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', color: '#78350F', icon: '⚠' },
  }
  const s = styles[variant]
  return (
    <div className="flex gap-3 rounded-xl p-4 text-sm" style={{ background: s.background, border: s.border, color: s.color }}>
      <span className="flex-shrink-0 mt-px">{s.icon}</span>
      <div className="leading-relaxed">
        <div className="font-medium mb-0.5">{title}</div>
        <div style={{ opacity: 0.85 }}>{children}</div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
      <div className="text-[11px] font-medium uppercase tracking-widest mb-1" style={{ color: 'rgba(15,30,60,0.5)' }}>
        {label}
      </div>
      <div className="font-mono text-2xl font-medium tracking-tight" style={{ color: accent ? '#00D4AA' : '#0F1E3C' }}>
        {value}
      </div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'rgba(15,30,60,0.5)' }}>{sub}</div>}
    </div>
  )
}

export function DashboardClient({ superProfile, profileIsEmpty }: Props) {
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

  if (profileIsEmpty || !sp) {
    return (
      <div className="max-w-5xl space-y-5">
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(0,212,170,0.1)' }}
          >
            ⬡
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#0F1E3C' }}>
            Set up your super profile
          </h2>
          <p className="text-sm max-w-md mx-auto mb-6 leading-relaxed" style={{ color: 'rgba(15,30,60,0.6)' }}>
            Enter your super details to get your personalised health score, see your fee drag,
            and unlock all 8 optimisation modules.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="px-8 py-3 rounded-xl font-semibold transition-colors"
            style={{ background: '#00D4AA', color: '#0F1E3C' }}
          >
            Set up my profile →
          </button>
          <p className="text-xs mt-4" style={{ color: 'rgba(15,30,60,0.4)' }}>
            Takes about 2 minutes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4" style={{ opacity: 0.35, pointerEvents: 'none' }}>
          {['Super balance', 'Employer SG (annual)', 'Projected at 65'].map(label => (
            <div key={label} className="bg-white rounded-xl p-5" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
              <div
                className="text-[11px] font-medium uppercase tracking-widest mb-1"
                style={{ color: 'rgba(15,30,60,0.5)' }}
              >
                {label}
              </div>
              <div className="font-mono text-2xl font-medium" style={{ color: '#0F1E3C' }}>—</div>
            </div>
          ))}
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
          Up to $27,500 in unused concessional cap will be permanently lost if not used before EOFY.
          See Contributions for details.
        </Alert>
      )}

      {hasFeeAlert && (
        <Alert variant="warning" title="Your fund fee is above the lowest comparable option">
          At {sp.fund_fee_pct}% p.a., your fee is above the lowest-cost equivalent fund.
          See Fee Analyser for the dollar impact.
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

      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 3fr' }}>

        <div
          className="bg-white rounded-xl flex flex-col items-center justify-center py-10 px-6"
          style={{ border: '1px solid rgba(15,30,60,0.1)' }}
        >
          <svg viewBox="0 0 180 90" style={{ width: 176, height: 96, overflow: 'visible', marginBottom: 12 }}>
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="#ECEAE4"
              strokeWidth="10"
              strokeLinecap="round"
            />
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
          <div
            className="font-mono font-medium"
            style={{ fontSize: 52, color: '#0F1E3C', lineHeight: 1 }}
          >
            {score?.total ?? '—'}
          </div>
          <div className="text-sm mt-1" style={{ color: 'rgba(15,30,60,0.5)' }}>
            out of 100
          </div>
          <div
            className="mt-3 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
            style={{
              background:
                score?.grade === 'poor' ? '#FEF2F2'
                : score?.grade === 'needs-attention' ? '#FFFBEB'
                : 'rgba(0,212,170,0.1)',
              color:
                score?.grade === 'poor' ? '#991B1B'
                : score?.grade === 'needs-attention' ? '#92400E'
                : '#065F46',
            }}
          >
            {score?.label ?? 'Complete your profile'}
          </div>
        </div>

        <div
          className="bg-white rounded-xl p-6"
          style={{ border: '1px solid rgba(15,30,60,0.1)' }}
        >
          <div
            className="text-[11px] font-medium uppercase tracking-widest mb-4"
            style={{ color: 'rgba(15,30,60,0.4)' }}
          >
            Score breakdown
          </div>
          {score ? (
            <div>
              {score.breakdown.map(item => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: '1px solid rgba(15,30,60,0.05)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background:
                        item.status === 'good' ? 'rgba(0,212,170,0.1)'
                        : item.status === 'ok' ? '#FFFBEB'
                        : '#FEF2F2',
                      color:
                        item.status === 'good' ? '#065F46'
                        : item.status === 'ok' ? '#92400E'
                        : '#991B1B',
                    }}
                  >
                    {item.status === 'good' ? '✓' : item.status === 'ok' ? '~' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: '#0F1E3C' }}>
                      {item.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'rgba(15,30,60,0.5)' }}>
                      {item.sublabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: '#ECEAE4' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.score / item.maxScore) * 100}%`,
                          background:
                            item.status === 'good' ? '#00D4AA'
                            : item.status === 'ok' ? '#F59E0B'
                            : '#EF4444',
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-xs font-medium w-10 text-right"
                      style={{
                        color:
                          item.status === 'good' ? '#00D4AA'
                          : item.status === 'ok' ? '#D97706'
                          : '#EF4444',
                      }}
                    >
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm" style={{ color: 'rgba(15,30,60,0.4)' }}>
              Complete your super profile to see your score breakdown
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-3 text-xs leading-relaxed"
        style={{
          background: 'rgba(15,30,60,0.04)',
          border: '1px solid rgba(15,30,60,0.08)',
          color: 'rgba(15,30,60,0.5)',
        }}
      >
        <strong style={{ color: 'rgba(15,30,60,0.7)' }}>General information only.</strong> This
        score is a modelled estimate based on the information you have entered and publicly available
        fund data. It does not take into account your personal financial objectives, situation or
        needs and is not financial advice. Scores and projections are illustrative — past fund
        performance is not indicative of future returns.
      </div>
    </div>
  )
}
