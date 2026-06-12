'use client'
import { useMemo } from 'react'
import { calcRetirementReadiness } from '@/lib/opportunities'
import { fmt, fmtShort, projectBalance } from '@/lib/calculations'

const ASFA_COMFORTABLE = 51000
const ASFA_MODEST = 31000

export function RetirementScoreClient({
  superProfile: sp, subscription
}: { superProfile: any; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'

  const annualContrib = (sp?.salary ?? 0) * ((sp?.employer_sg_rate ?? 12) / 100)
  const yrs = Math.max(1, (sp?.target_retirement_age ?? 65) - (sp?.age ?? 40))

  const result = useMemo(() => calcRetirementReadiness({
    balance:           sp?.current_balance ?? 0,
    salary:            sp?.salary ?? 0,
    age:               sp?.age ?? 40,
    retirementAge:     sp?.target_retirement_age ?? 65,
    feePct:            sp?.fund_fee_pct ?? 0,
    annualContrib,
    investmentOption:  sp?.fund_option ?? '',
    makingVoluntaryContribs: sp?.making_voluntary_contribs ?? false,
  }), [sp, annualContrib])

  // Arc gauge helper
  const arcLen = 251.3
  const arcOffset = arcLen - (arcLen * result.total / 100)

  // Retirement income gap bar
  const incomeBarMax = Math.max(result.projIncome, ASFA_COMFORTABLE) * 1.1

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 680, background: 'white', borderRadius: 20, padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Retirement Readiness Score</h3>
        <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
          See how prepared you actually are for retirement — projected income, ASFA gap, contribution strategy, and investment suitability in a single score.
        </p>
        <a href="/pricing" style={{ display: 'inline-block', background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
          Upgrade to unlock →
        </a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* Main score + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginBottom: 20 }}>

        {/* Gauge */}
        <div style={{ background: 'white', borderRadius: 16, padding: '28px 20px', border: '1px solid rgba(15,30,60,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 10 }}>
            Retirement Readiness
          </div>
          <svg viewBox="0 0 180 100" style={{ width: 180, height: 100, overflow: 'visible' }}>
            <defs>
              <linearGradient id="rrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
            <path d="M 12 94 A 78 78 0 0 1 168 94" fill="none" stroke="rgba(15,30,60,0.08)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 12 94 A 78 78 0 0 1 168 94" fill="none" stroke="url(#rrGrad)" strokeWidth="12"
              strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcOffset} />
          </svg>
          <div style={{ fontFamily: 'monospace', fontSize: 52, fontWeight: 500, color: '#0F1E3C', lineHeight: 1, marginTop: -10 }}>
            {result.total}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)', marginTop: 2 }}>out of 100</div>
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, padding: '6px 18px', borderRadius: 20, background: `${result.gradeColor}18`, color: result.gradeColor }}>
            {result.grade}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 18 }}>
            Score breakdown — 4 dimensions
          </div>
          {result.breakdown.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0,
                background: item.status === 'good' ? 'rgba(0,212,170,0.1)' : item.status === 'ok' ? '#FFFBEB' : '#FEF2F2',
                color: item.status === 'good' ? '#065F46' : item.status === 'ok' ? '#92400E' : '#991B1B' }}>
                {item.status === 'good' ? '✓' : item.status === 'ok' ? '~' : '✗'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginTop: 1 }}>{item.detail}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: '#ECEAE4', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(item.score / item.max) * 100}%`,
                    background: item.status === 'good' ? '#00D4AA' : item.status === 'ok' ? '#F97316' : '#EF4444' }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, width: 40, textAlign: 'right',
                  color: item.status === 'good' ? '#00D4AA' : item.status === 'ok' ? '#D97706' : '#EF4444' }}>
                  {item.score}/{item.max}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retirement income callout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          {
            label: 'Projected balance at retirement',
            value: fmtShort(result.projBalance),
            sub: `At age ${sp?.target_retirement_age ?? 65} · 7% p.a. return`,
            colour: '#534AB7', dark: false
          },
          {
            label: 'Projected annual retirement income',
            value: fmt(Math.round(result.projIncome)),
            sub: '4% safe withdrawal rate',
            colour: result.projIncome >= ASFA_COMFORTABLE ? '#00D4AA' : result.projIncome >= ASFA_MODEST ? '#F59E0B' : '#EF4444',
            dark: false
          },
          {
            label: result.gap > 0 ? 'Annual income gap vs ASFA Comfortable' : 'ASFA Comfortable standard',
            value: result.gap > 0 ? fmt(Math.round(result.gap)) : '✓ Met',
            sub: result.gap > 0 ? `Shortfall vs $${ASFA_COMFORTABLE.toLocaleString()}/yr standard` : `${fmt(Math.round(result.projIncome))} exceeds ${fmt(ASFA_COMFORTABLE)} standard`,
            colour: result.gap > 0 ? '#EF4444' : '#00D4AA',
            dark: false
          },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: `1px solid rgba(15,30,60,0.1)` }}>
            <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: s.colour, marginBottom: 4, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1E3C', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Income visualisation */}
      <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>Retirement income context</div>
        <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginBottom: 20 }}>
          How your projected income compares to ASFA standards and current income
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: `Your projected income at ${sp?.target_retirement_age ?? 65}`, value: result.projIncome, color: result.projIncome >= ASFA_COMFORTABLE ? '#00D4AA' : '#EF4444' },
            { label: 'ASFA Comfortable standard (2025)', value: ASFA_COMFORTABLE, color: '#534AB7' },
            { label: 'ASFA Modest standard (2025)', value: ASFA_MODEST, color: '#F59E0B' },
            { label: 'Your current salary (for reference)', value: sp?.salary ?? 0, color: '#8A9BB5' },
          ].map(bar => (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#0F1E3C', width: 260, flexShrink: 0 }}>{bar.label}</div>
              <div style={{ flex: 1, height: 8, background: 'rgba(15,30,60,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (bar.value / incomeBarMax) * 100)}%`, height: '100%', background: bar.color, borderRadius: 4 }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: bar.color, width: 80, textAlign: 'right' }}>
                {fmt(Math.round(bar.value))}
              </div>
            </div>
          ))}
        </div>
        {result.gap > 0 && (
          <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#7F1D1D', lineHeight: 1.7 }}>
            To close the {fmt(Math.round(result.gap))}/year gap, you would need approximately <strong>{fmtShort(result.gap / 0.04)}</strong> more in super at retirement. That's roughly {fmt(Math.round(result.gap / 0.04 / yrs))}/year in additional contributions over {yrs} years.
          </div>
        )}
      </div>

      {/* Action recommendations */}
      <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 12 }}>Recommended actions to improve your readiness score</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.breakdown.filter(d => d.status !== 'good').map(dim => (
            <div key={dim.label} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0 }}>{dim.status === 'bad' ? '⚠' : '💡'}</span>
              <span>
                <strong>{dim.label}:</strong> {dim.detail}
                {dim.label.includes('income') && result.gap > 0 && ` — consider increasing contributions via salary sacrifice.`}
                {dim.label.includes('contribution') && !dim.detail.includes('voluntary') && ` — even $100/month extra compounds significantly over ${yrs} years.`}
                {dim.label.includes('investment') && dim.status !== 'good' && ` — use the Fund Comparison tool to see growth options.`}
              </span>
            </div>
          ))}
          {result.total >= 80 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span>✓</span>
              <span>Your retirement readiness is strong. Review annually and adjust as your balance, salary, or plans change.</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Projections use a constant 7% p.a. return assumption and do not account for inflation, tax changes, or personal circumstances. ASFA standards sourced from asfa.org.au (2025). Not financial advice.
      </div>
    </div>
  )
}
