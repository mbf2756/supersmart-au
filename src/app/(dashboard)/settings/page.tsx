import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SettingsClient } from './SettingsClient'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Settings' }
export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: superProfile }, { data: subscription }] = await Promise.all([
    supabase.from('super_profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user!.id).single(),
  ])
  return <>
    <DashboardTopbar title="Settings" subtitle="Update your super profile and manage your subscription" />
    <div className="p-8"><SettingsClient superProfile={superProfile} subscription={subscription} /></div>
  </>
}
