import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SalaryClient } from './SalaryClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Salary Sacrifice Optimiser' }
export default async function SalaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase.from('super_profiles').select('*').eq('user_id', user!.id).single()
  return <>
    <DashboardTopbar title="Salary sacrifice optimiser" subtitle="Calculate your tax saving from salary sacrificing into super" />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="Salary sacrifice optimiser" pageIcon="💼">
        <SalaryClient superProfile={superProfile} />
      </ProfileGate>
    </div>
  </>
}
