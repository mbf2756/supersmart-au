import { DashboardTopbar } from '@/components/DashboardTopbar'
import { FundsClient } from './FundsClient'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fund Comparison' }

export default async function FundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase
    .from('super_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <>
      <DashboardTopbar
        title="Fund comparison"
        subtitle="How your fund and option compares — based on your profile"
      />
      <div className="p-8">
        <FundsClient superProfile={superProfile} />
      </div>
    </>
  )
}
