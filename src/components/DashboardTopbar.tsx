import Link from 'next/link'

export function DashboardTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-white border-b border-black/8 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-[15px] font-semibold text-navy">{title}</h1>
        {subtitle && <p className="text-xs text-navy/50 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-2.5">
        <Link
          href="/dashboard/settings"
          className="px-3.5 py-2 rounded-xl border border-black/10 text-xs font-medium text-navy/60 hover:bg-surface transition-colors"
        >
          Edit profile
        </Link>
        <Link
          href="/pricing"
          className="px-3.5 py-2 rounded-xl bg-teal text-navy text-xs font-semibold hover:bg-teal-dim transition-colors"
        >
          Upgrade to Optimiser
        </Link>
      </div>
    </div>
  )
}
