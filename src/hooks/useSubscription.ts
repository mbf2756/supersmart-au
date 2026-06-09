'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Subscription } from '@/types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) setSubscription(data as Subscription)
        setLoading(false)
      })
  }, [])

  function canAccess(feature: string): boolean {
    if (!subscription) return false
    if (subscription.plan === 'retirement') return true
    if (subscription.plan === 'optimiser') {
      return ![
        'ttr_strategy', 'age_pension', 'drawdown_sequencing',
        'transfer_balance_planner', 'couple_planning',
      ].includes(feature)
    }
    // Free plan
    return ['health_score', 'fee_drag', 'apra_status', 'div296_basic', 'fund_compare_basic'].includes(feature)
  }

  function hasSmsf(): boolean {
    return (subscription?.add_ons?.includes('smsf') ?? false) ||
      subscription?.plan === 'retirement'
  }

  return { subscription, loading, canAccess, hasSmsf }
}
