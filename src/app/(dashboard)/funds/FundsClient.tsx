'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { fmt } from '@/lib/calculations'

const FUNDS = [
  { name: 'UniSuper Balanced', type: 'Industry', ret7: 9.1, fee: 0.36, apra: 'passed', abbr: 'US' },
  { name: 'Australian Retirement Trust', type: 'Industry', ret7: 8.9, fee: 0.44, apra: 'passed', abbr: 'ART' },
  { name: 'AustralianSuper Balanced', type: 'Industry', ret7: 8.7, fee: 0.51, apra: 'passed', abbr: 'AS' },
  { name: 'Hostplus Balanced', type: 'Industry', ret7: 8.4, fee: 0.78, apra: 'passed', abbr: 'HP', isCurrent: true },
  { name: 'Aware Super High Growth', type: 'Industry', ret7: 8.2, fee: 0.58, apra: 'passed', abbr: 'AW' },
  { name: 'Cbus MySuper Growth', type: 'Industry', ret7: 8.0, fee: 0.57, apra: 'passed', abbr: 'CB' },
  { name: 'Rest Core Strategy', type: 'Industry', ret7: 7.9, fee: 0.62, apra: 'passed', abbr: 'RE' },
  { name: 'BT Super MySuper', type: 'Retail', ret7: 6.8, fee: 1.24, apra: 'failed', abbr: 'BT' },
]

export function FundsClient() {
  const [balance, setBalance] = useState(287450)
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = FUNDS.filter(f => typeFilter === 'all' || f.type.toLowerCase() === typeFilter)
  const current = FUNDS.find(f => f.isCurrent)!
  const best = FUNDS[0]

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="space-y-3">
            <Select label="Fund type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All funds</option>
              <option value="industry">Industry funds</option>
              <option value="retail">Retail funds</option>
            </Select>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-navy/60 uppercase tracking-wide">Balance for fee calculation</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 text-sm">$</span>
                <input type="number" value={balance} onChange={e => setBalance(+e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-black/10 font-mono text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20" />
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-navy rounded-2xl p-6 text-white">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Comparing your fund</div>
          <div className="text-xl font-semibold mb-1">{current.name}</div>
          <div className="text-sm text-white/50 mb-4">{current.fee}% p.a. · {current.ret7}% 7-yr return</div>
          <div className="flex gap-6">
            <div>
              <div className="font-mono text-2xl font-medium text-red-400">+{(current.fee - best.fee).toFixed(2)}%</div>
              <div className="text-xs text-white/40 mt-0.5">vs best-fee fund</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-medium text-amber-400">−{(best.ret7 - current.ret7).toFixed(1)}%</div>
              <div className="text-xs text-white/40 mt-0.5">vs top-return fund</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-medium text-red-400">−{fmt((current.fee - best.fee) * balance / 100)}</div>
              <div className="text-xs text-white/40 mt-0.5">extra fees p.a.</div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardTitle>Top MySuper balanced options — ranked by 7-year net return</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black/8 text-xs text-navy/40 uppercase tracking-wide font-medium">
                <th className="text-left pb-3 pl-2">#</th>
                <th className="text-left pb-3">Fund</th>
                <th className="text-left pb-3">Type</th>
                <th className="text-right pb-3">7-yr return</th>
                <th className="text-right pb-3">Fee %</th>
                <th className="text-right pb-3">Fee $ (your balance)</th>
                <th className="text-right pb-3 pr-2">APRA 2025</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fund, i) => (
                <tr key={fund.name}
                  className={`border-b border-black/5 hover:bg-surface transition-colors ${fund.isCurrent ? 'bg-teal/5 ring-1 ring-inset ring-teal/30' : ''}`}>
                  <td className="py-3 pl-2 font-mono text-navy/30 text-xs">{i + 1}</td>
                  <td className="py-3 font-medium text-navy">
                    {fund.name}
                    {fund.isCurrent && (
                      <span className="ml-2 text-[10px] bg-teal/10 text-teal-800 px-1.5 py-0.5 rounded font-semibold">YOUR FUND</span>
                    )}
                  </td>
                  <td className="py-3 text-navy/50 text-xs">{fund.type}</td>
                  <td className={`py-3 text-right font-mono font-medium ${fund.ret7 >= 8.5 ? 'text-teal' : fund.ret7 >= 7.5 ? 'text-navy' : 'text-amber-600'}`}>
                    {fund.ret7}%
                  </td>
                  <td className={`py-3 text-right font-mono ${fund.fee <= 0.50 ? 'text-teal' : fund.fee <= 0.80 ? 'text-navy' : 'text-red-600 font-medium'}`}>
                    {fund.fee}%
                  </td>
                  <td className={`py-3 text-right font-mono ${fund.fee <= 0.50 ? 'text-teal' : fund.fee <= 0.80 ? 'text-navy' : 'text-red-600 font-medium'}`}>
                    {fmt(fund.fee / 100 * balance)}/yr
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fund.apra === 'passed' ? 'bg-teal/10 text-teal-800' : 'bg-red-50 text-red-700'}`}>
                      {fund.apra === 'passed' ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-navy/40 bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        Fund return and fee data sourced from publicly available APRA and fund disclosure statements as at June 2026. Returns are after investment fees and tax. Past performance is not a reliable indicator of future performance. This comparison does not constitute a recommendation to switch funds.
      </p>
    </div>
  )
}
