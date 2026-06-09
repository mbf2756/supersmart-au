'use client'
import { useState, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ResultBox, ResultRow } from '@/components/ui/ResultBox'
import { calcSalarySacrificeSaving, getMarginalRate, calcConcessionalCap, fmt } from '@/lib/calculations'

export function SalaryClient() {
  const [salary, setSalary] = useState(135000)
  const [monthly, setMonthly] = useState(500)
  const [sgRate, setSgRate] = useState(12)

  const result = useMemo(() => calcSalarySacrificeSaving(salary, monthly), [salary, monthly])
  const capInfo = useMemo(() => calcConcessionalCap(salary, sgRate, monthly * 12), [salary, sgRate, monthly])
  const marginal = getMarginalRate(salary)

  const tableAmounts = [250, 500, 750, 1000, Math.round(capInfo.headroom / 12)]

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitle>Salary sacrifice calculator</CardTitle>
          <div className="space-y-4 mt-3">
            <Input label="Gross salary" prefix="$" type="number" value={salary} onChange={e => setSalary(+e.target.value)} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-navy/60 uppercase tracking-wide">
                <span>Monthly sacrifice amount</span>
                <span className="font-mono text-navy">{fmt(monthly)}/mo</span>
              </div>
              <input type="range" min={0} max={Math.ceil(capInfo.headroom / 12)} step={50} value={monthly}
                onChange={e => setMonthly(+e.target.value)} className="w-full" />
            </div>
            <Input label="SG rate %" type="number" value={sgRate} step={0.5} onChange={e => setSgRate(+e.target.value)} />
          </div>
          <ResultBox>
            <ResultRow label="Annual sacrifice" value={fmt(result.annual)} />
            <ResultRow label="Tax saving vs no sacrifice" value={fmt(result.taxSaving)} accent="teal" />
            <ResultRow label="Take-home pay reduction" value={fmt(result.takeHomeCost)} accent="amber" />
            <ResultRow label="Extra into super" value={fmt(result.annual)} accent="teal" />
            <ResultRow label="Remaining cap headroom" value={fmt(capInfo.headroom)} />
          </ResultBox>
        </Card>

        <Card>
          <CardTitle>Marginal rate & tax benefit</CardTitle>
          <p className="text-sm text-navy/60 leading-relaxed mt-2 mb-4">
            Salary sacrifice is taxed at <strong className="text-navy">15%</strong> in super instead of your marginal rate of{' '}
            <strong className="text-navy">{(marginal * 100).toFixed(0)}%</strong>. The difference is your saving.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/8 text-navy/40 uppercase tracking-wide font-medium">
                <th className="text-left pb-2">$/month</th>
                <th className="text-right pb-2">Annual</th>
                <th className="text-right pb-2">Tax saving</th>
                <th className="text-right pb-2">Take-home cost</th>
              </tr>
            </thead>
            <tbody>
              {tableAmounts.filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amt => {
                const r = calcSalarySacrificeSaving(salary, amt)
                const isMax = amt === tableAmounts[tableAmounts.length - 1]
                return (
                  <tr key={amt} className={`border-b border-black/5 ${isMax ? 'bg-teal/5 font-medium' : ''}`}>
                    <td className="py-2.5 font-mono text-navy">{fmt(amt)}{isMax ? ' (max)' : ''}</td>
                    <td className="py-2.5 text-right font-mono text-navy">{fmt(r.annual)}</td>
                    <td className="py-2.5 text-right font-mono text-teal">{fmt(r.taxSaving)}</td>
                    <td className="py-2.5 text-right font-mono text-navy/60">{fmt(r.takeHomeCost)}/yr</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {result.div293Risk && (
            <Alert variant="warning" className="mt-4" title="Division 293 applies">
              Your income exceeds $250,000. An additional 15% tax applies to concessional contributions — salary sacrifice may still be worthwhile but the tax benefit is reduced.
            </Alert>
          )}
        </Card>
      </div>
      <p className="text-xs text-navy/40 bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        Tax calculations use 2025–26 ATO individual income tax rates. Does not account for Medicare levy, HECS/HELP, investment income, or other deductions. Salary sacrifice must be agreed with your employer before the income is earned. General information only.
      </p>
    </div>
  )
}
