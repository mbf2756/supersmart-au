import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SimulatorClient } from './SimulatorClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Advanced Modelling' }

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
        title="Advanced modelling"
        subtitle="Compare retirement ages, investment options, and strategies side by side"
      />
      <div className="p-8">
        <ProfileGate superProfile={superProfile} pageName="What-if simulator" pageIcon="⚡">
          <SimulatorClient superProfile={superProfile} subscription={subscription} />
        </ProfileGate>
      </div>
    </>
  )
}
