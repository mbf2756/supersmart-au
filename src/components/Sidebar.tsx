'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types'

// ── FREE items are always visible and usable
// ── PAID items show with a lock badge for free users — click goes to /pricing
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

      {/* Logo */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
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
                <Link
                  key={item.href}
                  href={dest}
                  className="flex items-center gap-2.5 px-5 py-[9px] text-[13px] transition-all"
                  style={{
                    color: active
                      ? '#00D4AA'
                      : locked
                      ? 'rgba(255,255,255,0.28)'
                      : 'rgba(255,255,255,0.55)',
                    background: active ? 'rgba(0,212,170,0.1)' : 'transparent',
                    borderLeft: active ? '2px solid #00D4AA' : '2px solid transparent',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <span className="w-4 text-center text-sm flex-shrink-0" style={{ opacity: locked ? 0.45 : 1 }}>
                    {item.icon}
                  </span>
                  <span className="flex-1" style={{ opacity: locked ? 0.6 : 1 }}>{item.label}</span>
                  {locked && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em' }}>🔒</span>
                  )}
                  {!locked && item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: '#F5A623', color: '#0F1E3C' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Upgrade nudge at bottom of paid group for free users */}
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

      {/* Footer */}
      <div className="px-5 py-4 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: isPaid ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.06)',
              color:      isPaid ? '#00D4AA'               : '#8A9BB5',
            }}>
            {isPaid ? 'Subscriber' : 'Free plan'}
          </span>
          {!isPaid && (
            <Link href="/pricing" className="text-[11px] font-medium hover:underline" style={{ color: '#00D4AA' }}>
              Upgrade →
            </Link>
          )}
        </div>
        <Link href="/settings"
          className="flex items-center gap-2 text-[12px] transition-colors hover:text-white"
          style={{ color: pathname === '/settings' ? 'white' : 'rgba(138,155,181,0.6)' }}>
          <span style={{ fontSize: 12 }}>✎</span> Edit profile
        </Link>
        <button onClick={signOut} className="text-[12px] transition-colors hover:text-white"
          style={{ color: 'rgba(138,155,181,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Sign out
        </button>
        <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(138,155,181,0.35)' }}>
          General information only. Not financial advice.
        </p>
      </div>
    </nav>
  )
}
