import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  prefix?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, prefix, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="flex items-center gap-2 text-xs font-medium text-navy/60 uppercase tracking-wide">
            {label}
            {hint && <span className="normal-case font-normal">{hint}</span>}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 text-sm pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl border border-black/10 font-mono text-sm text-navy',
              'focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20',
              'placeholder:text-navy/30',
              prefix && 'pl-7',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export function Select({ label, children, className, ...props }: 
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-navy/60 uppercase tracking-wide">{label}</label>
      )}
      <select
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm text-navy bg-white',
          'focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
