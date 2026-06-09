import { cn } from '@/lib/utils'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-black/10 p-6', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-[11px] font-medium text-navy/50 uppercase tracking-widest mb-1.5', className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-black/10 p-5">
      <div className="text-[11px] font-medium text-navy/50 uppercase tracking-widest mb-1">{label}</div>
      <div className={cn('font-mono text-2xl font-medium tracking-tight', accent ? 'text-teal' : 'text-navy')}>
        {value}
      </div>
      {sub && <div className="text-xs text-navy/50 mt-0.5">{sub}</div>}
    </div>
  )
}
