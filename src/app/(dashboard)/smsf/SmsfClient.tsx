'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Paywall } from '@/components/ui/Paywall'
import { fmt } from '@/lib/calculations'

const DEFAULT_HOLDINGS = [
  { ticker: 'VGS', value: 180000, asset_class: 'global_equity' },
  { ticker: 'NDQ', value: 150000, asset_class: 'us_tech' },
  { ticker: 'A200', value: 80000, asset_class: 'aus_equity' },
  { ticker: 'BGBL', value: 50000, asset_class: 'global_equity' },
  { ticker: 'VAP', value: 40000, asset_class: 'property' },
]

const OVERLAP_PAIRS: Record<string, { overlaps: string[]; reason: string }> = {
  'VGS+BGBL': { overlaps: ['VGS', 'BGBL'], reason: 'Both track MSCI World ex-AU — ~95% underlying overlap. Consider removing BGBL.' },
  'VGS+IVV': { overlaps: ['VGS', 'IVV'], reason: 'VGS is global ex-AU; IVV is US-only. Heavy US tech duplication.' },
  'A200+VAS': { overlaps: ['A200', 'VAS'], reason: 'Both track ASX 200/300. No diversification benefit from holding both.' },
  'NDQ+VGS': { overlaps: ['NDQ', 'VGS'], reason: 'NDQ adds heavy Nasdaq concentration on top of tech already in VGS.' },
}

export function SmsfClient({ holdings: initialHoldings, subscription }: { holdings: any[]; subscription: any }) {
  const isPaid = subscription?.plan === 'optimiser' || subscription?.plan === 'retirement' || subscription?.add_ons?.includes('smsf')
  const [holdings] = useState(initialHoldings.length > 0 ? initialHoldings : DEFAULT_HOLDINGS)

  const total = holdings.reduce((s, h) => s + (h.value || 0), 0)

  const detectedOverlaps = Object.entries(OVERLAP_PAIRS).filter(([key, { overlaps }]) => {
    const tickers = holdings.map(h => h.ticker)
    return overlaps.every(t => tickers.includes(t))
  })

  if (!isPaid) {
    return (
      <div className="max-w-5xl">
        <Paywall feature="SMSF Analytics — ETF overlap, TBAR deadlines, minimum pension tracking" requiredPlan="optimiser" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-5">
      {detectedOverlaps.length > 0 && (
        <Alert variant="warning" title={`${detectedOverlaps.length} ETF overlap${detectedOverlaps.length > 1 ? 's' : ''} detected`}>
          {detectedOverlaps[0][1].reason}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitle>SMSF holdings — sample portfolio</CardTitle>
          <p className="text-xs text-navy/50 mb-3">Update your holdings in Settings → SMSF Portfolio</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black/8 text-xs text-navy/40 uppercase tracking-wide font-medium">
                <th className="text-left pb-2">ETF</th>
                <th className="text-right pb-2">Value</th>
                <th className="text-right pb-2">Allocation</th>
                <th className="text-right pb-2">Class</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const pct = total > 0 ? (h.value / total) * 100 : 0
                const hasOverlap = detectedOverlaps.some(([, { overlaps }]) => overlaps.includes(h.ticker))
                return (
                  <tr key={h.ticker} className={`border-b border-black/5 ${hasOverlap ? 'bg-amber-50' : ''}`}>
                    <td className="py-2.5 font-mono font-medium text-navy flex items-center gap-1.5">
                      {h.ticker}
                      {hasOverlap && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">OVERLAP</span>}
                    </td>
                    <td className="py-2.5 text-right font-mono text-navy">{fmt(h.value)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div className="h-full bg-navy rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-xs text-navy/70 w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-xs text-navy/50">{h.asset_class?.replace('_', ' ')}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/10">
                <td className="pt-3 font-medium text-navy">Total</td>
                <td className="pt-3 text-right font-mono font-semibold text-navy">{fmt(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>TBAR deadline tracker</CardTitle>
            <p className="text-xs text-navy/60 leading-relaxed mb-3">Transfer Balance Account Reports must be lodged within 28 days of each quarter end.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-xs text-navy/40 font-medium uppercase tracking-wide">
                  <th className="text-left pb-2">Quarter end</th>
                  <th className="text-right pb-2">TBAR due</th>
                  <th className="text-right pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { qtr: '30 Jun 2026', due: '28 Jul 2026', status: 'due-soon' },
                  { qtr: '30 Sep 2026', due: '28 Oct 2026', status: 'upcoming' },
                  { qtr: '31 Dec 2026', due: '28 Jan 2027', status: 'upcoming' },
                ].map(r => (
                  <tr key={r.qtr} className="border-b border-black/5">
                    <td className="py-2.5 text-navy">{r.qtr}</td>
                    <td className={`py-2.5 text-right font-mono text-sm ${r.status === 'due-soon' ? 'text-amber-600 font-medium' : 'text-navy/60'}`}>{r.due}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'due-soon' ? 'bg-amber-50 text-amber-800' : 'bg-surface-2 text-navy/50'}`}>
                        {r.status === 'due-soon' ? 'Due soon' : 'Not yet due'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <CardTitle>Minimum pension drawdown rates</CardTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-xs text-navy/40 font-medium uppercase tracking-wide">
                  <th className="text-left pb-2">Age bracket</th>
                  <th className="text-right pb-2">Min %</th>
                  <th className="text-right pb-2">On $500k</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Under 65', '4%', '$20,000'],
                  ['65–74', '5%', '$25,000'],
                  ['75–79', '6%', '$30,000'],
                  ['80–84', '7%', '$35,000'],
                  ['85+', '9–14%', '$45k+'],
                ].map(([age, pct, amt]) => (
                  <tr key={age} className="border-b border-black/5">
                    <td className="py-2.5 text-navy">{age}</td>
                    <td className="py-2.5 text-right font-mono text-navy">{pct}</td>
                    <td className="py-2.5 text-right font-mono text-navy/60">{amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      <p className="text-xs text-navy/40 bg-navy/4 border border-navy/8 rounded-xl px-4 py-3">
        SMSF analytics are general information only. ETF overlap analysis is approximate. SMSF trustees are responsible for all ATO compliance obligations. This tool does not replace a qualified SMSF auditor or accountant.
      </p>
    </div>
  )
}
