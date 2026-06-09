import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SmsfClient } from './SmsfClient'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'SMSF Analytics' }
export default async function SmsfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: holdings } = await supabase.from('smsf_holdings').select('*').eq('user_id', user!.id)
  const { data: subscription } = await supabase.from('subscriptions').select('plan,add_ons').eq('user_id', user!.id).single()
  return <>
    <DashboardTopbar title="SMSF analytics" subtitle="ETF overlap detection, TBAR deadlines, and minimum pension tracking" />
    <div className="p-8"><SmsfClient holdings={holdings ?? []} subscription={subscription} /></div>
  </>
}
