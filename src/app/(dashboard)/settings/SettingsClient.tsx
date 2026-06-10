'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Top Australian super funds with their typical fees and default options
const SUPER_FUNDS = [
  { name: 'AustralianSuper', fee: 0.57, options: ['Balanced', 'High Growth', 'Indexed Diversified', 'Conservative Balanced', 'Cash'] },
  { name: 'Australian Retirement Trust', fee: 0.44, options: ['Balanced', 'High Growth', 'Moderate', 'Conservative', 'Cash'] },
  { name: 'UniSuper', fee: 0.36, options: ['Balanced', 'Growth', 'High Growth', 'Conservative Balanced', 'Cash'] },
  { name: 'Aware Super', fee: 0.58, options: ['High Growth', 'Growth', 'Balanced Growth', 'Conservative Growth', 'Cash'] },
  { name: 'Hostplus', fee: 0.78, options: ['Balanced', 'Indexed Balanced', 'Shares Plus', 'Conservative', 'Cash'] },
  { name: 'REST', fee: 0.62, options: ['Core Strategy', 'High Growth', 'Balanced', 'Capital Stable', 'Cash'] },
  { name: 'HESTA', fee: 0.67, options: ['MySuper Balanced Growth', 'Shares Plus', 'Conservative', 'Cash'] },
  { name: 'Cbus', fee: 0.57, options: ['Growth (MySuper)', 'High Growth', 'Conservative Growth', 'Conservative', 'Cash'] },
  { name: 'Retail Employees Super (REST)', fee: 0.62, options: ['Core Strategy', 'High Growth', 'Balanced', 'Cash'] },
  { name: 'TWUSUPER', fee: 0.68, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'Sunsuper (now ART)', fee: 0.44, options: ['Balanced', 'High Growth', 'Moderate', 'Cash'] },
  { name: 'Media Super', fee: 0.72, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'FIRST Super', fee: 0.75, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'Spirit Super', fee: 0.71, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'CareSuper', fee: 0.63, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'NGS Super', fee: 0.69, options: ['Diversified (MySuper)', 'Socially Responsible', 'Cash'] },
  { name: 'ANZ Smart Choice Super', fee: 0.85, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'BT Super', fee: 1.24, options: ['MySuper Lifestage', 'Balanced', 'Growth', 'Cash'] },
  { name: 'MLC Super', fee: 1.10, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'Colonial First State', fee: 0.95, options: ['Diversified', 'Growth', 'Conservative', 'Cash'] },
  { name: 'OnePath (ANZ)', fee: 0.90, options: ['Balanced', 'Growth', 'Conservative', 'Cash'] },
  { name: 'Mercer Super', fee: 0.82, options: ['Balanced Growth', 'High Growth', 'Conservative', 'Cash'] },
  { name: 'SMSF (Self-Managed)', fee: 0, options: ['Custom'] },
  { name: 'Other', fee: 0, options: ['Balanced', 'Growth', 'High Growth', 'Conservative', 'Cash'] },
]

const INVESTMENT_OPTIONS_GENERAL = ['Balanced', 'Growth', 'High Growth', 'Conservative Balanced', 'Conservative', 'Indexed', 'Socially Responsible', 'Cash', 'Custom']

