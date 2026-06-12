import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SmsfClient } from './SmsfClient'
import { ProfileGate } from '@/components/ProfileGate'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'SMSF Analytics' }
export default async function SmsfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: superProfile }, { data: holdings }, { data: subscription }] = await Promise.all([
    supabase.from('super_profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('smsf_holdings').select('*').eq('user_id', user!.id),
    supabase.from('subscriptions').select('plan,add_ons').eq('user_id', user!.id).single(),
  ])
  return <>
    <DashboardTopbar title="SMSF ETF portfolio" subtitle="Holdings tracker · overlap detection · TBAR deadlines · pension drawdown" />
    <div className="p-8">
      <ProfileGate superProfile={superProfile} pageName="SMSF ETF portfolio" pageIcon="🏦">
        <SmsfClient holdings={holdings ?? []} subscription={subscription} />
      </ProfileGate>
    </div>
  </>
}
