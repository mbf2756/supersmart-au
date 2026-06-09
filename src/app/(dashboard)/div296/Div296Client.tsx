'use client'
import { useState, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ResultBox, ResultRow } from '@/components/ui/ResultBox'
import { calcDiv296Exposure, yearsToThreshold, projectBalance, fmt, DIV296_THRESHOLD } from '@/lib/calculations'

export function Div296Client() {
  const [balance, setBalance] = useState(287450)
  const [annualContrib, setAnnualContrib] = useState(30000)
  const [returnRate, setReturnRate] = useState(7)
  const [age, setAge] = useState(46)

  const proj65 = useMemo(() => projectBalance(balance, annualContrib, returnRate / 100, Math.max(0, 65 - age)), [balance, annualContrib, returnRate, age])
  const yrsToThresh = useMemo(() => yearsToThreshold(balance, annualContrib, returnRate / 100, DIV296_THRESHOLD), [balance, annualContrib, returnRate])
  const exposure = useMemo(() => calcDiv296Exposure(balance), [balance])

  return (
    <div className="max-w-5xl space-y-5">
      <Alert variant="info" title="Division 296 tax commences 1 July 2026">
        An additional 15% tax applies to super earnings attributable to balances above $3 million. First assessments after 30 June 2027. Both the $3M and $10M thresholds are indexed to CPI.
      </Alert>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitle>Division 296 exposure calculator</CardTitle>
          <div className="space-y-4 mt-3">
            <Input label="Total super balance (today)" prefix="$" type="number" value={balance} onChange={e => setBalance(+e.target.value)} />
            <Input label="Annual contributions (total)" prefix="$" type="number" value={annualContrib} onChange={e => setAnnualContrib(+e.target.value)} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-navy/60 uppercase tracking-wide">
                <span>Assumed annual return</span><span className="font-mono text-navy">{returnRate}%</span>
              </div>
              <input type="range" min={3} max={12} step={0.5} value={returnRate} onChange={e => setReturnRate(+e.target.value)} className="w-full" />
            </div>
            <Input label="Your age" type="number" value={age} onChange={e => setAge(+e.target.value)} />
          </div>
          <ResultBox>
            <ResultRow label="Est. balance at age 65" value={fmt(proj65)} />
            <ResultRow label="Years until $3M threshold" value={yrsToThresh ? `${yrsToThresh} years` : '25+ years away'} accent="teal" />
            <ResultRow label="Current exposure" value={exposure.exposed ? fmt(exposure.annualTax) + '/yr' : 'Not exposed'} accent={exposure.exposed ? 'red' : 'teal'} />
            <ResultRow label="Status" value={exposure.exposed ? '⚠ Monitor closely' : '✓ Not currently exposed'} accent={exposure.exposed ? 'amber' : 'teal'} />
          </ResultBox>
        </Card>

        <Card>
          <CardTitle>Threshold summary</CardTitle>
          <p className="text-sm text-navy/60 leading-relaxed mt-2 mb-4">
            Division 296 applies proportionally — only the earnings attributable to the balance above $3M are taxed at the additional 15%.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 text-xs text-navy/40 font-medium uppercase tracking-wide">
                <th className="text-left pb-2">Balance range</th>
                <th className="text-right pb-2">Effective rate</th>
                <th className="text-right pb-2">Indexed</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              <tr className="border-b border-black/5">
                <td className="py-2.5 text-navy">Under $3M</td>
                <td className="py-2.5 text-right font-mono text-teal font-medium">15%</td>
                <td className="py-2.5 text-right text-navy/40 text-xs">N/A</td>
              </tr>
              <tr className="border-b border-black/5">
                <td className="py-2.5 text-navy">$3M – $10M</td>
                <td className="py-2.5 text-right font-mono text-amber-600 font-medium">30%</td>
                <td className="py-2.5 text-right text-navy/40 text-xs">+$150k CPI</td>
              </tr>
              <tr>
                <td className="py-2.5 text-navy">Above $10M</td>
                <td className="py-2.5 text-right font-mono text-red-600 font-medium">40%</td>
                <td className="py-2.5 text-right text-navy/40 text-xs">+$500k CPI</td>
              </tr>
            </tbody>
          </table>
          {!exposure.exposed && (
            <Alert variant="success" className="mt-4">
              Based on a balance of {fmt(balance)}, you are not currently exposed to Division 296. Continue monitoring as your balance grows.
            </Alert>
          )}
        </Card>
      </div>
      <p className="text-xs text-navy/40 leading-relaxed bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        Division 296 modelling is based on Treasury Laws Amendment (Better Targeted Superannuation Concessions) Bill 2025, commencing 1 July 2026. Projections are illustrative estimates only. Not financial advice.
      </p>
    </div>
  )
}
