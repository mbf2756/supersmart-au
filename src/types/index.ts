export interface SuperProfile {
  id: string
  user_id: string
  age: number
  salary: number
  current_balance: number
  fund_name: string
  fund_option: string
  fund_fee_pct: number
  employer_sg_rate: number
  target_retirement_age: number
  has_spouse: boolean
  spouse_balance?: number
  spouse_income?: number
  spouse_fund_name?: string
  has_smsf: boolean
  account_count: number
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  plan: 'free' | 'optimiser' | 'retirement'
  add_ons: string[]
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_end?: string
  cancel_at_period_end: boolean
}

export interface SavedCalculation {
  id: string
  user_id: string
  module: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
  notes?: string
  created_at: string
}

export interface SmsfHolding {
  id: string
  user_id: string
  ticker: string
  value: number
  asset_class: string
  notes?: string
}
