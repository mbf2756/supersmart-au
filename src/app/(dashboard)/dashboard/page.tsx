import { createClient } from '@/lib/supabase/server'
import { DashboardTopbar } from '@/components/DashboardTopbar'
import { DashboardClient } from '@/components/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Super Health Score' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: superProfile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('super_profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user!.id).single(),
  ])

  return (
    <>
      <DashboardTopbar
        title="Super health score"
        subtitle="Your personalised super overview — updated as at June 2026"
      />
      <div className="p-8">
        <DashboardClient
          profile={profile}
          superProfile={superProfile}
          subscription={subscription}
        />
      </div>
    </>
  )
}
