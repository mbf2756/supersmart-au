'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/components/SubscriptionContext'

interface Props {
  title: string
  subtitle?: string
}

export function DashboardTopbar({ title, subtitle }: Props) {
  const router    = useRouter()
  const supabase  = createClient()
  const subscription = useSubscription()
  const isPaid    = subscription?.plan && subscription.plan !== 'free'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="bg-white sticky top-0 z-10 px-8 py-3 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>

      {/* Page title */}
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color: '#0F1E3C' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(15,30,60,0.5)' }}>{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">

        {/* Edit profile */}
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-black/5"
          style={{ border: '1.5px solid rgba(15,30,60,0.15)', color: '#0F1E3C' }}
        >
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5z"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit profile
        </Link>

        {/* Upgrade — free users only */}
        {!isPaid && (
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: '#00D4AA', color: '#0F1E3C' }}
          >
            Upgrade →
          </Link>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'rgba(15,30,60,0.1)', marginLeft: 2 }} />

        {/* Sign out — red-tinted so it reads as a distinct destructive action */}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-red-50"
          style={{
            background: 'rgba(239,68,68,0.07)',
            color: '#B91C1C',
            border: '1px solid rgba(239,68,68,0.18)',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <path d="M5 1.5H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1H5M9 9.5l2.5-3L9 3.5M11.5 6.5H5"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}
