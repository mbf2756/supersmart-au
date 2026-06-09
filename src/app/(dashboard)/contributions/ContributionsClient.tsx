'use client'
import { useState, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ResultBox, ResultRow } from '@/components/ui/ResultBox'
import { Paywall } from '@/components/ui/Paywall'
import { calcConcessionalCap, calcSalarySacrificeSaving, buildCarryForwardYears, fmt, CARRY_FORWARD_TSB_LIMIT, NCC_CAP_2526 } from '@/lib/calculations'
import type { SuperProfile, Subscription } from '@/types'

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
  const nccBringFwd = tsb < 2_000_000

  return (
    <div className="max-w-5xl space-y-5">
      <Alert variant="danger" title="2020–21 carry-forward cap expires 30 June 2026">
        $27,500 in unused concessional cap will be permanently lost. This cannot be extended or recovered.
      </Alert>

      <div className="grid grid-cols-2 gap-5">
        {/* Concessional cap */}
        <Card>
          <CardTitle>Concessional cap calculator — 2025–26</CardTitle>
          <div className="space-y-4 mt-3">
            <Input label="Annual salary" prefix="$" type="number" value={salary} onChange={e => setSalary(+e.target.value)} />
            <Input label="SG rate %" type="number" value={sgRate} step={0.5} onChange={e => setSgRate(+e.target.value)} />
            <Input label="Salary sacrifice (annual)" prefix="$" type="number" value={ssAmount} onChange={e => setSsAmount(+e.target.value)} />
          </div>
          <ResultBox>
            <ResultRow label="Annual cap" value="$30,000" />
            <ResultRow label="Employer SG" value={fmt(cap.sgAmount)} />
            <ResultRow label="Your salary sacrifice" value={fmt(ssAmount)} />
            <ResultRow label="Remaining headroom" value={fmt(cap.headroom)} accent="teal" />
            <ResultRow label="Est. tax saving on max sacrifice" value={fmt(cap.taxSaving)} accent="teal" />
          </ResultBox>
        </Card>

        {/* Carry-forward */}
        <Card>
          <CardTitle>Carry-forward tracker</CardTitle>
          {!isPaid ? (
            <Paywall feature="Carry-Forward Tracker" />
          ) : (
            <>
              <div className="mt-3 mb-4">
                <Input label="Total super balance (30 Jun 2025)" prefix="$" type="number" value={tsb} onChange={e => setTsb(+e.target.value)} />
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-navy/40 border-b border-black/8">
                    <th className="text-left pb-2 font-medium">Year</th>
                    <th className="text-right pb-2 font-medium">Unused</th>
                    <th className="text-right pb-2 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {cfYears.map(y => (
                    <tr key={y.year} className={`border-b border-black/5 ${y.isExpiringSoon ? 'bg-red-50' : ''}`}>
                      <td className="py-2 font-medium text-navy">{y.year}</td>
                      <td className={`py-2 text-right font-mono font-medium ${y.isExpiringSoon ? 'text-red-700' : y.unused > 0 ? 'text-amber-700' : 'text-navy/40'}`}>
                        {fmt(y.unused)}
                      </td>
                      <td className="py-2 text-right text-navy/50">{y.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ResultBox>
                <ResultRow label="Total carry-forward available" value={fmt(cfTotal)} accent="teal" />
                <ResultRow label="Max contribution this year" value={fmt(30000 + (cfEligible ? cfTotal : 0))} accent="teal" />
                <ResultRow label="Eligible? (TSB under $500k)" value={cfEligible ? '✓ Yes' : '✗ No'} accent={cfEligible ? 'teal' : 'red'} />
              </ResultBox>
            </>
          )}
        </Card>
      </div>

      {/* NCC Bring-forward */}
      <Card>
        <CardTitle>Non-concessional bring-forward rule</CardTitle>
        <div className="grid grid-cols-2 gap-6 mt-3">
          <div className="space-y-3 text-sm text-navy/70 leading-relaxed">
            <p>The bring-forward rule lets you contribute up to 3 years of non-concessional (after-tax) caps in a single year. The annual cap is <strong className="text-navy">$120,000</strong>, rising to $130,000 from 1 July 2026.</p>
            {nccBringFwd ? (
              <Alert variant="success" title="You are eligible for the bring-forward rule">
                Your TSB of {fmt(tsb)} is below the $2M threshold. You can contribute up to $360,000 this year as non-concessional contributions. From 1 July 2026 this rises to $390,000.
              </Alert>
            ) : (
              <Alert variant="danger" title="Not eligible — TSB exceeds $2M">
                Non-concessional contributions are not available if your TSB is above the transfer balance cap of $2M.
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            {[
              { label: 'Annual NCC cap (2025–26)', value: '$120,000', color: 'text-navy' },
              { label: 'Max 3-year bring-forward (this year)', value: '$360,000', color: 'text-teal' },
              { label: 'Max from 1 Jul 2026', value: '$390,000', color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-surface-2 rounded-xl px-4 py-3">
                <div className={`font-mono text-xl font-medium ${s.color}`}>{s.value}</div>
                <div className="text-xs text-navy/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="text-xs text-navy/40 leading-relaxed bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        General information only. Contribution rules are based on ATO guidelines current at June 2026. Before making super contributions, consider whether this is appropriate for your circumstances.
      </div>
    </div>
  )
}
