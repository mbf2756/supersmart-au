import { cn } from '@/lib/utils'

type Variant = 'primary' | 'teal' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-mid',
  teal: 'bg-teal text-navy font-semibold hover:bg-teal-dim',
  ghost: 'bg-transparent border border-black/10 text-navy/70 hover:bg-surface',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export function Button({ variant = 'primary', className, children, ...props }: 
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
        'text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
