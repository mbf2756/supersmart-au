import { getStripeInstance } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { plan, couponCode } = await request.json()

    // Check auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Check price ID is configured
    const priceId = process.env.STRIPE_PRICE_OPTIMISER_YEARLY
    if (!priceId) {
      console.error('STRIPE_PRICE_OPTIMISER_YEARLY is not set')
      return NextResponse.json(
        { error: 'Payments not configured. Please contact support@smartsuperau.com.' },
        { status: 503 }
      )
    }

    // Check Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set')
      return NextResponse.json(
        { error: 'Stripe secret key not configured.' },
        { status: 503 }
      )
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
      metadata: { userId: user.id, plan: plan ?? 'optimiser' },
      subscription_data: { metadata: { userId: user.id, plan: plan ?? 'optimiser' } },
      allow_promotion_codes: true,
    }

    // Apply coupon if provided
    if (couponCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: couponCode,
          active: true,
          limit: 1,
        })
        if (promoCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }]
          delete sessionParams.allow_promotion_codes
        } else {
          return NextResponse.json({ error: 'Coupon code not found or expired.' }, { status: 400 })
        }
      } catch (couponErr) {
        console.error('Coupon lookup error:', couponErr)
        return NextResponse.json({ error: 'Could not apply coupon. Please proceed without it.' }, { status: 400 })
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    // Log the real error server-side, return safe message to client
    const message = err instanceof Error ? err.message : String(err)
    console.error('Stripe checkout error:', message)

    // Return the actual Stripe error message so you can debug
    return NextResponse.json(
      { error: `Stripe error: ${message}` },
      { status: 500 }
    )
  }
}
