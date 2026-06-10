import { DashboardTopbar } from '@/components/DashboardTopbar'
import { Div296Client } from './Div296Client'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Division 296 Exposure' }
export default async function Div296Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase.from('super_profiles').select('*').eq('user_id', user!.id).single()
  return <>
    <DashboardTopbar title="Division 296 exposure" subtitle="Model your exposure to the $3M super tax commencing 1 July 2026" />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="Division 296 modeller" pageIcon="📊">
        <Div296Client superProfile={superProfile} />
      </ProfileGate>
    </div>
  </>
}
