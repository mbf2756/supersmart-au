import { getStripeInstance } from '@/lib/stripe'
import { NextResponse } from 'next/server'

function formatDiscount(coupon: { percent_off?: number | null; amount_off?: number | null; currency?: string | null }): string {
  if (coupon.percent_off) return `${coupon.percent_off}% off`
  if (coupon.amount_off) return `$${(coupon.amount_off / 100).toFixed(0)} off`
  return 'discount applied'
}

function formatDuration(coupon: { duration: string; duration_in_months?: number | null }): string {
  if (coupon.duration === 'forever') return 'forever'
  if (coupon.duration === 'once') return 'first year'
  if (coupon.duration === 'repeating' && coupon.duration_in_months) {
    return `for ${coupon.duration_in_months} months`
  }
  return ''
}

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code?.trim()) {
    return NextResponse.json({ valid: false, error: 'Please enter a coupon code.' })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ valid: false, error: 'Payments not configured yet.' })
  }

  const stripe = getStripeInstance()

  try {
    // First try as a promotion code (most common — these are the human-readable codes)
    const promoCodes = await stripe.promotionCodes.list({
      code: code.trim().toUpperCase(),
      active: true,
      limit: 1,
    })

    if (promoCodes.data.length > 0) {
      const promo = promoCodes.data[0]
      const coupon = promo.coupon
      if (!coupon.valid) {
        return NextResponse.json({ valid: false, error: 'This coupon has expired.' })
      }
      const discount = formatDiscount(coupon)
      const duration = formatDuration(coupon)
      const label = `$${coupon.amount_off ? ((149 * 100 - coupon.amount_off) / 100).toFixed(0) : Math.round(149 * (1 - (coupon.percent_off ?? 0) / 100))}/yr`
      return NextResponse.json({
        valid: true,
        label,
        description: `${discount}${duration ? ' ' + duration : ''} — applied at checkout`,
      })
    }

    // Try as a coupon name
    const coupons = await stripe.coupons.list({ limit: 100 })
    const matched = coupons.data.find(
      c => c.name?.toUpperCase() === code.trim().toUpperCase() && c.valid
    )
    if (matched) {
      const discount = formatDiscount(matched)
      const duration = formatDuration(matched)
      const label = `$${matched.amount_off ? ((149 * 100 - matched.amount_off) / 100).toFixed(0) : Math.round(149 * (1 - (matched.percent_off ?? 0) / 100))}/yr`
      return NextResponse.json({
        valid: true,
        label,
        description: `${discount}${duration ? ' ' + duration : ''} — applied at checkout`,
      })
    }

    return NextResponse.json({ valid: false, error: 'Coupon not found. Check the code and try again.' })

  } catch (err: unknown) {
    console.error('Coupon validation error:', err)
    return NextResponse.json({ valid: false, error: 'Could not validate coupon. Please try again.' })
  }
}
