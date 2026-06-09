'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SettingsClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('super_profiles').upsert({ ...form, user_id: user!.id })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function manageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardTitle>Super profile</CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input label="Age" type="number" value={form.age} onChange={e => set('age', +e.target.value)} />
          <Input label="Annual salary" prefix="$" type="number" value={form.salary} onChange={e => set('salary', +e.target.value)} />
          <Input label="Current super balance" prefix="$" type="number" value={form.current_balance} onChange={e => set('current_balance', +e.target.value)} />
          <Input label="Fund name" type="text" value={form.fund_name} onChange={e => set('fund_name', e.target.value)} />
          <Select label="Investment option" value={form.fund_option} onChange={e => set('fund_option', e.target.value)}>
            <option>Balanced</option>
            <option>Growth</option>
            <option>High Growth</option>
            <option>Conservative</option>
            <option>Cash</option>
          </Select>
          <Input label="Fund annual fee %" type="number" step={0.01} value={form.fund_fee_pct} onChange={e => set('fund_fee_pct', +e.target.value)} />
          <Input label="SG rate %" type="number" step={0.5} value={form.employer_sg_rate} onChange={e => set('employer_sg_rate', +e.target.value)} />
          <Input label="Target retirement age" type="number" value={form.target_retirement_age} onChange={e => set('target_retirement_age', +e.target.value)} />
          <Input label="Number of super accounts" type="number" min={1} value={form.account_count} onChange={e => set('account_count', +e.target.value)} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input type="checkbox" id="hasSpouse" checked={form.has_spouse} onChange={e => set('has_spouse', e.target.checked)} className="w-4 h-4 accent-teal" />
          <label htmlFor="hasSpouse" className="text-sm text-navy/70">I have a spouse / partner with super</label>
        </div>
        {form.has_spouse && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/8">
            <Input label="Spouse income" prefix="$" type="number" value={form.spouse_income} onChange={e => set('spouse_income', +e.target.value)} />
            <Input label="Spouse super balance" prefix="$" type="number" value={form.spouse_balance} onChange={e => set('spouse_balance', +e.target.value)} />
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={saving} variant="primary">
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Subscription</CardTitle>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="font-medium text-navy capitalize">{subscription?.plan ?? 'Free'} plan</div>
            <div className="text-sm text-navy/50 mt-0.5">
              {subscription?.plan === 'free' ? 'Upgrade to unlock all features' :
               subscription?.cancel_at_period_end ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString('en-AU')}` :
               `Renews ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-AU') : '—'}`}
            </div>
          </div>
          <div className="flex gap-2.5">
            {subscription?.plan === 'free' ? (
              <Button variant="teal" onClick={() => router.push('/pricing')}>Upgrade plan</Button>
            ) : (
              <Button variant="ghost" onClick={manageSubscription}>Manage subscription</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
