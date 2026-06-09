import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SuperSmart AU — Independent Super Optimisation',
  description: "Australia's only independent super optimisation platform. Free super health score, carry-forward tracker, Division 296 modeller, fee analyser and more.",
}

const FEATURES = [
  { icon: '⬡', title: 'Super health score', desc: 'Get a clear 0–100 score covering fund performance, fees, investment option, contributions, and consolidation.' },
  { icon: '↑', title: 'Contribution optimiser', desc: 'Carry-forward cap tracker, salary sacrifice headroom, spouse contributions, and bring-forward modelling.' },
  { icon: '$', title: 'Fee drag analyser', desc: "Turn your fund's 0.78% fee into a dollar number — and see exactly what switching to a lower-fee option could save." },
  { icon: '⚠', title: 'Division 296 modeller', desc: 'Project when your balance will cross $3M and estimate your annual tax exposure. Free, no login required.' },
  { icon: '⇄', title: 'Salary sacrifice', desc: 'Calculate your exact tax saving from sacrificing $X per month, with a lookup table for common amounts.' },
  { icon: '◈', title: 'SMSF analytics', desc: 'ETF overlap detection, TBAR deadline tracking, minimum pension calculations, and crypto compliance checks.' },
]

const STATS = [
  { value: '$4.5T', label: 'Total super assets in Australia' },
  { value: '61%', label: "Australians unsure they'll have enough" },
  { value: '15,500', label: 'Financial advisers left (down from 28k)' },
  { value: '$4,668', label: 'Median advice fee in 2025' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-white border-b border-black/8 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <div className="font-mono text-[10px] text-teal tracking-widest uppercase">AU · SUPER</div>
          <div className="text-base font-semibold text-navy leading-none">SuperSmart</div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-navy/60 hover:text-navy transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm text-navy/60 hover:text-navy transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-mid transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-8 text-center max-w-4xl mx-auto">
        <div className="inline-block font-mono text-xs text-teal bg-teal/10 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          Independent · No fund bias · Not financial advice
        </div>
        <h1 className="text-5xl font-semibold text-navy tracking-tight leading-tight mb-5">
          Your super is your largest asset.<br />
          <span className="text-teal">Are you getting the most from it?</span>
        </h1>
        <p className="text-xl text-navy/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          SuperSmart AU is Australia's only independent super optimisation platform. Free health score, carry-forward tracker, fee analyser, and Division 296 modeller — no fund bias, no commissions.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup" className="px-8 py-3.5 bg-teal text-navy font-semibold rounded-xl hover:bg-teal-dim transition-colors text-base">
            Get my free super score
          </Link>
          <Link href="/pricing" className="px-8 py-3.5 border border-black/10 text-navy font-medium rounded-xl hover:bg-white transition-colors text-base">
            See pricing
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-navy py-14 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-3xl font-medium text-teal mb-1">{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The problem */}
      <section className="py-20 px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-semibold text-navy mb-5 tracking-tight">The advice gap is real — and it's costing you</h2>
        <p className="text-lg text-navy/60 leading-relaxed mb-6 max-w-2xl mx-auto">
          Financial adviser numbers have halved since 2019. The median advice fee hit $4,668 in 2025. 
          Most Australians simply never get the help they need to optimise their super — the most 
          important long-term financial decision they make.
        </p>
        <p className="text-lg text-navy/60 leading-relaxed max-w-2xl mx-auto">
          SuperSmart AU doesn't give advice. It gives you the same <em>information and modelling</em> 
          that a good adviser would use — so you can make your own informed decisions.
        </p>
      </section>

      {/* Features */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-navy text-center mb-12 tracking-tight">Everything you need in one place</h2>
          <div className="grid grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 bg-surface rounded-2xl">
                <div className="w-10 h-10 bg-navy/5 rounded-xl flex items-center justify-center text-xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-navy mb-2">{f.title}</h3>
                <p className="text-sm text-navy/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-semibold text-navy mb-4 tracking-tight">Start with your free super score</h2>
          <p className="text-navy/60 mb-8">Takes 2 minutes. No credit card required.</p>
          <Link href="/signup" className="inline-block px-10 py-4 bg-teal text-navy font-semibold rounded-xl hover:bg-teal-dim transition-colors text-base">
            Get my free score →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-12 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="font-mono text-xs text-teal tracking-widest uppercase mb-1">AU · SUPER</div>
              <div className="text-white font-semibold">SuperSmart AU</div>
            </div>
            <div className="flex gap-8 text-sm text-white/40">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-white/30 leading-relaxed">
            SuperSmart AU provides general financial information and modelling only. It does not constitute financial product advice and does not take into account your personal financial objectives, situation or needs. Before acting on any information, you should consider whether it is appropriate for your circumstances and seek independent financial advice if needed. SuperSmart AU is not an Australian Financial Services licensee.
          </div>
        </div>
      </footer>
    </div>
  )
}
