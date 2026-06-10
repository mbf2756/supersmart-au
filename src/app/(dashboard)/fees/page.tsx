import { DashboardTopbar } from '@/components/DashboardTopbar'
import { FeesClient } from './FeesClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Fee Analyser' }
export default async function FeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase.from('super_profiles').select('*').eq('user_id', user!.id).single()
  return <>
    <DashboardTopbar title="Fee analyser" subtitle="The true cost of your fund's fees — and what switching could mean for your retirement" />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="Fee analyser" pageIcon="💸">
        <FeesClient superProfile={superProfile} />
      </ProfileGate>
    </div>
  </>
}
