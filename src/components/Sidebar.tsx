'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types'

const NAV = [
  { group: 'Free tools', items: [
    { href: '/dashboard',     label: 'Health score',    icon: '⬡',  paid: false },
    { href: '/fees',          label: 'Fee analyser',    icon: '$',   paid: false },
    { href: '/funds',         label: 'Fund comparison', icon: '≡',   paid: false },
    { href: '/contributions', label: 'Contributions',   icon: '↑',   paid: false, badge: '3' },
  ]},
  { group: 'Subscriber tools', items: [
    { href: '/portfolios',    label: 'Model portfolios',   icon: '📈',  paid: true },
    { href: '/salary',        label: 'Salary sacrifice',   icon: '⇄',   paid: true },
    { href: '/div296',        label: 'Div 296 exposure',   icon: '⚠',   paid: true, badge: '!' },
    { href: '/spouse',        label: 'Spouse analysis',    icon: '◑',   paid: true },
    { href: '/smsf',          label: 'SMSF analytics',     icon: '◈',   paid: true },
  ]},
]

export function Sidebar({ subscription }: { subscription: Subscription | null }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const isPaid   = subscription?.plan && subscription.plan !== 'free'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="w-[220px] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50"
      style={{ backgroundColor: '#0F1E3C' }}>

      {/* Logo — clickable, navigates to dashboard */}
      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <div className="px-5 pt-6 pb-4 transition-opacity hover:opacity-80"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase mb-0.5" style={{ color: '#00D4AA' }}>
            AU · SUPER
          </div>
          <div className="text-[19px] font-semibold tracking-tight" style={{ color: '#FFFFFF' }}>
            SmartSuper AU
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#8A9BB5' }}>
            Optimisation Platform
          </div>
        </div>
      </Link>

      {/* Nav */}
      <div className="py-2 flex-1 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.group}>
            <div className="px-5 pt-4 pb-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: 'rgba(138,155,181,0.55)' }}>
              {group.group}
            </div>

            {group.items.map((item: { href: string; label: string; icon: string; paid: boolean; badge?: string }) => {
              const active  = pathname === item.href
              const locked  = item.paid && !isPaid
              const dest    = locked ? '/pricing' : item.href

              return (
                <Link key={item.href} href={dest}
                  className="flex items-center gap-2.5 px-5 py-[9px] text-[13px] transition-all"
                  style={{
                    color: active ? '#00D4AA' : locked ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)',
                    background: active ? 'rgba(0,212,170,0.1)' : 'transparent',
                    borderLeft: active ? '2px solid #00D4AA' : '2px solid transparent',
                    fontWeight: active ? 500 : 400,
                  }}>
                  <span className="w-4 text-center text-sm flex-shrink-0" style={{ opacity: locked ? 0.45 : 1 }}>
                    {item.icon}
                  </span>
                  <span className="flex-1" style={{ opacity: locked ? 0.6 : 1 }}>{item.label}</span>
                  {locked && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>🔒</span>}
                  {!locked && item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: '#F5A623', color: '#0F1E3C' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {group.group === 'Subscriber tools' && !isPaid && (
              <Link href="/pricing"
                className="mx-4 mt-2 mb-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', textDecoration: 'none' }}>
                Unlock all tools →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer — clearly visible action buttons */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Plan badge + Upgrade */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: isPaid ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.08)',
              color:      isPaid ? '#00D4AA' : '#8A9BB5',
            }}>
            {isPaid ? 'Subscriber ✓' : 'Free plan'}
          </span>
          {!isPaid && (
            <Link href="/pricing" className="text-[11px] font-semibold hover:underline" style={{ color: '#00D4AA' }}>
              Upgrade →
            </Link>
          )}
        </div>

        {/* Action buttons — solid, clearly tappable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Edit profile */}
          <Link href="/settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
              fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
              background: pathname === '/settings' ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = pathname === '/settings' ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)')}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <path d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5z"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit profile
          </Link>

          {/* Contact support */}
          <Link href="/contact"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
              fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
              background: pathname === '/contact' ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = pathname === '/contact' ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)')}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1.5 2.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M1.5 3.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Contact support
          </Link>

          {/* Sign out — red-tinted, clearly destructive */}
          <button onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10, width: '100%',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: '#FCA5A5', textAlign: 'left',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <path d="M5 1.5H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1H5M9 9.5l2.5-3L9 3.5M11.5 6.5H5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>

        <p className="text-[10px] leading-relaxed mt-3" style={{ color: 'rgba(138,155,181,0.35)' }}>
          General information only. Not financial advice.
        </p>
      </div>
    </nav>
  )
}
