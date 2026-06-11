'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── FUND + OPTION FEE DATA ─────────────────────────────────────────────────
// Fees are total investment fee % p.a. (investment fee + indirect costs)
// Source: Fund PDSs and Fees & Costs guides, current as at June 2026
// Note: fees change annually — users should verify against their fund's current PDS

const SUPER_FUNDS = [
  {
    name: 'AustralianSuper',
    options: [
      { name: 'Balanced (MySuper)', fee: 0.57, type: 'active' },
      { name: 'High Growth', fee: 0.53, type: 'active' },
      { name: 'Indexed Diversified', fee: 0.14, type: 'indexed' },
      { name: 'Conservative Balanced', fee: 0.53, type: 'active' },
      { name: 'Socially Aware', fee: 0.60, type: 'active' },
      { name: 'Stable', fee: 0.39, type: 'active' },
      { name: 'Cash', fee: 0.13, type: 'active' },
    ],
  },
  {
    name: 'Australian Retirement Trust (ART)',
    options: [
      { name: 'Lifecycle (default)', fee: 0.54, type: 'active' },
      { name: 'Balanced', fee: 0.65, type: 'active' },
      { name: 'High Growth', fee: 0.70, type: 'active' },
      { name: 'Moderate', fee: 0.48, type: 'active' },
      { name: 'Indexed Balanced', fee: 0.08, type: 'indexed' },
      { name: 'Cash', fee: 0.22, type: 'active' },
    ],
  },
  {
    name: 'UniSuper',
    options: [
      { name: 'Balanced', fee: 0.41, type: 'active' },
      { name: 'Growth', fee: 0.43, type: 'active' },
      { name: 'High Growth', fee: 0.43, type: 'active' },
      { name: 'Conservative Balanced', fee: 0.37, type: 'active' },
      { name: 'Cash', fee: 0.16, type: 'active' },
    ],
  },
  {
    name: 'Aware Super',
    options: [
      { name: 'High Growth (MySuper)', fee: 0.57, type: 'active' },
      { name: 'Growth', fee: 0.60, type: 'active' },
      { name: 'Balanced Growth', fee: 0.50, type: 'active' },
      { name: 'Indexed Growth', fee: 0.06, type: 'indexed' },
      { name: 'Cash', fee: 0.18, type: 'active' },
    ],
  },
  {
    name: 'Hostplus',
    options: [
      { name: 'Balanced (MySuper)', fee: 0.78, type: 'active' },
      { name: 'Indexed Balanced', fee: 0.11, type: 'indexed' },
      { name: 'Shares Plus', fee: 0.73, type: 'active' },
      { name: 'Indexed Shares', fee: 0.08, type: 'indexed' },
      { name: 'Conservative Balanced', fee: 0.64, type: 'active' },
      { name: 'Capital Stable', fee: 0.57, type: 'active' },
      { name: 'Cash', fee: 0.10, type: 'active' },
    ],
  },
  {
    name: 'REST',
    options: [
      { name: 'Core Strategy (MySuper)', fee: 0.62, type: 'active' },
      { name: 'High Growth', fee: 0.69, type: 'active' },
      { name: 'Balanced', fee: 0.59, type: 'active' },
      { name: 'Capital Stable', fee: 0.48, type: 'active' },
      { name: 'Indexed Global Shares', fee: 0.15, type: 'indexed' },
      { name: 'Cash', fee: 0.19, type: 'active' },
    ],
  },
  {
    name: 'HESTA',
    options: [
      { name: 'MySuper Balanced Growth', fee: 0.53, type: 'active' },
      { name: 'High Growth', fee: 0.71, type: 'active' },
      { name: 'Shares Plus', fee: 0.66, type: 'active' },
      { name: 'Conservative', fee: 0.49, type: 'active' },
      { name: 'Cash', fee: 0.22, type: 'active' },
    ],
  },
  {
    name: 'Cbus',
    options: [
      { name: 'Growth (MySuper)', fee: 0.56, type: 'active' },
      { name: 'High Growth', fee: 0.60, type: 'active' },
      { name: 'Conservative Growth', fee: 0.50, type: 'active' },
      { name: 'Conservative', fee: 0.44, type: 'active' },
      { name: 'Cash', fee: 0.19, type: 'active' },
    ],
  },
  {
    name: 'Spirit Super',
    options: [
      { name: 'Balanced (MySuper)', fee: 0.71, type: 'active' },
      { name: 'Growth', fee: 0.75, type: 'active' },
      { name: 'Conservative', fee: 0.57, type: 'active' },
      { name: 'Cash', fee: 0.24, type: 'active' },
    ],
  },
  {
    name: 'CareSuper',
    options: [
      { name: 'Balanced (MySuper)', fee: 0.63, type: 'active' },
      { name: 'Growth', fee: 0.65, type: 'active' },
      { name: 'Conservative Balanced', fee: 0.55, type: 'active' },
      { name: 'Cash', fee: 0.24, type: 'active' },
    ],
  },
  {
    name: 'ANZ Smart Choice Super',
    options: [
      { name: 'Balanced', fee: 0.85, type: 'active' },
      { name: 'Growth', fee: 0.92, type: 'active' },
      { name: 'Conservative', fee: 0.71, type: 'active' },
      { name: 'Cash', fee: 0.41, type: 'active' },
    ],
  },
  {
    name: 'BT Super',
    options: [
      { name: 'MySuper Lifestage', fee: 1.24, type: 'active' },
      { name: 'Balanced', fee: 1.18, type: 'active' },
      { name: 'Growth', fee: 1.22, type: 'active' },
      { name: 'Conservative', fee: 0.98, type: 'active' },
      { name: 'Cash', fee: 0.52, type: 'active' },
    ],
  },
  {
    name: 'MLC Super',
    options: [
      { name: 'Balanced', fee: 1.10, type: 'active' },
      { name: 'Growth', fee: 1.15, type: 'active' },
      { name: 'Conservative', fee: 0.95, type: 'active' },
      { name: 'Cash', fee: 0.48, type: 'active' },
    ],
  },
  {
    name: 'Colonial First State',
    options: [
      { name: 'Diversified', fee: 0.95, type: 'active' },
      { name: 'Growth', fee: 1.02, type: 'active' },
      { name: 'Conservative', fee: 0.82, type: 'active' },
      { name: 'Cash', fee: 0.44, type: 'active' },
    ],
  },
  {
    name: 'SMSF (Self-Managed)',
    options: [
      { name: 'Custom portfolio', fee: 0, type: 'custom' },
    ],
  },
  {
    name: 'Other (enter manually)',
    options: [
      { name: 'Balanced', fee: 0, type: 'other' },
      { name: 'Growth', fee: 0, type: 'other' },
      { name: 'High Growth', fee: 0, type: 'other' },
      { name: 'Conservative', fee: 0, type: 'other' },
      { name: 'Cash', fee: 0, type: 'other' },
    ],
  },
]

