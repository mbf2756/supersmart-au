import { getStripeInstance } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = (await headers()).get('stripe-signature')!
  const stripe = getStripeInstance()

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Lazy supabase admin client
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (!userId) break
      await supabaseAdmin.from('subscriptions').update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        plan: session.metadata?.plan ?? 'optimiser',
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object
      await supabaseAdmin.from('subscriptions').update({
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabaseAdmin.from('subscriptions').update({
        plan: 'free', status: 'active', updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }
  }
  return NextResponse.json({ received: true })
}
