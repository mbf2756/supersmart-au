import { getStripeInstance } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { plan, couponCode } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Price ID lives server-side only — never exposed to client
  const priceId = process.env.STRIPE_PRICE_OPTIMISER_YEARLY
  if (!priceId) {
    return NextResponse.json(
      { error: 'Stripe is not configured yet. Please check back soon or contact support@smartsuperau.com.' },
      { status: 503 }
    )
  }

  const stripe = getStripeInstance()

  // Build checkout session params
  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    customer_email: user.email,
    metadata: { userId: user.id, plan: plan ?? 'optimiser' },
    subscription_data: { metadata: { userId: user.id, plan: plan ?? 'optimiser' } },
    // Allow customers to enter coupon codes at checkout even without one pre-applied
    allow_promotion_codes: true,
  }

  // Pre-apply a coupon code if provided
  if (couponCode) {
    try {
      // Look up the coupon in Stripe to validate it
      const coupons = await stripe.coupons.list({ limit: 100 })
      const matchedCoupon = coupons.data.find(
        c => c.name?.toUpperCase() === couponCode.toUpperCase() && c.valid
      )
      // Also check promotion codes (which map to coupons)
      if (matchedCoupon) {
        sessionParams.discounts = [{ coupon: matchedCoupon.id }]
        // When using discounts, allow_promotion_codes must be false
        delete sessionParams.allow_promotion_codes
      } else {
        // Try as a promotion code
        const promoCodes = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 })
        if (promoCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }]
          delete sessionParams.allow_promotion_codes
        } else {
          return NextResponse.json({ error: 'Coupon code not found or expired.' }, { status: 400 })
        }
      }
    } catch (err: unknown) {
      console.error('Coupon lookup error:', err)
      return NextResponse.json({ error: 'Could not apply coupon. Please try without it.' }, { status: 400 })
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return NextResponse.json({ url: session.url })
}
