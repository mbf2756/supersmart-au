'use client'
import { useState, useMemo, useRef } from 'react'
import { calcOpportunities, type Opportunity, type OpportunityInputs } from '@/lib/opportunities'
import { fmt, fmtShort, buildCarryForwardYears } from '@/lib/calculations'

const PRIORITY_COLORS = {
  high:   { bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)',   badge: '#EF4444', text: '#7F1D1D', label: 'High impact' },
  medium: { bg: '#FFFBEB', border: 'rgba(245,158,11,0.25)',  badge: '#F59E0B', text: '#78350F', label: 'Medium impact' },
  low:    { bg: 'rgba(0,212,170,0.06)', border: 'rgba(0,212,170,0.2)', badge: '#00D4AA', text: '#065F46', label: 'Lower impact' },
}

const CONFIDENCE_LABELS = {
  certain:    { label: 'Certain', color: '#00D4AA' },
  estimated:  { label: 'Estimated', color: '#F59E0B' },
  indicative: { label: 'Indicative', color: '#8A9BB5' },
}

function OpportunityCard({ opp, rank }: { opp: Opportunity; rank: number }) {
  const [open, setOpen] = useState(false)
  const pc = PRIORITY_COLORS[opp.priority]
  const cc = CONFIDENCE_LABELS[opp.confidence]
  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${pc.border}`, overflow: 'hidden', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}>
        {/* Rank badge */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F1E3C', color: '#00D4AA',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace',
          fontSize: 16, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{rank}</div>
        {/* Icon */}
        <div style={{ fontSize: 24, flexShrink: 0 }}>{opp.icon}</div>
        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1E3C', lineHeight: 1.3 }}>{opp.title}</div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#00D4AA', lineHeight: 1 }}>
                {opp.impactType === 'retirement' ? fmtShort(opp.impact) : fmt(opp.impact)}
              </div>
              <div style={{ fontSize: 11, color: '8A9BB5', marginTop: 2 }}>{opp.impactLabel.replace(/^\$[\d,]+/, '')}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', marginBottom: 8 }}>{opp.subtitle}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: pc.bg, color: pc.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {pc.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
              background: 'rgba(15,30,60,0.05)', color: cc.color }}>
              {cc.label}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.35)' }}>{open ? '▲ Less' : '▼ More detail'}</span>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid rgba(15,30,60,0.07)', padding: '14px 20px 18px', background: 'rgba(15,30,60,0.02)' }}>
          <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.7, marginBottom: 12 }}>{opp.explanation}</p>
          <a href={opp.actionUrl}
            style={{ display: 'inline-block', background: '#0F1E3C', color: '#00D4AA', padding: '8px 18px',
              borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
            {opp.actionLabel}
          </a>
        </div>
      )}
    </div>
  )
}

// PDF generation using jspdf + html2canvas
async function generatePDF(element: HTMLElement, filename: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#f8f9fa',
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentW = pageW - margin * 2
  const imgH = (canvas.height * contentW) / canvas.width

  let posY = margin
  let remaining = imgH

  // Add pages
  while (remaining > 0) {
    if (posY > margin) pdf.addPage()
    const srcY = (imgH - remaining) * (canvas.height / imgH)
    const srcH = Math.min(remaining, pageH - margin * 2) * (canvas.height / imgH)

    // Crop canvas to page slice
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = srcH
    const ctx = tempCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)
    const sliceData = tempCanvas.toDataURL('image/png')
    const sliceH = Math.min(remaining, pageH - margin * 2)
    pdf.addImage(sliceData, 'PNG', margin, posY, contentW, sliceH)
    remaining -= sliceH
    posY = margin
  }

  pdf.save(filename)
}

export function ActionPlanClient({
  superProfile: sp, subscription, smsfHoldings
}: { superProfile: any; subscription: any; smsfHoldings: any[] }) {
  const isPaid = subscription?.plan !== 'free'
  const pdfRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  // Editable extras (non-profile data)
  const [spouseIncome, setSpouseIncome] = useState(sp?.spouse_income ?? 0)
  const [spouseTSB,    setSpouseTSB]    = useState(sp?.spouse_balance ?? 0)
  const [monthlySS,    setMonthlySS]    = useState(0)
  const [showAll,      setShowAll]      = useState(false)

  // Derive carry-forward from profile or theoretical
  const cfYears = useMemo(() => buildCarryForwardYears(), [])
  const cfBalance = useMemo(() => cfYears.reduce((s, y) => s + y.unused, 0), [cfYears])
  const carryForward = sp?.carry_forward_balance ?? (sp?.current_balance < 500000 ? cfBalance : 0)

  const inputs: OpportunityInputs = {
    balance:           sp?.current_balance ?? 0,
    salary:            sp?.salary ?? 0,
    age:               sp?.age ?? 40,
    retirementAge:     sp?.target_retirement_age ?? 65,
    fundName:          sp?.fund_name ?? '',
    fundOption:        sp?.fund_option ?? '',
    fundFeePct:        sp?.fund_fee_pct ?? 0,
    employerSgRate:    sp?.employer_sg_rate ?? 12,
    accountCount:      sp?.account_count ?? 1,
    spouseIncome, spouseTSB, monthlySS,
    carryForwardBalance: carryForward,
    makingVoluntaryContribs: sp?.making_voluntary_contribs ?? false,
  }

  const allOpps = useMemo(() => calcOpportunities(inputs), [
    spouseIncome, spouseTSB, monthlySS, sp
  ])
  const top5 = allOpps.slice(0, 5)
  const displayed = showAll ? allOpps : top5

  const totalImpact = allOpps.filter(o => o.impactType === 'annual').reduce((s, o) => s + o.impact, 0)
  const totalRetirement = allOpps.filter(o => o.impactType === 'retirement').reduce((s, o) => s + o.impact, 0)

  async function handleDownload() {
    if (!pdfRef.current) return
    setGenerating(true)
    try {
      await generatePDF(pdfRef.current, `SmartSuper-Action-Plan-${new Date().getFullYear()}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  if (!isPaid) {
    return (
      <div style={{ maxWidth: 680, background: 'white', borderRadius: 20, padding: '60px 40px', textAlign: 'center', border: '1px solid rgba(15,30,60,0.1)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0F1E3C', marginBottom: 8 }}>Annual Action Plan</h3>
        <p style={{ fontSize: 13, color: 'rgba(15,30,60,0.6)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Your top 5 personalised opportunities — ranked by dollar impact — in a downloadable PDF report. Subscriber only.
        </p>
        <a href="/pricing" style={{ display: 'inline-block', background: '#00D4AA', color: '#0F1E3C', padding: '11px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          Upgrade to unlock →
        </a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>

      {/* Header with download */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', marginBottom: 4 }}>
            Generated for {sp?.fund_name} · {new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual savings identified</span>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#00D4AA' }}>{fmt(totalImpact)}</div>
            </div>
            {totalRetirement > 0 && (
              <div>
                <span style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retirement balance uplift</span>
                <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{fmtShort(totalRetirement)}</div>
              </div>
            )}
          </div>
        </div>
        <button onClick={handleDownload} disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0F1E3C', color: '#00D4AA', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.7 : 1 }}>
          {generating ? '⏳ Generating…' : '⬇ Download PDF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Opportunities list */}
        <div>
          {displayed.map((opp, i) => (
            <OpportunityCard key={opp.id} opp={opp} rank={i + 1} />
          ))}
          {allOpps.length > 5 && (
            <button onClick={() => setShowAll(!showAll)}
              style={{ width: '100%', padding: '10px', background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.1)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#0F1E3C', cursor: 'pointer' }}>
              {showAll ? 'Show fewer' : `Show all ${allOpps.length} opportunities`}
            </button>
          )}
        </div>

        {/* Right: Profile summary + inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Locked profile data */}
          <div style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid rgba(15,30,60,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your profile</div>
              <div style={{ fontSize: 10, background: 'rgba(15,30,60,0.08)', color: 'rgba(15,30,60,0.5)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>🔒 Locked</div>
            </div>
            {[
              { label: 'Fund', value: sp?.fund_name },
              { label: 'Option', value: sp?.fund_option },
              { label: 'Balance', value: fmt(sp?.current_balance ?? 0) },
              { label: 'Salary', value: fmt(sp?.salary ?? 0) },
              { label: 'Age', value: `${sp?.age} years old` },
              { label: 'Fee', value: `${sp?.fund_fee_pct}% p.a.` },
              { label: 'SG rate', value: `${sp?.employer_sg_rate}%` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(15,30,60,0.04)' }}>
                <span style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: '#0F1E3C' }}>{r.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(15,30,60,0.4)', lineHeight: 1.5 }}>
              Profile data is locked to your account. Contact support to update.
            </div>
          </div>

          {/* Editable extras */}
          <div style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid rgba(15,30,60,0.1)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Refine your plan</div>
            {[
              { label: 'Spouse annual income', value: spouseIncome, set: setSpouseIncome, note: 'For spouse offset calculation' },
              { label: 'Spouse super balance', value: spouseTSB, set: setSpouseTSB, note: 'For contribution splitting' },
              { label: 'Current monthly sacrifice', value: monthlySS, set: setMonthlySS, note: 'If you already sacrifice' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,30,60,0.6)', marginBottom: 4 }}>{f.label}</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 12 }}>$</span>
                  <input type="number" value={f.value || ''} onChange={e => f.set(+e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 22px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 3 }}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden PDF render target */}
      <div ref={pdfRef} style={{ position: 'fixed', left: -9999, top: 0, width: 900, background: 'white', padding: 40 }}
        aria-hidden="true">
        <PdfContent sp={sp} opportunities={allOpps.slice(0, 5)} totalImpact={totalImpact} totalRetirement={totalRetirement} />
      </div>

      <div style={{ marginTop: 20, background: 'rgba(15,30,60,0.04)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Calculations are estimates based on your profile data and current ATO rules. Impact figures use a 7% constant annual return assumption. Actual results will vary. This is not financial advice.
      </div>
    </div>
  )
}

function PdfContent({ sp, opportunities, totalImpact, totalRetirement }: {
  sp: any; opportunities: Opportunity[]; totalImpact: number; totalRetirement: number
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#0F1E3C' }}>
      {/* PDF Cover */}
      <div style={{ background: '#0F1E3C', padding: '40px', marginBottom: 30, borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          SmartSuper AU
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 6 }}>Annual Action Plan</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
          {sp?.fund_name} · {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Annual savings identified</div>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#00D4AA' }}>{fmt(totalImpact)}</div>
          </div>
          {totalRetirement > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Retirement balance uplift</div>
              <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{fmtShort(totalRetirement)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Profile summary */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: 8, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Your profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Fund', value: sp?.fund_name },
            { label: 'Option', value: sp?.fund_option },
            { label: 'Balance', value: fmt(sp?.current_balance ?? 0) },
            { label: 'Annual salary', value: fmt(sp?.salary ?? 0) },
            { label: 'Age', value: `${sp?.age} years old` },
            { label: 'Annual fees', value: fmt((sp?.current_balance ?? 0) * (sp?.fund_fee_pct ?? 0) / 100) },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.5)', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#0F1E3C' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F1E3C', marginBottom: 16 }}>Your Top {opportunities.length} Opportunities</div>
      {opportunities.map((opp, i) => (
        <div key={opp.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0F1E3C', color: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1E3C', marginBottom: 2 }}>{opp.icon} {opp.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.6)' }}>{opp.subtitle}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#00D4AA' }}>
                {opp.impactType === 'retirement' ? fmtShort(opp.impact) : fmt(opp.impact)}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.5)' }}>{opp.impactLabel.replace(/^\$[\d,.]+[kM]?\s*/, '')}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6, paddingLeft: 40 }}>{opp.explanation}</div>
        </div>
      ))}

      <div style={{ marginTop: 24, fontSize: 10, color: 'rgba(15,30,60,0.4)', lineHeight: 1.6, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        General information only. Not financial advice. Calculations use a 7% p.a. constant return assumption and are illustrative only. Generated by SmartSuper AU (smartsuperau.com) on {new Date().toLocaleDateString('en-AU')}.
      </div>
    </div>
  )
}
