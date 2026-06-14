import { DashboardTopbar } from '@/components/DashboardTopbar'
import { ActionPlanClient } from './ActionPlanClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Annual Super Action Plan' }

export default async function ActionPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase
    .from('super_profiles').select('*').eq('user_id', user!.id).single()
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user!.id).single()
  const { data: smsfHoldings } = await supabase
    .from('smsf_holdings').select('*').eq('user_id', user!.id)

  return (
    <>
      <DashboardTopbar
        title="Annual super action plan"
        subtitle="Your top opportunities — personalised, ranked by dollar impact"
      />
      <div className="p-8">
        <ProfileGate superProfile={superProfile} pageName="Annual action plan" pageIcon="⚡">
          <ActionPlanClient
            superProfile={superProfile}
            subscription={subscription}
            smsfHoldings={smsfHoldings ?? []}
          />
        </ProfileGate>
      </div>
    </>
  )
}
