'use client'
import { useRouter } from 'next/navigation'

interface Props {
  superProfile: any
  children: React.ReactNode
  pageName?: string   // e.g. "Fee analyser"
  pageIcon?: string   // emoji
}

// A profile is "ready" when the user has filled in their core fields
function isProfileReady(sp: any): boolean {
  if (!sp) return false
  return !!(sp.fund_name && sp.current_balance > 0 && sp.age > 0)
}

export function ProfileGate({ superProfile, children, pageName, pageIcon }: Props) {
  const router = useRouter()

  if (!isProfileReady(superProfile)) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          background: 'white', borderRadius: 20, padding: '56px 48px',
          textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)',
        }}>
          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
            background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32
          }}>
            {pageIcon ?? '📊'}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 10 }}>
            Complete your profile to unlock {pageName ?? 'this page'}
          </h2>

          <p style={{ fontSize: 14, color: 'rgba(15,30,60,0.6)', lineHeight: 1.8, maxWidth: 420, margin: '0 auto 28px' }}>
            All calculations and insights on this page are personalised to your super fund, balance, salary, and investment option.
            Set up your profile first — it takes about 2 minutes.
          </p>

          {/* Steps */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 32, textAlign: 'left',
            background: 'rgba(15,30,60,0.03)', borderRadius: 14, padding: '20px 24px',
          }}>
            {[
              { n: '1', label: 'Your super fund', sub: 'Fund name + investment option' },
              { n: '2', label: 'Your balance & salary', sub: 'For accurate projections' },
              { n: '3', label: 'Save & lock', sub: 'Unlocks all 8 modules' },
            ].map((step, i) => (
              <div key={step.n} style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#0F1E3C',
                  color: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2
                }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>{step.sub}</div>
                </div>
                {i < 2 && (
                  <div style={{ flex: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(15,30,60,0.2)', fontSize: 18, marginTop: 4 }}>›</div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/settings')}
            style={{
              background: '#0F1E3C', color: '#00D4AA', padding: '13px 36px',
              borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none',
              cursor: 'pointer', letterSpacing: '0.01em',
            }}
          >
            Set up my profile →
          </button>

          <p style={{ marginTop: 14, fontSize: 12, color: 'rgba(15,30,60,0.35)' }}>
            Takes 2 minutes · All calculations are personalised to your details
          </p>
        </div>

        {/* Preview of what's unlocked */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: '💸', label: 'Fee analyser', sub: 'Dollar cost of your fees' },
            { icon: '🏆', label: 'Fund comparison', sub: 'Like-for-like peer data' },
            { icon: '📅', label: 'Contributions', sub: 'Carry-forward tracker' },
            { icon: '💼', label: 'Salary sacrifice', sub: 'Tax saving calculator' },
            { icon: '📊', label: 'Division 296', sub: '$3M tax exposure' },
            { icon: '👫', label: 'Spouse strategy', sub: 'Balance equalisation' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'white', borderRadius: 12, padding: '14px 16px',
              border: '1px solid rgba(15,30,60,0.08)', opacity: 0.55,
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1E3C' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
