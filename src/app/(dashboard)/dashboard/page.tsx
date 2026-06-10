import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardTopbar } from '@/components/DashboardTopbar'
import { DashboardClient } from '@/components/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Super Health Score' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: superProfile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('super_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  // If profile hasn't been set up yet (no salary entered), send to settings first
  const profileIsEmpty = !superProfile?.salary || superProfile.salary === 80000 && superProfile.current_balance === 0

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
          profileIsEmpty={profileIsEmpty}
        />
      </div>
    </>
  )
}