function Hint({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(15,30,60,0.1)', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'rgba(15,30,60,0.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >?</button>
      {open && (
        <div style={{ position: 'absolute', top: 22, left: 0, zIndex: 100, background: '#0F1E3C', color: 'white', borderRadius: 10, padding: '10px 14px', width: 260, fontSize: 12, lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {children}
          <button onClick={() => setOpen(false)} style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Close ✕</button>
        </div>
      )}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
      {children}
    </div>
  )
}

export function SettingsClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [fundSearch, setFundSearch] = useState(sp?.fund_name ?? '')
  const [showFundDropdown, setShowFundDropdown] = useState(false)

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

  function selectFund(fund: typeof SUPER_FUNDS[0]) {
    setFundSearch(fund.name)
    set('fund_name', fund.name)
    if (fund.fee > 0) set('fund_fee_pct', fund.fee)
    if (fund.options[0]) set('fund_option', fund.options[0])
    setShowFundDropdown(false)
  }

  const filteredFunds = SUPER_FUNDS.filter(f =>
    f.name.toLowerCase().includes(fundSearch.toLowerCase())
  )

  const selectedFund = SUPER_FUNDS.find(f => f.name === form.fund_name)
  const availableOptions = selectedFund ? selectedFund.options : INVESTMENT_OPTIONS_GENERAL

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setSaving(false); return }
      const { error: dbError } = await supabase
        .from('super_profiles')
        .upsert({ ...form, fund_name: fundSearch || form.fund_name, user_id: user.id }, { onConflict: 'user_id' })
      if (dbError) {
        setError(dbError.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  async function manageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const, background: 'white' }
  const monoInput = { ...inputStyle, fontFamily: 'monospace' }
  const prefixInput = { ...monoInput, paddingLeft: 28 }
  const prefix = { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Where to find your super details - info banner */}
      <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 8 }}>📱 Where to find your super details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Fund name & balance', how: 'Check your latest super statement, your MyGov account, or the fund\'s app/website' },
            { label: 'Investment option', how: 'Shown on your member portal or latest annual statement. If unsure, you\'re likely in "Balanced" (the default)' },
            { label: 'Annual fee %', how: 'In your PDS (Product Disclosure Statement) or fund website. We pre-fill this when you select your fund.' },
            { label: 'Employer SG rate', how: '12% since July 2025 for most employees. Check your payslip or ask your employer.' },
          ].map(item => (
            <div key={item.label} style={{ fontSize: 12, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
              <strong style={{ color: '#0F1E3C' }}>{item.label}:</strong> {item.how}
            </div>
          ))}
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 24 }}>
          Super profile
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Age */}
          <div>
            <Label>Age</Label>
            <input type="number" value={form.age} onChange={e => set('age', +e.target.value)} style={monoInput} />
          </div>

          {/* Salary */}
          <div>
            <Label>
              Annual salary (before tax)
              <Hint>Your gross salary before tax. Check your employment contract, payslip, or MyGov income summary. This is used to calculate your employer SG contribution and salary sacrifice headroom.</Hint>
            </Label>
            <div style={{ position: 'relative' }}>
              <span style={prefix}>$</span>
              <input type="number" value={form.salary} onChange={e => set('salary', +e.target.value)} style={prefixInput} />
            </div>
          </div>

          {/* Balance */}
          <div>
            <Label>
              Current super balance
              <Hint>Log in to your fund's member portal or app, or check MyGov → ATO → Super. Your latest statement also shows this. If you have multiple funds, add them all together.</Hint>
            </Label>
            <div style={{ position: 'relative' }}>
              <span style={prefix}>$</span>
              <input type="number" value={form.current_balance} onChange={e => set('current_balance', +e.target.value)} style={prefixInput} />
            </div>
          </div>

          {/* Fund name - searchable */}
          <div style={{ position: 'relative' }}>
            <Label>
              Super fund name
              <Hint>Search for your fund below. When you select it, we automatically fill in the typical annual fee. You can find your fund name on your super statement, payslip, or MyGov.</Hint>
            </Label>
            <input
              type="text"
              value={fundSearch}
              onChange={e => { setFundSearch(e.target.value); setShowFundDropdown(true) }}
              onFocus={() => setShowFundDropdown(true)}
              placeholder="Search for your fund..."
              style={inputStyle}
            />
            {showFundDropdown && filteredFunds.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                {filteredFunds.map(fund => (
                  <div
                    key={fund.name}
                    onClick={() => selectFund(fund)}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15,30,60,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <span style={{ fontSize: 13, color: '#0F1E3C' }}>{fund.name}</span>
                    {fund.fee > 0 && (
                      <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', fontFamily: 'monospace' }}>{fund.fee}% fee</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showFundDropdown && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setShowFundDropdown(false)} />
            )}
          </div>

          {/* Investment option */}
          <div>
            <Label>
              Investment option
              <Hint>
                This is how your super is invested. Most people are in "Balanced" by default — a mix of shares and bonds. You can find yours in your member portal or annual statement.
                <br /><br />
                <strong style={{ color: '#00D4AA' }}>Common options:</strong><br />
                • High Growth = more shares (higher risk/return)<br />
                • Balanced = mix of growth and defensive<br />
                • Conservative = more bonds/cash (lower risk)
              </Hint>
            </Label>
            <select
              value={form.fund_option}
              onChange={e => set('fund_option', e.target.value)}
              style={inputStyle}
            >
              {availableOptions.map(opt => (
                <option key={opt}>{opt}</option>
              ))}
              {!availableOptions.includes(form.fund_option) && form.fund_option && (
                <option value={form.fund_option}>{form.fund_option}</option>
              )}
            </select>
          </div>

          {/* Fund fee */}
          <div>
            <Label>
              Fund annual fee %
              <Hint>
                This is the investment fee charged as a % of your balance each year. We pre-fill this when you select your fund above, but you can adjust it.
                <br /><br />
                To find your exact fee: go to your fund's website → PDS (Product Disclosure Statement) → look for "investment fee" or "indirect cost ratio".
                <br /><br />
                <strong style={{ color: '#00D4AA' }}>Typical ranges:</strong><br />
                • Under 0.5%: low fee (good)<br />
                • 0.5–0.8%: average<br />
                • Above 1%: high fee
              </Hint>
            </Label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.01"
                value={form.fund_fee_pct}
                onChange={e => set('fund_fee_pct', +e.target.value)}
                style={monoInput}
              />
              {selectedFund && selectedFund.fee > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>
                  Pre-filled from {selectedFund.name} typical fee — check your PDS for your exact rate
                </div>
              )}
            </div>
          </div>

          {/* SG rate */}
          <div>
            <Label>
              Employer SG rate %
              <Hint>The Superannuation Guarantee rate your employer pays on top of your salary. This is 12% for most employees from 1 July 2025. Check your payslip or employment contract to confirm.</Hint>
            </Label>
            <input type="number" step="0.5" value={form.employer_sg_rate} onChange={e => set('employer_sg_rate', +e.target.value)} style={monoInput} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>12% for most employees from 1 Jul 2025</div>
          </div>

          {/* Retirement age */}
          <div>
            <Label>Target retirement age</Label>
            <input type="number" value={form.target_retirement_age} onChange={e => set('target_retirement_age', +e.target.value)} style={monoInput} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>Preservation age is 60. Age Pension age is 67.</div>
          </div>

          {/* Account count */}
          <div>
            <Label>
              Number of super accounts
              <Hint>Check MyGov → ATO → Super to see all your super accounts. Having multiple accounts means paying duplicate fees and insurance. You can consolidate for free via MyGov.</Hint>
            </Label>
            <input type="number" min="1" value={form.account_count} onChange={e => set('account_count', +e.target.value)} style={monoInput} />
            {form.account_count > 1 && (
              <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>
                ⚠ Multiple accounts = duplicate fees. Consider consolidating via MyGov.
              </div>
            )}
          </div>

        </div>

        {/* Spouse toggle */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="hasSpouse" checked={form.has_spouse}
            onChange={e => set('has_spouse', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#00D4AA', cursor: 'pointer' }} />
          <label htmlFor="hasSpouse" style={{ fontSize: 14, color: 'rgba(15,30,60,0.7)', cursor: 'pointer' }}>
            I have a spouse / partner with super
          </label>
        </div>

        {form.has_spouse && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(15,30,60,0.08)' }}>
            <div>
              <Label>Spouse income (annual)</Label>
              <div style={{ position: 'relative' }}>
                <span style={prefix}>$</span>
                <input type="number" value={form.spouse_income} onChange={e => set('spouse_income', +e.target.value)} style={prefixInput} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>Used to calculate spouse contribution tax offset eligibility</div>
            </div>
            <div>
              <Label>Spouse super balance</Label>
              <div style={{ position: 'relative' }}>
                <span style={prefix}>$</span>
                <input type="number" value={form.spouse_balance} onChange={e => set('spouse_balance', +e.target.value)} style={prefixInput} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', color: '#991B1B', border: '1px solid rgba(232,93,93,0.2)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Save button */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ padding: '10px 32px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: saved ? '#10B981' : '#0F1E3C', color: 'white', opacity: saving ? 0.7 : 1, transition: 'background 0.2s' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: '#10B981' }}>
              Profile updated — your health score now reflects your details.
            </span>
          )}
        </div>
      </div>

      {/* Subscription card */}
      <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>
          Subscription
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#0F1E3C', fontSize: 16, textTransform: 'capitalize' }}>
              {subscription?.plan === 'free' ? 'Free plan' : `${subscription?.plan} plan`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
              {subscription?.plan === 'free'
                ? 'Upgrade to unlock all 8 modules'
                : subscription?.cancel_at_period_end
                  ? `Cancels ${new Date(subscription.current_period_end).toLocaleDateString('en-AU')}`
                  : subscription?.current_period_end
                    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-AU')}`
                    : 'Active subscription'}
            </div>
          </div>
          {subscription?.plan === 'free' ? (
            <button onClick={() => router.push('/pricing')}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#00D4AA', color: '#0F1E3C' }}>
              Upgrade plan
            </button>
          ) : (
            <button onClick={manageSubscription}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'white', color: 'rgba(15,30,60,0.7)', border: '1px solid rgba(15,30,60,0.12)' }}>
              Manage subscription
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
