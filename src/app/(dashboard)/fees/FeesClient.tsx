'use client'
import { useState, useMemo } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ResultBox, ResultRow } from '@/components/ui/ResultBox'
import { calcFeeDrag, fmt, fmtShort } from '@/lib/calculations'

export function FeesClient() {
  const [balance, setBalance] = useState(287450)
  const [current, setCurrent] = useState(0.78)
  const [compare, setCompare] = useState(0.36)
  const [years, setYears] = useState(20)

  const result = useMemo(() => calcFeeDrag(balance, current, compare, years), [balance, current, compare, years])

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-navy rounded-2xl p-6 text-white">
        <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Estimated fee drag over {years} years</div>
        <div className="font-mono text-5xl font-medium text-red-400 mb-1">−{fmt(result.drag)}</div>
        <div className="text-sm text-white/60">compared to the lowest-fee equivalent fund</div>
        <div className="mt-5 space-y-3">
          {[
            { label: `Your fund (${current}%)`, width: Math.min(98, current * 70), color: '#EF4444', val: fmt(balance) },
            { label: `Low-fee option (${compare}%)`, width: Math.min(98, compare * 70), color: '#00D4AA', val: 'Same balance' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xs text-white/60 w-36 flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.width}%`, background: b.color }} />
              </div>
              <span className="text-xs font-mono text-white/70 w-24 text-right">{b.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitle>Fee drag calculator</CardTitle>
          <div className="space-y-4 mt-3">
            <Input label="Current balance" prefix="$" type="number" value={balance} onChange={e => setBalance(+e.target.value)} />
            <Input label="Current fund fee (%)" type="number" step={0.01} value={current} onChange={e => setCurrent(+e.target.value)} />
            <Input label="Comparison fund fee (%)" type="number" step={0.01} value={compare} onChange={e => setCompare(+e.target.value)} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-navy/60 uppercase tracking-wide">
                <span>Years to compare</span><span className="font-mono text-navy">{years} yrs</span>
              </div>
              <input type="range" min={5} max={30} value={years} onChange={e => setYears(+e.target.value)} className="w-full" />
            </div>
          </div>
          <ResultBox>
            <ResultRow label="Annual fee difference" value={fmt(result.annualDiff)} accent="amber" />
            <ResultRow label="Fee drag over {years} years" value={fmt(result.drag)} accent="red" />
            <ResultRow label="Your portfolio value" value={fmtShort(result.youBalance)} />
            <ResultRow label="Low-fee portfolio value" value={fmtShort(result.lowFeeBalance)} accent="teal" />
          </ResultBox>
        </Card>

        <Card>
          <CardTitle>APRA performance test status — 2025</CardTitle>
          <p className="text-sm text-navy/60 leading-relaxed mt-2 mb-4">
            APRA publishes annual performance tests for all MySuper products. Any fund that underperforms its benchmark must notify all members.
          </p>
          <div className="border border-teal/30 bg-teal/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-teal/10 rounded-lg flex items-center justify-center font-bold text-sm text-teal-800 flex-shrink-0">HP</div>
            <div className="flex-1">
              <div className="font-medium text-navy text-sm">Hostplus Balanced</div>
              <div className="text-xs text-navy/50">Industry fund · MySuper</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-medium text-navy">8.4% p.a.</div>
              <div className="text-xs text-navy/40">7-yr avg</div>
            </div>
            <div className="ml-2 text-xs bg-teal/10 text-teal-800 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal" />
              Passed 2025
            </div>
          </div>
          <p className="text-xs text-navy/40 leading-relaxed mt-4">
            General information only. Past fund performance is not a reliable indicator of future performance.
          </p>
        </Card>
      </div>
    </div>
  )
}
