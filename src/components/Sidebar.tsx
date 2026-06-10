'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types'

const NAV = [
  { group: 'Your super', items: [
    { href: '/dashboard', label: 'Health score', icon: '⬡' },
    { href: '/contributions', label: 'Contributions', icon: '↑', badge: '3' },
    { href: '/fees', label: 'Fee analyser', icon: '$' },
    { href: '/funds', label: 'Fund compare', icon: '≡' },
  ]},
  { group: 'Retirement', items: [
    { href: '/div296', label: 'Div 296 exposure', icon: '⚠', badge: '!' },
    { href: '/salary', label: 'Salary sacrifice', icon: '⇄' },
    { href: '/spouse', label: 'Spouse analysis', icon: '◑' },
    { href: '/smsf', label: 'SMSF analytics', icon: '◈' },
  ]},
]

export function Sidebar({ subscription }: { subscription: Subscription | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      className="w-[220px] min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50"
      style={{ backgroundColor: '#0F1E3C' }}
    >

      {/* Logo */}
      <div
        className="px-5 pt-6 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="font-mono text-[10px] tracking-[0.15em] uppercase mb-0.5"
          style={{ color: '#00D4AA' }}
        >
          AU · SUPER
        </div>
        <div
          className="text-[18px] font-semibold tracking-tight"
          style={{ color: '#FFFFFF' }}
        >
          SuperSmart
        </div>
        <div
          className="text-[11px] mt-0.5"
          style={{ color: '#8A9BB5' }}
        >
          Optimisation Platform
        </div>
      </div>

      {/* Nav */}
      <div className="py-2 flex-1 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.group}>
            <div
              className="px-5 pt-3 pb-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ color: 'rgba(138,155,181,0.7)' }}
            >
              {group.group}
            </div>
            {group.items.map((item: { href: string; label: string; icon: string; badge?: string }) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-5 py-[9px] text-[13px] transition-all"
                  style={{
                    color: active ? '#00D4AA' : 'rgba(255,255,255,0.5)',
                    background: active ? 'rgba(0,212,170,0.1)' : 'transparent',
                    borderLeft: active ? '2px solid #00D4AA' : '2px solid transparent',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  <span className="w-4 text-center text-sm flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: '#F5A623', color: '#0F1E3C' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 space-y-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: subscription?.plan === 'free'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,212,170,0.12)',
              color: subscription?.plan === 'free' ? '#8A9BB5' : '#00D4AA',
            }}
          >
            {subscription?.plan === 'free' ? 'Free plan' : subscription?.plan ?? 'Free'}
          </span>
          {subscription?.plan === 'free' && (
            <Link
              href="/pricing"
              className="text-[11px] font-medium hover:underline"
              style={{ color: '#00D4AA' }}
            >
              Upgrade →
            </Link>
          )}
        </div>
        <Link
          href="/settings"
          className="block text-[12px] transition-colors"
          style={{ color: 'rgba(138,155,181,0.6)' }}
        >
          Settings
        </Link>
        <button
          onClick={signOut}
          style={{
            color: 'rgba(138,155,181,0.5)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
          }}
        >
          Sign out
        </button>
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: 'rgba(138,155,181,0.4)' }}
        >
          General information only. Not financial advice.
          Always consider your personal circumstances.
        </p>
      </div>
    </nav>
  )
}
