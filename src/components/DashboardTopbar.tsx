import Link from 'next/link'

export function DashboardTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-white sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(15,30,60,0.08)' }}>
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color: '#0F1E3C' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(15,30,60,0.5)' }}>{subtitle}</p>}
      </div>
      <div className="flex gap-2.5">
        <Link
          href="/settings"
          className="px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ border: '1px solid rgba(15,30,60,0.1)', color: 'rgba(15,30,60,0.6)' }}
        >
          Edit profile
        </Link>
        <Link
          href="/pricing"
          className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: '#00D4AA', color: '#0F1E3C' }}
        >
          Upgrade →
        </Link>
      </div>
    </div>
  )
}
