'use client'
import { Button } from './Button'
import { useRouter } from 'next/navigation'

export function Paywall({ feature, requiredPlan = 'optimiser' }: { 
  feature: string; requiredPlan?: string 
}) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 bg-navy/5 rounded-full flex items-center justify-center text-xl mb-4">🔒</div>
      <h3 className="text-lg font-semibold text-navy mb-2">{feature}</h3>
      <p className="text-sm text-navy/60 max-w-xs mb-6">
        This feature is included in the {requiredPlan === 'optimiser' ? 'Optimiser' : 'Retirement Planner'} plan.
      </p>
      <Button variant="teal" onClick={() => router.push('/pricing')}>
        Upgrade — from $60/quarter
      </Button>
    </div>
  )
}
