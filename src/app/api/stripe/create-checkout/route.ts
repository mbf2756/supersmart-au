import { getStripeInstance } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { plan, billing = 'yearly', couponCode } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Select price ID based on billing period
    const priceId = billing === 'quarterly'
      ? process.env.STRIPE_PRICE_OPTIMISER_QUARTERLY
      : process.env.STRIPE_PRICE_OPTIMISER_YEARLY

    if (!priceId) {
      const missing = billing === 'quarterly' ? 'STRIPE_PRICE_OPTIMISER_QUARTERLY' : 'STRIPE_PRICE_OPTIMISER_YEARLY'
      console.error(`${missing} is not set in environment`)
      return NextResponse.json(
        { error: `Stripe error: ${missing} is not configured. Please contact support@smartsuperau.com.` },
        { status: 503 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe error: STRIPE_SECRET_KEY is not configured.' }, { status: 503 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartsuperau.com'
    const stripe = getStripeInstance()

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
      customer_email: user.email,
      metadata: { userId: user.id, plan: plan ?? 'optimiser', billing },
      subscription_data: { metadata: { userId: user.id, plan: plan ?? 'optimiser', billing } },
      allow_promotion_codes: true,
    }

    if (couponCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 })
        if (promoCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }]
          delete sessionParams.allow_promotion_codes
        } else {
          return NextResponse.json({ error: 'Coupon code not found or expired.' }, { status: 400 })
        }
      } catch (err) {
        console.error('Coupon error:', err)
        return NextResponse.json({ error: 'Could not apply coupon. Please try without it.' }, { status: 400 })
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe checkout error:', message)
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 })
  }
}
