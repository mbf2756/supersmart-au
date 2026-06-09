'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types'

const NAV = [
  { group: 'Your super', items: [
    { href: '/dashboard', label: 'Health score', icon: '⬡' },
    { href: '/dashboard/contributions', label: 'Contributions', icon: '↑', badge: '3' },
    { href: '/dashboard/fees', label: 'Fee analyser', icon: '$' },
    { href: '/dashboard/funds', label: 'Fund compare', icon: '≡' },
  ]},
  { group: 'Retirement', items: [
    { href: '/dashboard/div296', label: 'Div 296 exposure', icon: '⚠', badge: '!' },
    { href: '/dashboard/salary', label: 'Salary sacrifice', icon: '⇄' },
    { href: '/dashboard/spouse', label: 'Spouse analysis', icon: '◑' },
    { href: '/dashboard/smsf', label: 'SMSF analytics', icon: '◈' },
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
    <nav className="w-[220px] min-h-screen bg-navy flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/5">
        <div className="font-mono text-[10px] text-teal tracking-[0.15em] uppercase mb-0.5">AU · SUPER</div>
        <div className="text-[18px] font-semibold text-white tracking-tight">SuperSmart</div>
        <div className="text-[11px] text-slate mt-0.5">Optimisation Platform</div>
      </div>

      {/* Nav */}
      <div className="py-2 flex-1 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.group}>
            <div className="px-5 pt-3 pb-1 text-[10px] font-medium text-slate/70 uppercase tracking-[0.1em]">
              {group.group}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-5 py-[9px] text-[13px] border-l-2 transition-all ${
                    active
                      ? 'text-teal bg-teal/10 border-teal font-medium'
                      : 'text-white/50 border-transparent hover:text-white hover:bg-white/4'
                  }`}
                >
                  <span className="w-4 text-center text-sm flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item as any).badge && (
                    <span className="text-[9px] bg-amber-400 text-navy px-1.5 py-0.5 rounded-full font-bold">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            subscription?.plan === 'free'
              ? 'bg-white/5 text-slate'
              : 'bg-teal/10 text-teal'
          }`}>
            {subscription?.plan === 'free' ? 'Free plan' : subscription?.plan ?? 'Free'}
          </span>
          {subscription?.plan === 'free' && (
            <Link href="/pricing" className="text-[11px] text-teal hover:underline">
              Upgrade →
            </Link>
          )}
        </div>
        <Link href="/dashboard/settings" className="block text-[12px] text-slate/60 hover:text-slate transition-colors">
          Settings
        </Link>
        <button
          onClick={signOut}
          className="text-[12px] text-slate/50 hover:text-slate transition-colors"
        >
          Sign out
        </button>
        <p className="text-[10px] text-slate/40 leading-relaxed">
          General information only. Not financial advice.
        </p>
      </div>
    </nav>
  )
}
