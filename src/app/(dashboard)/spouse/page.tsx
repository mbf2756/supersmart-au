import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SpouseClient } from './SpouseClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Spouse Contribution Analysis' }
export default async function SpousePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase.from('super_profiles').select('*').eq('user_id', user!.id).single()
  return <>
    <DashboardTopbar title="Spouse contribution analysis" subtitle="Spouse tax offset and balance equalisation modelling" />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="Spouse strategy" pageIcon="👫">
        <SpouseClient superProfile={superProfile} />
      </ProfileGate>
    </div>
  </>
}
