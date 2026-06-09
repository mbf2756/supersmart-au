// Stripe is lazily required at runtime to avoid build-time env var errors

export function getStripeInstance() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require('stripe')
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
}

export const PLANS = {
  free: {
    name: 'Essential',
    price: 0,
    modules: ['health_score', 'fee_drag', 'apra_status', 'div296_basic'],
  },
  optimiser: {
    name: 'Optimiser',
    yearlyPrice: 149,
    monthlyPrice: 14.99,
    yearlyPriceId: process.env.STRIPE_PRICE_OPTIMISER_YEARLY ?? '',
    monthlyPriceId: process.env.STRIPE_PRICE_OPTIMISER_MONTHLY ?? '',
    modules: ['health_score', 'fee_drag', 'fund_compare', 'carry_forward', 'salary_sacrifice', 'spouse_contribution', 'div296_full'],
  },
  retirement: {
    name: 'Retirement Planner',
    yearlyPrice: 299,
    yearlyPriceId: process.env.STRIPE_PRICE_RETIREMENT_YEARLY ?? '',
    modules: ['all'],
  },
} as const

export type PlanKey = keyof typeof PLANS
