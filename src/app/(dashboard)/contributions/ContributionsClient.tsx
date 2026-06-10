'use client'
import { useState, useMemo } from 'react'
import { calcConcessionalCap, buildCarryForwardYears, fmt, CARRY_FORWARD_TSB_LIMIT, NCC_CAP_2526 } from '@/lib/calculations'

const S = {
  card: { background: 'white', borderRadius: 16, padding: '24px', border: '1px solid rgba(15,30,60,0.1)', marginBottom: 20 } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 6 },
  sectionLabel: { fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'rgba(15,30,60,0.4)', marginBottom: 16 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const },
  inputPrefix: { width: '100%', paddingLeft: 28, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1px solid rgba(15,30,60,0.12)', borderRadius: 10, fontFamily: 'monospace', fontSize: 14, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const },
  resultBox: { background: '#0F1E3C', borderRadius: 12, padding: '16px 20px', marginTop: 16 },
  resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as React.CSSProperties,
  resultLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  prefix: { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 13, pointerEvents: 'none' as const },
}

function Alert({ variant, title, children }: { variant: 'danger' | 'warning' | 'success'; title: string; children: React.ReactNode }) {
  const cfg = {
    danger: { bg: '#FEF2F2', border: 'rgba(232,93,93,0.25)', color: '#7F1D1D' },
    warning: { bg: '#FFFBEB', border: 'rgba(245,158,11,0.3)', color: '#78350F' },
    success: { bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.25)', color: '#065F46' },
  }[variant]
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
      <div style={{ color: cfg.color, fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div style={{ opacity: 0.85 }}>{children}</div>
      </div>
    </div>
  )
}

export function ContributionsClient({ superProfile: sp, subscription }: { superProfile: any; subscription: any }) {
  const isPaid = subscription?.plan !== 'free'
  const [salary, setSalary] = useState(sp?.salary ?? 135000)
  const [sgRate, setSgRate] = useState(sp?.employer_sg_rate ?? 12)
  const [ssAmount, setSsAmount] = useState(0)
  const [tsb, setTsb] = useState(sp?.current_balance ?? 287450)

  const cap = useMemo(() => calcConcessionalCap(salary, sgRate, ssAmount), [salary, sgRate, ssAmount])
  const cfYears = useMemo(() => buildCarryForwardYears(), [])
  const cfTotal = useMemo(() => cfYears.reduce((s, y) => s + y.unused, 0), [cfYears])
  const cfEligible = tsb < CARRY_FORWARD_TSB_LIMIT
  const nccEligible = tsb < 2_000_000

  return (
    <div style={{ maxWidth: 960 }}>
      <Alert variant="danger" title="2020–21 carry-forward cap expires 30 June 2026">
        $27,500 in unused concessional cap will be permanently lost. This cannot be extended or recovered.
      </Alert>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Concessional cap */}
        <div style={S.card}>
          <div style={S.sectionLabel}>Concessional cap calculator — 2025–26</div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Annual salary</label>
            <div style={{ position: 'relative' }}>
              <span style={S.prefix}>$</span>
              <input type="number" value={salary} onChange={e => setSalary(+e.target.value)} style={S.inputPrefix} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>SG rate %</label>
            <input type="number" value={sgRate} step={0.5} onChange={e => setSgRate(+e.target.value)} style={S.input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Salary sacrifice (annual)</label>
            <div style={{ position: 'relative' }}>
              <span style={S.prefix}>$</span>
              <input type="number" value={ssAmount} onChange={e => setSsAmount(+e.target.value)} style={S.inputPrefix} />
            </div>
          </div>
          <div style={S.resultBox}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Result</div>
            {[
              { label: 'Annual cap', value: '$30,000', color: 'white' },
              { label: 'Employer SG', value: fmt(cap.sgAmount), color: 'white' },
              { label: 'Your salary sacrifice', value: fmt(ssAmount), color: 'white' },
              { label: 'Remaining headroom', value: fmt(cap.headroom), color: '#00D4AA' },
              { label: 'Est. tax saving on max sacrifice', value: fmt(cap.taxSaving), color: '#00D4AA' },
            ].map(r => (
              <div key={r.label} style={{ ...S.resultRow }}>
                <span style={S.resultLabel}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carry forward */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={S.sectionLabel}>Carry-forward tracker</div>
            <span style={{ fontSize: 10, background: '#FEF2F2', color: '#991B1B', padding: '2px 7px', borderRadius: 4, fontWeight: 600, marginBottom: 16 }}>EXPIRES SOON</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
            If your TSB was under $500,000 on 30 June 2025, you can use unused caps from the past 5 years. The 2020–21 amount expires <strong style={{ color: '#0F1E3C' }}>30 June 2026</strong>.
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Total super balance (30 Jun 2025)</label>
            <div style={{ position: 'relative' }}>
              <span style={S.prefix}>$</span>
              <input type="number" value={tsb} onChange={e => setTsb(+e.target.value)} style={S.inputPrefix} />
            </div>
          </div>
          {!isPaid ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(15,30,60,0.4)', fontSize: 13 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 500, color: '#0F1E3C', marginBottom: 4 }}>Carry-Forward Tracker</div>
              <div style={{ marginBottom: 12 }}>Available on the Optimiser plan</div>
              <a href="/pricing" style={{ background: '#00D4AA', color: '#0F1E3C', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>Upgrade — from $149/year</a>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(15,30,60,0.08)' }}>
                    {['Year', 'Unused', 'Expires'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cfYears.map(y => (
                    <tr key={y.year} style={{ borderBottom: '1px solid rgba(15,30,60,0.05)', background: y.isExpiringSoon ? '#FEF2F2' : 'transparent' }}>
                      <td style={{ padding: '9px 8px', fontWeight: 500, color: '#0F1E3C' }}>{y.year}</td>
                      <td style={{ padding: '9px 8px', fontFamily: 'monospace', fontWeight: 500, color: y.isExpiringSoon ? '#DC2626' : y.unused > 0 ? '#D97706' : 'rgba(15,30,60,0.4)' }}>{fmt(y.unused)}</td>
                      <td style={{ padding: '9px 8px', color: 'rgba(15,30,60,0.5)', fontSize: 11 }}>{y.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={S.resultBox}>
                {[
                  { label: 'Total carry-forward available', value: fmt(cfTotal), color: '#00D4AA' },
                  { label: 'Max contribution this year', value: fmt(30000 + (cfEligible ? cfTotal : 0)), color: '#00D4AA' },
                  { label: 'Eligible? (TSB under $500k)', value: cfEligible ? '✓ Yes' : '✗ No', color: cfEligible ? '#00D4AA' : '#EF4444' },
                ].map(r => (
                  <div key={r.label} style={{ ...S.resultRow }}>
                    <span style={S.resultLabel}>{r.label}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 500, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* NCC bring-forward */}
      <div style={S.card}>
        <div style={S.sectionLabel}>Non-concessional bring-forward rule</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 14 }}>
              The bring-forward rule lets you contribute up to 3 years of non-concessional (after-tax) caps in a single year. The annual cap is <strong style={{ color: '#0F1E3C' }}>$120,000</strong>, rising to $130,000 from 1 July 2026.
            </p>
            {nccEligible ? (
              <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontWeight: 500, color: '#065F46', marginBottom: 4, fontSize: 13 }}>✓ You are eligible for the bring-forward rule</div>
                <div style={{ fontSize: 12, color: '#065F46', opacity: 0.9 }}>Your TSB of {fmt(tsb)} is below the $2M threshold. You can contribute up to $360,000 this year. From 1 July 2026 this rises to $390,000.</div>
              </div>
            ) : (
              <div style={{ background: '#FEF2F2', border: '1px solid rgba(232,93,93,0.25)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontWeight: 500, color: '#991B1B', fontSize: 13 }}>✗ Not eligible — TSB exceeds $2M</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Annual NCC cap (2025–26)', value: '$120,000', color: '#0F1E3C' },
              { label: 'Max 3-year bring-forward (this year)', value: '$360,000', color: '#00D4AA' },
              { label: 'Max from 1 Jul 2026', value: '$390,000', color: '#D97706' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,30,60,0.04)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        General information only. Contribution rules are based on ATO guidelines current at June 2026. Before making super contributions, consider whether this is appropriate for your circumstances.
      </div>
    </div>
  )
}
