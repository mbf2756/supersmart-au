'use client'
import { createContext, useContext } from 'react'
import type { Subscription } from '@/types'

const SubscriptionContext = createContext<Subscription | null>(null)

export function SubscriptionProvider({
  subscription,
  children,
}: {
  subscription: Subscription | null
  children: React.ReactNode
}) {
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