// ─── FEE COLOUR HELPER ──────────────────────────────────────────────────────
function feeColor(fee: number) {
  if (fee === 0) return 'rgba(15,30,60,0.4)'
  if (fee <= 0.20) return '#059669'
  if (fee <= 0.50) return '#00D4AA'
  if (fee <= 0.80) return '#D97706'
  return '#EF4444'
}

function feeLabel(fee: number) {
  if (fee === 0) return ''
  if (fee <= 0.20) return '✓ Very low'
  if (fee <= 0.50) return '✓ Low'
  if (fee <= 0.80) return '~ Average'
  return '⚠ High'
}

// ─── HINT TOOLTIP ───────────────────────────────────────────────────────────
function Hint({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(15,30,60,0.1)', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'rgba(15,30,60,0.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        ?
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 22, left: 0, zIndex: 200, background: '#0F1E3C', color: 'white', borderRadius: 10, padding: '10px 14px', width: 270, fontSize: 12, lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          {children}
          <button onClick={() => setOpen(false)} style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Close ✕</button>
        </div>
      )}
    </span>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export function SettingsClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [fundSearch, setFundSearch] = useState(sp?.fund_name ?? '')
  const [showFundDropdown, setShowFundDropdown] = useState(false)


  // ── LOCK STATE ─────────────────────────────────────────────────────────────
  // Core financial fields are locked after first real save.
  // Preference fields (retirement age, SG rate, account count) stay editable.
  const isLocked: boolean = sp?.profile_locked === true
  const CORE_FIELDS = ['age', 'salary', 'current_balance', 'fund_name', 'fund_option', 'fund_fee_pct']

  // Mask a number for display when locked (shows to a potential account sharer)
  function maskValue(val: number, type: 'currency' | 'age' | 'pct'): string {
    if (type === 'currency') {
      // Show rough order of magnitude only, e.g. $430,000 → $4XX,XXX
      const s = Math.round(val).toString()
      return '$' + s[0] + 'X'.repeat(s.length - 1)
    }
    if (type === 'age') return 'XX'
    if (type === 'pct') return 'X.XX%'
    return '***'
  }

  const [form, setForm] = useState({
    age: sp?.age ?? 40,
    salary: sp?.salary ?? 80000,
    current_balance: sp?.current_balance ?? 0,
    fund_name: sp?.fund_name ?? '',
    fund_option: sp?.fund_option ?? '',
    fund_fee_pct: sp?.fund_fee_pct ?? 0,
    employer_sg_rate: sp?.employer_sg_rate ?? 12,
    target_retirement_age: sp?.target_retirement_age ?? 65,
    account_count: sp?.account_count ?? 1,
    making_voluntary_contribs: sp?.making_voluntary_contribs ?? false,
    carry_forward_balance: sp?.carry_forward_balance ?? null,
    personal_contribs_ytd: sp?.personal_contribs_ytd ?? 0,

  })

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // When a fund is selected from dropdown
  function selectFund(fund: typeof SUPER_FUNDS[0]) {
    setFundSearch(fund.name)
    set('fund_name', fund.name)
    // Auto-select first option and its fee
    if (fund.options.length > 0) {
      set('fund_option', fund.options[0].name)
      set('fund_fee_pct', fund.options[0].fee)
    }
    setShowFundDropdown(false)
  }

  // When an investment option is selected — auto-update the fee
  function selectOption(optionName: string) {
    set('fund_option', optionName)
    const fund = SUPER_FUNDS.find(f => f.name === form.fund_name)
    if (fund) {
      const opt = fund.options.find(o => o.name === optionName)
      if (opt && opt.fee > 0) set('fund_fee_pct', opt.fee)
    }
  }

  const filteredFunds = SUPER_FUNDS.filter(f =>
    f.name.toLowerCase().includes(fundSearch.toLowerCase())
  )
  const selectedFund = SUPER_FUNDS.find(f => f.name === form.fund_name)
  const selectedOption = selectedFund?.options.find(o => o.name === form.fund_option)
  const isOther = !selectedFund || selectedFund.name === 'Other (enter manually)' || selectedFund.name === 'SMSF (Self-Managed)'

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setSaving(false); return }

      // Locked profiles: only send editable preference fields, never core financial data
      const payload = isLocked
        ? {
            user_id: user.id,
            employer_sg_rate: form.employer_sg_rate,
            target_retirement_age: form.target_retirement_age,
            account_count: form.account_count,
            making_voluntary_contribs: form.making_voluntary_contribs,
            carry_forward_balance: form.carry_forward_balance,
            personal_contribs_ytd: form.personal_contribs_ytd,

          }
        : { ...form, fund_name: fundSearch || form.fund_name, user_id: user.id }

      const { error: dbError } = await supabase
        .from('super_profiles')
        .upsert(payload, { onConflict: 'user_id' })

      if (dbError) {
        if (dbError.message?.includes('locked')) {
          setError('Your core profile details are locked. Email support@smartsuperau.com to request a correction.')
        } else {
          setError(dbError.message)
        }
      } else {
        setSaved(true); setTimeout(() => setSaved(false), 3000); router.refresh()
      }
    } catch { setError('Something went wrong. Please try again.') }
    setSaving(false)
  }

  async function manageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  // Styles
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box', background: 'white' }
  const monoInput: React.CSSProperties = { ...inputStyle, fontFamily: 'monospace' }
  const prefix: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13, pointerEvents: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6, display: 'flex', alignItems: 'center' }

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Lock status banner OR setup guide */}
      {isLocked ? (
        <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: '#0F1E3C', fontSize: 14, marginBottom: 6 }}>Core profile locked</div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.65)', lineHeight: 1.7 }}>
              Your financial details were locked when you first saved your profile. This protects your data and ensures all calculations remain accurate to you specifically.{' '}
              <strong style={{ color: '#0F1E3C' }}>Preference fields</strong> (retirement age, SG rate) can still be updated anytime.
              Made a genuine error? Email <strong>support@smartsuperau.com</strong> with your registered email and we'll unlock within 24 hours.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 8 }}>📱 Where to find your super details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Fund name & balance', how: 'Log in to your fund\'s app/website, or check MyGov → ATO → Super' },
              { label: 'Investment option', how: 'Shown in your member portal. If you\'ve never changed it, you\'re likely in the default MySuper option' },
              { label: 'Annual fee %', how: 'We pre-fill this when you select your fund + option. Verify in your fund\'s Fees & Costs Guide (PDS)' },
              { label: 'Employer SG rate', how: '12% for most employees from 1 Jul 2025. Check your payslip.' },
            ].map(item => (
              <div key={item.label} style={{ fontSize: 12, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                <strong style={{ color: '#0F1E3C' }}>{item.label}:</strong> {item.how}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 500 }}>
            ⚠ Your core details (age, salary, balance, fund) will be <strong>locked after your first save</strong>. Double-check everything carefully before saving.
          </div>
        </div>
      )}

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 24 }}>Super profile</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Age */}
          <div>
            <div style={labelStyle}>Age {isLocked && <span style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 6px', borderRadius: 4 }}>🔒 locked</span>}</div>
            {isLocked
              ? <div style={{ ...monoInput, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{maskValue(form.age, 'age')}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : <input type="number" value={form.age} onChange={e => set('age', +e.target.value)} style={monoInput} />
            }
          </div>

          {/* Salary */}
          <div>
            <div style={labelStyle}>
              Annual salary (before tax)
              {isLocked && <span style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>🔒 locked</span>}
              {!isLocked && <Hint>Your gross salary before tax. Check your payslip, employment contract, or MyGov income summary. Used to calculate your employer SG and salary sacrifice headroom.</Hint>}
            </div>
            {isLocked
              ? <div style={{ ...monoInput, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{maskValue(form.salary, 'currency')}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : <div style={{ position: 'relative' }}>
                  <span style={prefix}>$</span>
                  <input type="number" value={form.salary} onChange={e => set('salary', +e.target.value)} style={{ ...monoInput, paddingLeft: 28 }} />
                </div>
            }
          </div>

          {/* Balance */}
          <div>
            <div style={labelStyle}>
              Current super balance
              {isLocked && <span style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>🔒 locked</span>}
              {!isLocked && <Hint>Log in to your fund's member portal, app, or check MyGov → ATO → Super. Your latest annual statement also shows this. If you have multiple funds, enter your total across all accounts.</Hint>}
            </div>
            {isLocked
              ? <div style={{ ...monoInput, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{maskValue(form.current_balance, 'currency')}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : <div style={{ position: 'relative' }}>
                  <span style={prefix}>$</span>
                  <input type="number" value={form.current_balance} onChange={e => set('current_balance', +e.target.value)} style={{ ...monoInput, paddingLeft: 28 }} />
                </div>
            }
          </div>

          {/* Fund name — searchable / locked */}
          <div style={{ position: 'relative' }}>
            <div style={labelStyle}>
              Super fund name
              {isLocked && <span style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>🔒 locked</span>}
              {!isLocked && <Hint>Search for your fund. When you select it, we automatically load all investment options and their fees. Find your fund name on your super statement, payslip, or MyGov.</Hint>}
            </div>
            {isLocked
              ? <div style={{ ...inputStyle, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{sp?.fund_name ?? '—'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : <>
                  <input
                    type="text"
                    value={fundSearch}
                    onChange={e => { setFundSearch(e.target.value); setShowFundDropdown(true) }}
                    onFocus={() => setShowFundDropdown(true)}
                    placeholder="Type to search your fund..."
                    style={inputStyle}
                  />
                  {showFundDropdown && filteredFunds.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: 'white', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                      {filteredFunds.map(fund => (
                        <div key={fund.name} onClick={() => selectFund(fund)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(15,30,60,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                          <span style={{ fontSize: 13, color: '#0F1E3C' }}>{fund.name}</span>
                          <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>{fund.options.length} options</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showFundDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setShowFundDropdown(false)} />}
                </>
            }
          </div>

          {/* Investment option — locked or editable */}
          <div>
            <div style={labelStyle}>
              Investment option
              {isLocked && <span style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>🔒 locked</span>}
              {!isLocked && <Hint>
                This is how your super money is invested inside your fund. Each option has a different fee and risk profile. If you've never changed it, you're in the default (usually "Balanced" or "MySuper Lifecycle").
                <br /><br />
                <strong style={{ color: '#00D4AA' }}>Tip:</strong> Indexed options (like "Indexed Balanced") track the market automatically and are typically 5–10× cheaper than actively managed options with similar returns.
              </Hint>}
            </div>
            {isLocked
              ? <div style={{ ...inputStyle, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{sp?.fund_option ?? '—'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : selectedFund && !isOther
                ? <select value={form.fund_option} onChange={e => selectOption(e.target.value)} style={inputStyle}>
                    {selectedFund.options.map(opt => (
                      <option key={opt.name} value={opt.name}>
                        {opt.name} — {opt.fee > 0 ? `${opt.fee}% p.a.` : 'Enter fee below'}
                        {opt.type === 'indexed' ? ' (indexed)' : ''}
                      </option>
                    ))}
                  </select>
                : <input type="text" value={form.fund_option} onChange={e => set('fund_option', e.target.value)}
                    placeholder="e.g. Balanced, Growth, High Growth" style={inputStyle} />
            }
          </div>

          {/* Fee — auto-filled, with visual indicator */}
          <div>
            <div style={labelStyle}>
              Fund annual fee %
              <Hint>
                This is the investment fee charged as a % of your balance each year. We pre-fill this when you select your fund + option above.
                <br /><br />
                <strong style={{ color: '#00D4AA' }}>Important:</strong> Fees vary significantly between options within the same fund. An indexed option can cost 0.08–0.15% while an active option in the same fund can cost 0.60–0.80% — the same money invested for different prices.
                <br /><br />
                To verify: go to your fund's website → search "Fees and Costs Guide" or "PDS".
              </Hint>
            </div>
            {isLocked
              ? <div style={{ ...monoInput, background: 'rgba(15,30,60,0.03)', color: 'rgba(15,30,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{maskValue(form.fund_fee_pct, 'pct')}</span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>🔒</span>
                </div>
              : <input
                  type="number"
                  step="0.01"
                  value={form.fund_fee_pct}
                  onChange={e => set('fund_fee_pct', +e.target.value)}
                  style={monoInput}
                />
            }
            {/* Fee indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              {form.fund_fee_pct > 0 ? (
                <>
                  <span style={{ fontSize: 11, fontWeight: 500, color: feeColor(form.fund_fee_pct) }}>
                    {feeLabel(form.fund_fee_pct)} fee for this type of option
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>
                    = ${Math.round(form.current_balance * form.fund_fee_pct / 100)}/yr on your balance
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)' }}>
                  {selectedFund ? 'Enter your fee from your fund\'s PDS' : 'Select your fund above to auto-fill'}
                </span>
              )}
            </div>

            {/* Indexed option callout */}
            {selectedOption?.type === 'indexed' && (
              <div style={{ marginTop: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>
                ✓ You're in an indexed option — one of the lowest-fee choices available. Indexed options track the market automatically without active fund managers, keeping costs minimal.
              </div>
            )}

            {/* High fee warning */}
            {form.fund_fee_pct > 0.90 && (
              <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid rgba(232,93,93,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                ⚠ This fee is above average. At {form.fund_fee_pct}%, you're paying {
                  Math.round(form.current_balance * (form.fund_fee_pct - 0.14) / 100)
                }/yr more than the lowest-cost comparable option. See Fee Analyser for the long-term impact.
              </div>
            )}
          </div>

        </div>

        {/* ── PREFERENCE FIELDS (always editable) ──────────────────────── */}
        {isLocked && (
          <div style={{ margin: '20px 0 16px', padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, fontSize: 12, color: '#065F46' }}>
            ✓ The fields below are yours to update anytime — they reflect your choices, not your identity.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* SG rate */}
          <div>
            <div style={labelStyle}>
              Employer SG rate %
              <Hint>The Superannuation Guarantee rate your employer pays on top of your salary. This is 12% for most employees from 1 July 2025. Check your payslip or employment contract to confirm.</Hint>
            </div>
            <input type="number" step="0.5" value={form.employer_sg_rate} onChange={e => set('employer_sg_rate', +e.target.value)} style={monoInput} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>12% for most employees from 1 Jul 2025</div>
          </div>

          {/* Retirement age */}
          <div>
            <div style={labelStyle}>Target retirement age</div>
            <input type="number" value={form.target_retirement_age} onChange={e => set('target_retirement_age', +e.target.value)} style={monoInput} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>Preservation age is 60. Age Pension eligibility age is 67.</div>
          </div>

          {/* Account count */}
          <div>
            <div style={labelStyle}>
              Number of super accounts
              <Hint>Check MyGov → ATO → Super to see all your super accounts. Multiple accounts mean duplicate fees and insurance. Consolidating to one fund is free via MyGov and takes 5 minutes.</Hint>
            </div>
            <input type="number" min="1" value={form.account_count} onChange={e => set('account_count', +e.target.value)} style={monoInput} />
            {form.account_count > 1 && (
              <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>
                ⚠ Multiple accounts = duplicate fees + duplicate insurance. Consider consolidating via MyGov.
              </div>
            )}
          </div>

        </div>


        {/* ── CONTRIBUTION BEHAVIOUR FIELDS ─────────────────────────────── */}
        <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(15,30,60,0.08)' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>Contribution behaviour</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Are you making voluntary contributions? */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'rgba(15,30,60,0.03)', borderRadius: 12, border: '1px solid rgba(15,30,60,0.08)' }}>
                <input
                  type="checkbox"
                  id="makingVoluntary"
                  checked={form.making_voluntary_contribs ?? false}
                  onChange={e => set('making_voluntary_contribs', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#00D4AA', marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
                />
                <label htmlFor="makingVoluntary" style={{ cursor: 'pointer', flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1E3C', marginBottom: 3 }}>
                    I am making voluntary contributions above the employer SG
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>
                    Tick this if you are salary sacrificing or making personal deductible contributions. This improves your health score accuracy — it tells us you are actively optimising your contributions strategy.
                  </div>
                </label>
                {form.making_voluntary_contribs && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(0,212,170,0.1)', color: '#065F46', fontWeight: 600, flexShrink: 0 }}>+6 pts</span>
                )}
              </div>
            </div>

            {/* Carry-forward balance */}
            <div>
              <div style={labelStyle}>
                Unused carry-forward cap (optional)
                <Hint>
                  Your accumulated unused concessional contributions from the past 5 financial years, visible on MyGov → ATO → Super → Carry-forward concessional contributions.
                  Leave blank if unknown — the contributions page will show the maximum theoretical amount instead.
                </Hint>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={prefix}>$</span>
                <input
                  type="number"
                  value={form.carry_forward_balance ?? ''}
                  onChange={e => set('carry_forward_balance', e.target.value === '' ? null : +e.target.value)}
                  placeholder="e.g. 27500"
                  style={{ ...monoInput, paddingLeft: 28 }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>
                Check MyGov → ATO → Super → Carry-forward contributions
              </div>
            </div>

            {/* Personal (after-tax) contributions YTD */}
            <div>
              <div style={labelStyle}>
                Personal after-tax contributions this year (optional)
                <Hint>
                  Non-concessional (after-tax) contributions you have made this financial year. Used to accurately calculate your bring-forward rule eligibility. Check your fund&apos;s transaction history or ATO MyGov. Leave blank if you haven&apos;t made any.
                </Hint>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={prefix}>$</span>
                <input
                  type="number"
                  value={form.personal_contribs_ytd ?? 0}
                  onChange={e => set('personal_contribs_ytd', +e.target.value)}
                  style={{ ...monoInput, paddingLeft: 28 }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>
                Non-concessional annual cap: $120,000 (rising to $130,000 from 1 Jul 2026)
              </div>
            </div>

          </div>
        </div>

        {/* Spouse upsell */}
        <div style={{ marginTop: 20, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 4 }}>👫 Does your spouse have super?</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>
              Each person's super is unique — different fund, different fees, different health score.
              Create a separate account for your spouse to get their own personalised analysis, health score, and contribution strategy.
            </div>
          </div>
          <a href="/signup"
            style={{ flexShrink: 0, background: '#0F1E3C', color: '#00D4AA', padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Create spouse account →
          </a>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', color: '#991B1B', border: '1px solid rgba(232,93,93,0.2)', fontSize: 13 }}>
            {error}
          </div>
        )}


        {/* PDS disclaimer */}
        <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(15,30,60,0.04)', borderRadius: 8, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
          <strong style={{ color: 'rgba(15,30,60,0.6)' }}>Fee accuracy note:</strong> Investment fees shown are sourced from each fund's current Product Disclosure Statement (PDS) or Fees and Costs Guide — verified June 2026. For Hostplus active options, fees shown exclude performance fees (variable, historically up to 0.37–0.41% p.a. additional). Total fees also include a flat administration fee ($52–$78/yr depending on fund) not included in the % shown. Always verify in your fund's current PDS at the fund's website before making decisions.
        </div>

        {/* Save */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={save} disabled={saving}
            style={{ padding: '10px 32px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: saved ? '#10B981' : '#0F1E3C', color: 'white', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : isLocked ? 'Save preferences' : 'Save & lock profile'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#10B981' }}>
            {isLocked ? 'Preferences updated.' : 'Profile saved and locked — your health score now reflects your details.'}
          </span>}
        </div>
      </div>

      {/* Subscription card */}
      <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 }}>Subscription</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#0F1E3C', fontSize: 16 }}>
              {subscription?.plan === 'free' ? 'Free plan' : `${subscription?.plan} plan`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>
              {subscription?.plan === 'free' ? 'Upgrade to unlock all 8 modules'
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
