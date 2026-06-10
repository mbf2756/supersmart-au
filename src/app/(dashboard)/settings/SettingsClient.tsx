'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SettingsClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    age: sp?.age ?? 40,
    salary: sp?.salary ?? 80000,
    current_balance: sp?.current_balance ?? 0,
    fund_name: sp?.fund_name ?? '',
    fund_option: sp?.fund_option ?? 'Balanced',
    fund_fee_pct: sp?.fund_fee_pct ?? 0.78,
    employer_sg_rate: sp?.employer_sg_rate ?? 12,
    target_retirement_age: sp?.target_retirement_age ?? 65,
    account_count: sp?.account_count ?? 1,
    has_spouse: sp?.has_spouse ?? false,
    spouse_income: sp?.spouse_income ?? 0,
    spouse_balance: sp?.spouse_balance ?? 0,
  })

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setSaving(false); return }

      const { error: dbError } = await supabase
        .from('super_profiles')
        .upsert({ ...form, user_id: user.id }, { onConflict: 'user_id' })

      if (dbError) {
        setError(dbError.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  async function manageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Super profile card */}
      <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
        <div
          className="text-[11px] font-medium uppercase tracking-widest mb-6"
          style={{ color: 'rgba(15,30,60,0.4)' }}
        >
          Super profile
        </div>

        <div className="grid grid-cols-2 gap-5">

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Age
            </label>
            <input
              type="number"
              value={form.age}
              onChange={e => set('age', +e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Annual salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(15,30,60,0.4)' }}>$</span>
              <input
                type="number"
                value={form.salary}
                onChange={e => set('salary', +e.target.value)}
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl font-mono text-sm"
                style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Current super balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(15,30,60,0.4)' }}>$</span>
              <input
                type="number"
                value={form.current_balance}
                onChange={e => set('current_balance', +e.target.value)}
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl font-mono text-sm"
                style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Fund name
            </label>
            <input
              type="text"
              value={form.fund_name}
              onChange={e => set('fund_name', e.target.value)}
              placeholder="e.g. Hostplus, AustralianSuper"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Investment option
            </label>
            <select
              value={form.fund_option}
              onChange={e => set('fund_option', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none', background: 'white' }}
            >
              <option>Balanced</option>
              <option>Growth</option>
              <option>High Growth</option>
              <option>Conservative</option>
              <option>Cash</option>
              <option>Ethical / ESG</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Fund annual fee %
            </label>
            <input
              type="number"
              step="0.01"
              value={form.fund_fee_pct}
              onChange={e => set('fund_fee_pct', +e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              SG rate %
            </label>
            <input
              type="number"
              step="0.5"
              value={form.employer_sg_rate}
              onChange={e => set('employer_sg_rate', +e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Target retirement age
            </label>
            <input
              type="number"
              value={form.target_retirement_age}
              onChange={e => set('target_retirement_age', +e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
              Number of super accounts
            </label>
            <input
              type="number"
              min="1"
              value={form.account_count}
              onChange={e => set('account_count', +e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
              style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
            />
          </div>

        </div>

        {/* Spouse toggle */}
        <div className="mt-5 flex items-center gap-3">
          <input
            type="checkbox"
            id="hasSpouse"
            checked={form.has_spouse}
            onChange={e => set('has_spouse', e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: '#00D4AA' }}
          />
          <label htmlFor="hasSpouse" className="text-sm" style={{ color: 'rgba(15,30,60,0.7)', cursor: 'pointer' }}>
            I have a spouse / partner with super
          </label>
        </div>

        {form.has_spouse && (
          <div className="grid grid-cols-2 gap-5 mt-5 pt-5" style={{ borderTop: '1px solid rgba(15,30,60,0.08)' }}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
                Spouse income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(15,30,60,0.4)' }}>$</span>
                <input
                  type="number"
                  value={form.spouse_income}
                  onChange={e => set('spouse_income', +e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl font-mono text-sm"
                  style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(15,30,60,0.5)' }}>
                Spouse super balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(15,30,60,0.4)' }}>$</span>
                <input
                  type="number"
                  value={form.spouse_balance}
                  onChange={e => set('spouse_balance', +e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl font-mono text-sm"
                  style={{ border: '1px solid rgba(15,30,60,0.12)', color: '#0F1E3C', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid rgba(232,93,93,0.2)' }}>
            {error}
          </div>
        )}

        {/* Save button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={save}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: saved ? '#10B981' : '#0F1E3C',
              color: '#FFFFFF',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm" style={{ color: '#10B981' }}>
              Profile updated — your health score will reflect your new details.
            </span>
          )}
        </div>
      </div>

      {/* Subscription card */}
      <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
        <div
          className="text-[11px] font-medium uppercase tracking-widest mb-4"
          style={{ color: 'rgba(15,30,60,0.4)' }}
        >
          Subscription
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium capitalize" style={{ color: '#0F1E3C' }}>
              {subscription?.plan === 'free' ? 'Free plan' : `${subscription?.plan} plan`}
            </div>
            <div className="text-sm mt-0.5" style={{ color: 'rgba(15,30,60,0.5)' }}>
              {subscription?.plan === 'free'
                ? 'Upgrade to unlock all 8 modules'
                : subscription?.cancel_at_period_end
                  ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString('en-AU')}`
                  : subscription?.current_period_end
                    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-AU')}`
                    : 'Active subscription'
              }
            </div>
          </div>
          <div>
            {subscription?.plan === 'free' ? (
              <button
                onClick={() => router.push('/pricing')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: '#00D4AA', color: '#0F1E3C' }}
              >
                Upgrade plan
              </button>
            ) : (
              <button
                onClick={manageSubscription}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ border: '1px solid rgba(15,30,60,0.12)', color: 'rgba(15,30,60,0.7)' }}
              >
                Manage subscription
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
