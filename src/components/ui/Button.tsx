import { cn } from '@/lib/utils'

type Variant = 'primary' | 'teal' | 'ghost' | 'danger'

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: '#0F1E3C', color: 'white' },
  teal:    { background: '#00D4AA', color: '#0F1E3C', fontWeight: 600 },
  ghost:   { background: 'transparent', border: '1px solid rgba(15,30,60,0.12)', color: 'rgba(15,30,60,0.7)' },
  danger:  { background: '#DC2626', color: 'white' },
}

export function Button({ variant = 'primary', className, style, children, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
        'text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
