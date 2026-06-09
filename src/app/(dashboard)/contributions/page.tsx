import { DashboardTopbar } from '@/components/DashboardTopbar'
import { ContributionsClient } from './ContributionsClient'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contributions Optimiser' }

export default async function ContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase.from('super_profiles').select('*').eq('user_id', user!.id).single()
  const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).single()
  return (
    <>
      <DashboardTopbar title="Contribution optimiser" subtitle="Concessional cap, carry-forward rules, and bring-forward modelling" />
      <div className="p-8"><ContributionsClient superProfile={superProfile} subscription={subscription} /></div>
    </>
  )
}
