import { cn } from '@/lib/utils'

export function ResultBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-navy rounded-xl p-5 space-y-1 mt-4', className)}>
      <div className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-3">Result</div>
      {children}
    </div>
  )
}

export function ResultRow({ label, value, accent }: { label: string; value: string; accent?: 'teal' | 'amber' | 'red' }) {
  const colors = { teal: 'text-teal', amber: 'text-amber-400', red: 'text-red-400' }
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className={cn('font-mono text-sm font-medium text-white', accent && colors[accent])}>
        {value}
      </span>
    </div>
  )
}
