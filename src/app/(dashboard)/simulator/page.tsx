import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SimulatorClient } from './SimulatorClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'What-If Simulator' }

export default async function SimulatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase
    .from('super_profiles').select('*').eq('user_id', user!.id).single()
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user!.id).single()

  return (
    <>
      <DashboardTopbar
        title="What-if simulator"
        subtitle="Test retirement scenarios in real time — see the impact of every decision"
      />
      <div className="p-8">
        <ProfileGate superProfile={superProfile} pageName="What-if simulator" pageIcon="⚡">
          <SimulatorClient superProfile={superProfile} subscription={subscription} />
        </ProfileGate>
      </div>
    </>
  )
}
