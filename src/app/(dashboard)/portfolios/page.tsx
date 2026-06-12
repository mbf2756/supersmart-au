import { DashboardTopbar } from '@/components/DashboardTopbar'
import { PortfoliosClient } from './PortfoliosClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Model portfolios' }

export default async function PortfoliosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: superProfile } = await supabase
    .from('super_profiles').select('*').eq('user_id', user!.id).single()
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user!.id).single()

  return <>
    <DashboardTopbar
      title="Model ETF portfolios"
      subtitle="ETF model portfolios for ChoicePlus, Member Direct, and SMSF — with fee and overlap analysis"
    />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="Model ETF portfolios" pageIcon="📈">
        <PortfoliosClient superProfile={superProfile} subscription={subscription} />
      </ProfileGate>
    </div>
  </>
}
