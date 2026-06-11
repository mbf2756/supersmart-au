import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { SubscriptionProvider } from '@/components/SubscriptionContext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <SubscriptionProvider subscription={subscription}>
      <div className="flex min-h-screen bg-surface">
        <Sidebar subscription={subscription} />
        <main className="ml-[220px] flex-1 min-h-screen flex flex-col">
          {children}
        </main>
      </div>
    </SubscriptionProvider>
  )
}
