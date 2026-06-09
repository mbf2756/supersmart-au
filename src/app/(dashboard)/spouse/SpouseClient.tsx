'use client'
import { useState, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ResultBox, ResultRow } from '@/components/ui/ResultBox'
import { calcSpouseOffset, fmt } from '@/lib/calculations'

export function SpouseClient() {
  const [yourTSB, setYourTSB] = useState(287450)
  const [yourSalary, setYourSalary] = useState(135000)
  const [spouseTSB, setSpouseTSB] = useState(180000)
  const [spouseIncome, setSpouseIncome] = useState(28000)
  const [contribution, setContribution] = useState(3000)

  const offsetResult = useMemo(
    () => calcSpouseOffset(spouseIncome, contribution, spouseTSB),
    [spouseIncome, contribution, spouseTSB]
  )
  const gap = Math.abs(yourTSB - spouseTSB)
  const maxSplit = 0.85 * 30000

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitle>Spouse contribution analyser</CardTitle>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-navy/40 uppercase tracking-wide">Your details</p>
              <Input label="Your TSB" prefix="$" type="number" value={yourTSB} onChange={e => setYourTSB(+e.target.value)} />
              <Input label="Your salary" prefix="$" type="number" value={yourSalary} onChange={e => setYourSalary(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-navy/40 uppercase tracking-wide">Spouse details</p>
              <Input label="Spouse TSB" prefix="$" type="number" value={spouseTSB} onChange={e => setSpouseTSB(+e.target.value)} />
              <Input label="Spouse income" prefix="$" type="number" value={spouseIncome} onChange={e => setSpouseIncome(+e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Input label="Contribution to spouse's super (from your after-tax income)" prefix="$" type="number" value={contribution} onChange={e => setContribution(+e.target.value)} />
          </div>
          <ResultBox>
            <ResultRow label="Spouse tax offset" value={fmt(offsetResult.offset)} accent={offsetResult.eligible ? 'teal' : 'red'} />
            <ResultRow label="Eligible?" value={offsetResult.eligible ? '✓ Yes' : `✗ No — ${offsetResult.reason}`} accent={offsetResult.eligible ? 'teal' : 'red'} />
            <ResultRow label="Spouse TSB eligible?" value={spouseTSB < 2_000_000 ? '✓ Under $2M' : '✗ Exceeds $2M'} accent={spouseTSB < 2_000_000 ? 'teal' : 'red'} />
            <ResultRow label="Combined TSB" value={fmt(yourTSB + spouseTSB)} />
          </ResultBox>
        </Card>

        <Card>
          <CardTitle>Contribution splitting — equalise balances</CardTitle>
          <p className="text-sm text-navy/60 leading-relaxed mt-2 mb-4">
            You can split up to 85% of your annual concessional contributions to your spouse's fund. This helps equalise balances and may reduce future Division 296 exposure.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Balance gap', value: fmt(gap) },
              { label: 'Max you can split this year', value: fmt(maxSplit), teal: true },
            ].map(s => (
              <div key={s.label} className="bg-surface-2 rounded-xl px-4 py-3">
                <div className={`font-mono text-lg font-medium ${s.teal ? 'text-teal' : 'text-navy'}`}>{s.value}</div>
                <div className="text-xs text-navy/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {offsetResult.eligible ? (
            <Alert variant="success" title={`Spouse offset: ${fmt(offsetResult.offset)} tax saving`}>
              Contributing {fmt(contribution)} to your spouse's super qualifies for a tax offset of {fmt(offsetResult.offset)}. This is a direct credit on your tax return — not just a deduction.
            </Alert>
          ) : (
            <Alert variant="warning" title="Spouse offset not available">
              {offsetResult.reason}. Consider contribution splitting instead to equalise balances.
            </Alert>
          )}
          <Alert variant="info" className="mt-3">
            Your combined TSB of {fmt(yourTSB + spouseTSB)} is well below the Division 296 threshold. Contribution splitting is not urgent but builds good long-term balance equalisation habits.
          </Alert>
        </Card>
      </div>
      <p className="text-xs text-navy/40 bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        Spouse contribution rules are governed by the ATO. Eligibility is based on your spouse's income and TSB as at 30 June of the prior year. General information only — not financial advice.
      </p>
    </div>
  )
}
