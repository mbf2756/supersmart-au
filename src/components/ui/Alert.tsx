import { cn } from '@/lib/utils'

type AlertVariant = 'danger' | 'warning' | 'success' | 'info'

const styles: Record<AlertVariant, string> = {
  danger: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-teal/10 border-teal/30 text-teal-900',
  info: 'bg-navy/5 border-navy/10 text-navy/70',
}

const icons: Record<AlertVariant, string> = {
  danger: '⚠', warning: '⚠', success: '✓', info: 'ℹ',
}

export function Alert({ variant = 'info', title, children, className }: {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', styles[variant], className)}>
      <span className="text-base flex-shrink-0 mt-px">{icons[variant]}</span>
      <div className="leading-relaxed">
        {title && <div className="font-medium mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  )
}
