import { DashboardTopbar } from '@/components/DashboardTopbar'
import { RetirementScoreClient } from './RetirementScoreClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Retirement Readiness Score' }

export default async function RetirementScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase
    .from('super_profiles').select('*').eq('user_id', user!.id).single()
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user!.id).single()

  return (
    <>
      <DashboardTopbar
        title="Retirement readiness score"
        subtitle="How prepared are you for retirement income — personalised to your trajectory"
      />
      <div className="p-8">
        <ProfileGate superProfile={superProfile} pageName="Retirement readiness score" pageIcon="🎯">
          <RetirementScoreClient superProfile={superProfile} subscription={subscription} />
        </ProfileGate>
      </div>
    </>
  )
}
