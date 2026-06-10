'use client'
import { useState, useMemo } from 'react'
import { calcSpouseOffset, fmt } from '@/lib/calculations'

export function SpouseClient({ superProfile: sp }: { superProfile: any }) {
  const [yourTSB, setYourTSB] = useState(sp?.current_balance ?? 0)
  const [yourSalary, setYourSalary] = useState(sp?.salary ?? 0)
  const [spouseTSB, setSpouseTSB] = useState(sp?.spouse_balance ?? 0)
  const [spouseIncome, setSpouseIncome] = useState(sp?.spouse_income ?? 0)
  const [contribution, setContribution] = useState(3000)

  const offsetResult = useMemo(
    () => calcSpouseOffset(spouseIncome, contribution, spouseTSB),
    [spouseIncome, contribution, spouseTSB]
  )
  const gap = Math.abs(yourTSB - spouseTSB)
  const maxSplit = 0.85 * 30000

  const card = { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)' }
  const label = { display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 }
  const inputStyle = { width: '100%', paddingLeft: 28, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }
  const prefix = { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13 }

  function PrefixInput({ val, setVal }: { val: number; setVal: (v: number) => void }) {
    return (
      <div style={{ position: 'relative' }}>
        <span style={prefix}>$</span>
        <input type="number" value={val} onChange={e => setVal(+e.target.value)} style={inputStyle} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Analyser */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 20 }}>
            Spouse contribution analyser
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Your details</div>
              <div style={{ marginBottom: 12 }}>
                <label style={label}>Your TSB</label>
                <PrefixInput val={yourTSB} setVal={setYourTSB} />
              </div>
              <div>
                <label style={label}>Your salary</label>
                <PrefixInput val={yourSalary} setVal={setYourSalary} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Spouse details</div>
              <div style={{ marginBottom: 12 }}>
                <label style={label}>Spouse TSB</label>
                <PrefixInput val={spouseTSB} setVal={setSpouseTSB} />
              </div>
              <div>
                <label style={label}>Spouse income</label>
                <PrefixInput val={spouseIncome} setVal={setSpouseIncome} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Contribution to spouse super (from your after-tax income)</label>
            <PrefixInput val={contribution} setVal={setContribution} />
          </div>

          <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Spouse contribution analysis</div>
            {[
              { label: 'Spouse tax offset', value: fmt(offsetResult.offset), color: offsetResult.eligible ? '#00D4AA' : '#EF4444' },
              { label: 'Eligible?', value: offsetResult.eligible ? '✓ Yes' : `✗ No — ${offsetResult.reason}`, color: offsetResult.eligible ? '#00D4AA' : '#EF4444' },
              { label: 'Spouse TSB eligible?', value: spouseTSB < 2_000_000 ? '✓ Under $2M' : '✗ Exceeds $2M', color: spouseTSB < 2_000_000 ? '#00D4AA' : '#EF4444' },
              { label: 'Combined TSB', value: fmt(yourTSB + spouseTSB), color: 'white' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contribution splitting */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>
            Contribution splitting — equalise balances
          </div>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 16 }}>
            You can split up to 85% of your annual concessional contributions to your spouse&#39;s fund. This helps equalise balances and may reduce future Division 296 exposure.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Balance gap', value: fmt(gap), color: '#0F1E3C' },
              { label: 'Max you can split this year', value: fmt(maxSplit), color: '#00D4AA' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,30,60,0.04)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {offsetResult.eligible ? (
            <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontWeight: 500, color: '#065F46', marginBottom: 4, fontSize: 13 }}>✓ Spouse offset: {fmt(offsetResult.offset)} tax saving</div>
              <div style={{ fontSize: 12, color: '#065F46', opacity: 0.9 }}>
                Contributing {fmt(contribution)} to your spouse&#39;s super qualifies for a tax offset of {fmt(offsetResult.offset)}. This is a direct credit on your tax return.
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontWeight: 500, color: '#78350F', marginBottom: 4, fontSize: 13 }}>⚠ Spouse offset not available</div>
              <div style={{ fontSize: 12, color: '#78350F', opacity: 0.9 }}>{offsetResult.reason}. Consider contribution splitting instead to equalise balances.</div>
            </div>
          )}

          <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
              ℹ Your combined TSB of {fmt(yourTSB + spouseTSB)} is well below the Division 296 threshold. Contribution splitting is not urgent but builds good long-term balance equalisation habits.
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', marginTop: 20, fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        Spouse contribution rules are governed by the ATO. Eligibility is based on your spouse&#39;s income and TSB as at 30 June of the prior year. General information only — not financial advice.
      </div>
    </div>
  )
}
