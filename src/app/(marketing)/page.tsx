import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartSuper AU — Know your super. Grow your super.',
  description: "Australia's independent super optimisation platform. Free health score, fee analyser, Division 296 modeller, and personalised action plan — no fund bias, no commissions.",
}

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: '#F5F4F0', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(15,30,60,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#00A888', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2 }}>AU · SUPER</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.03em' }}>SmartSuper AU</div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/pricing" style={{ fontSize: 13, color: 'rgba(15,30,60,0.55)', textDecoration: 'none', padding: '8px 14px', fontWeight: 500 }}>Pricing</Link>
          <Link href="/contact" style={{ fontSize: 13, color: 'rgba(15,30,60,0.55)', textDecoration: 'none', padding: '8px 14px', fontWeight: 500 }}>Contact</Link>
          <Link href="/login" style={{ fontSize: 13, color: '#0F1E3C', textDecoration: 'none', padding: '9px 18px', borderRadius: 9, fontWeight: 600, border: '1.5px solid rgba(15,30,60,0.2)', background: 'white', marginLeft: 8 }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 13, color: '#0F1E3C', textDecoration: 'none', padding: '10px 20px', borderRadius: 9, fontWeight: 800, background: '#00D4AA', marginLeft: 4 }}>Start free →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 20, padding: '5px 12px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Independent · No fund bias</span>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 900, color: '#0F1E3C', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 22 }}>
              Your super is<br />
              <span style={{ color: '#00A888' }}>working harder</span><br />
              than you think.<br />
              <span style={{ fontWeight: 400, color: 'rgba(15,30,60,0.35)', fontSize: 42 }}>Is it hard enough?</span>
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(15,30,60,0.6)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              SmartSuper AU gives you the same analysis a good financial adviser would run on your super — free, in under 5 minutes, with no fund bias or commissions.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: '#0F1E3C', color: '#00D4AA', fontWeight: 800, fontSize: 16, borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.02em' }}>
                Get my free super score →
              </Link>
              <Link href="/pricing" style={{ fontSize: 14, color: 'rgba(15,30,60,0.5)', textDecoration: 'none', fontWeight: 500 }}>
                See all tools ↓
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
              {['Free health score', 'No credit card', '2 minutes to set up'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(15,30,60,0.45)', fontWeight: 500 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="6" stroke="#00D4AA" strokeWidth="1.2"/>
                    <path d="M4 6.5l2 2 3-3" stroke="#00D4AA" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Score preview card */}
          <div style={{ background: 'white', borderRadius: 24, padding: '28px', boxShadow: '0 20px 60px rgba(15,30,60,0.1)', border: '1px solid rgba(15,30,60,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 18 }}>Super health score · Example (50yr old, $185k balance)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg viewBox="0 0 80 80" style={{ width: 72, height: 72 }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(15,30,60,0.08)" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#00D4AA" strokeWidth="8" strokeDasharray="201" strokeDashoffset="60" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#0F1E3C', lineHeight: 1 }}>71</span>
                  <span style={{ fontSize: 9, color: 'rgba(15,30,60,0.4)' }}>/100</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1E3C', marginBottom: 3 }}>Good — room to improve</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.5)', lineHeight: 1.5 }}>3 opportunities found<br />Est. <strong style={{ color: '#00A888' }}>$67,000</strong> extra at retirement</div>
              </div>
            </div>
            {[
              { label: 'Fee efficiency', score: 8, max: 25, color: '#EF4444', note: '0.78% — high for this category' },
              { label: 'Investment alignment', score: 20, max: 25, color: '#F59E0B', note: 'Balanced with 20 years to retire' },
              { label: 'Contribution strategy', score: 14, max: 20, color: '#F59E0B', note: 'No salary sacrifice in place' },
              { label: 'Fund quality', score: 14, max: 15, color: '#00D4AA', note: 'APRA passed ✓' },
              { label: 'Account structure', score: 15, max: 15, color: '#00D4AA', note: 'Single account ✓' },
            ].map(d => (
              <div key={d.label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#0F1E3C', fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: d.color, fontWeight: 700 }}>{d.score}/{d.max}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(15,30,60,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(d.score / d.max) * 100}%`, height: '100%', background: d.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginTop: 2 }}>{d.note}</div>
              </div>
            ))}
            <div style={{ marginTop: 18, padding: '10px 12px', background: '#FEF2F2', borderRadius: 9, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12 }}>💡</span>
              <div style={{ fontSize: 11, color: '#7F1D1D', lineHeight: 1.5 }}>
                Switching to an indexed option saves <strong>$980/yr</strong> in fees — worth <strong>$67,000</strong> over 20 years.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ background: '#0F1E3C', padding: '44px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { value: '$4.5T', label: 'Super assets in Australia', sub: 'Most members never check their fees' },
            { value: '61%', label: 'Uncertain about retirement', sub: 'Even with $200k+ in super' },
            { value: '$4,668', label: 'Median advice fee 2025', sub: 'SmartSuper AU from $60/quarter' },
            { value: '0.57%', label: 'Average MySuper default fee', sub: 'Indexed alternatives start at 0.04%' },
          ].map((s, i) => (
            <div key={s.value} style={{ textAlign: 'center', padding: '8px 16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 30, fontWeight: 700, color: '#00D4AA', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE HOOK */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00A888', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 16 }}>The problem</div>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 20 }}>
          The average MySuper default charges 0.57%.<br />
          The cheapest equivalent charges 0.04%.<br />
          <span style={{ color: 'rgba(15,30,60,0.3)', fontWeight: 400, fontSize: 28 }}>Most members never notice the difference.</span>
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(15,30,60,0.6)', lineHeight: 1.75 }}>
          On the average 50-year-old's balance of $185,000, that 0.53% gap costs <strong style={{ color: '#0F1E3C' }}>$980 every year</strong> — silently. Over 20 years it compounds to <strong style={{ color: '#EF4444' }}>$67,000 less at retirement</strong>. Financial advisers know this. Now you do too.<br /><br /><span style={{ fontSize: 13, color: 'rgba(15,30,60,0.4)' }}>Source: Median ATO super balance age 50–54. Fees: AustralianSuper Balanced MySuper default (0.57%) vs Hostplus Indexed Shares (0.04%) — verified from fund PDSs, June 2026. Projection assumes 7% p.a. gross return.</span>
        </p>
      </section>

      {/* TOOLS GRID */}
      <section style={{ background: 'white', padding: '72px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00A888', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>12 tools · 3 free</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.03em', marginBottom: 10 }}>Everything your super needs. In one place.</h2>
            <p style={{ fontSize: 15, color: 'rgba(15,30,60,0.5)', maxWidth: 440, margin: '0 auto' }}>Start free. Upgrade when you're ready to go deeper.</p>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Free tools</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32 }}>
            {[
              { icon: '⬡', title: 'Super health score', desc: 'A 0–100 score across 5 dimensions: fees, investment option, contributions, fund quality, and structure — with specific actions ranked by impact.' },
              { icon: '↑', title: 'Contribution optimiser', desc: 'Your concessional cap headroom, carry-forward tracker, salary sacrifice tax saving estimate, and NCC bring-forward eligibility.' },
              { icon: '$', title: 'Fee drag analyser', desc: "Turn your fund's 0.78% fee into a dollar number. Compare against the cheapest equivalent. See the compounded gap over 20 years." },
            ].map(t => (
              <div key={t.title} style={{ background: '#F5F4F0', borderRadius: 16, padding: '22px', border: '1px solid rgba(15,30,60,0.06)', position: 'relative' as const }}>
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 700, color: '#065F46', background: 'rgba(0,212,170,0.15)', padding: '2px 7px', borderRadius: 20 }}>FREE</div>
                <div style={{ fontSize: 20, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F1E3C', marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(15,30,60,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Subscriber tools — from $60/quarter</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { icon: '⚡', title: 'Annual super action plan', desc: 'Up to 12 personalised opportunities ranked by dollar impact — with urgency, numbered action steps, and a downloadable PDF.', hot: true },
              { icon: '🎯', title: 'Retirement report', desc: 'Score your retirement income readiness. See your ASFA gap, projected balance at retirement, and what it takes to close the shortfall.', hot: false },
              { icon: '🔮', title: 'Advanced modelling', desc: 'Compare every retirement age from 50–70. Test indexed vs active. See the exact impact of adding $200/month. All scenarios at once.', hot: false },
              { icon: '🧠', title: 'Fund intelligence', desc: 'Every comparable fund ranked by total cost at your balance. PDS-verified fees. 1yr, 3yr, 5yr returns. Filtered by investment category.', hot: false },
              { icon: '⇄', title: 'Salary sacrifice optimiser', desc: 'Live payslip comparison, cap usage tracker, 20-year compounding projection. Shows exact monthly take-home impact before you commit.', hot: false },
              { icon: '⚠', title: 'Division 296 exposure', desc: 'Year-by-year projection to the $3M threshold. Estimated annual extra tax. Mitigation strategies with links to spouse and contribution tools.', hot: false },
              { icon: '◑', title: 'Spouse contribution analysis', desc: 'Three strategies: $540 spouse tax offset, contribution splitting to equalise balances, and downsizer contributions for 55+ couples.', hot: false },
              { icon: '◈', title: 'SMSF ETF portfolio', desc: 'Search 70+ ASX ETFs, detect overlaps, see weighted portfolio MER, track TBAR deadlines, calculate minimum pension drawdown.', hot: false },
              { icon: '📈', title: 'Model ETF portfolios', desc: '17 pre-built portfolios for Hostplus Choiceplus, AustralianSuper Member Direct, and SMSF — with custom builder and overlap detection.', hot: false },
            ].map(t => (
              <div key={t.title} style={{ background: t.hot ? '#0F1E3C' : '#F5F4F0', borderRadius: 16, padding: '22px', border: 'none', position: 'relative' as const }}>
                {t.hot && <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 700, color: '#0F1E3C', background: '#00D4AA', padding: '2px 7px', borderRadius: 20 }}>POPULAR</div>}
                <div style={{ fontSize: 20, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.hot ? 'white' : '#0F1E3C', marginBottom: 6 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: t.hot ? 'rgba(255,255,255,0.5)' : 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '72px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0F1E3C', letterSpacing: '-0.03em' }}>Up and running in 2 minutes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' as const }}>
          <div style={{ position: 'absolute', top: 27, left: '18%', right: '18%', height: 1, background: 'repeating-linear-gradient(90deg, #00D4AA 0, #00D4AA 8px, transparent 8px, transparent 16px)' }} />
          {[
            { step: '01', title: 'Create your free account', desc: 'No credit card. Email and password. 30 seconds.' },
            { step: '02', title: 'Enter your super details', desc: 'Fund name, balance, salary, and option. We look up your fee.' },
            { step: '03', title: 'See your score', desc: 'Health score, fee analysis, and top opportunities — personalised.' },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center', padding: '0 28px', position: 'relative' as const, zIndex: 1 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#0F1E3C', color: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, margin: '0 auto 18px', border: '3px solid #F5F4F0' }}>
                {s.step}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1E3C', marginBottom: 7 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#0F1E3C', padding: '72px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>Common questions</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {[
              { q: 'Is this financial advice?', a: "No. SmartSuper AU provides general information and modelling — the same data a financial adviser would reference, without the personalised recommendation. You make your own decisions." },
              { q: 'Do you access my super account?', a: "No. You enter your details manually. We don't connect to your fund, MyGov, or any third-party data source. Your data is stored privately to your account only." },
              { q: 'How accurate are the fee comparisons?', a: "Fund fees are verified directly from each fund's current PDS — updated June 2026. We link to the source document so you can verify. We update fees annually." },
              { q: 'Why charge at all — why not free?', a: "Free tools are funded by fund referrals and advertising, which creates bias. We charge a small subscription so we have no incentive to favour any fund. Independence is the product." },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '26px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 9 }}>{faq.q}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '72px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(15,30,60,0.09)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(15,30,60,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Free plan</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#0F1E3C', letterSpacing: '-0.04em', marginBottom: 3 }}>$0</div>
            <div style={{ fontSize: 13, color: 'rgba(15,30,60,0.4)', marginBottom: 24 }}>No credit card. No expiry.</div>
            {['Super health score', 'Fee drag analyser', 'Contribution overview'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 13, color: '#0F1E3C' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#00D4AA" strokeWidth="1.2"/><path d="M4.5 7l2 2 3-3" stroke="#00D4AA" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {f}
              </div>
            ))}
            <Link href="/signup" style={{ display: 'block', marginTop: 22, textAlign: 'center', padding: '12px', background: '#F5F4F0', color: '#0F1E3C', fontWeight: 700, fontSize: 13, borderRadius: 10, textDecoration: 'none', border: '1.5px solid rgba(15,30,60,0.1)' }}>
              Get started free →
            </Link>
          </div>
          <div style={{ background: '#0F1E3C', borderRadius: 20, padding: '32px', position: 'relative' as const, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 18, right: 18, fontSize: 9, fontWeight: 800, color: '#0F1E3C', background: '#00D4AA', padding: '3px 9px', borderRadius: 20 }}>BEST VALUE</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Subscriber</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-0.04em' }}>$60</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/quarter</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Or $200/year. Less than 1 week of advice fees.</div>
            {['Everything in Free', 'Annual super action plan', 'Retirement report', 'Advanced modelling', 'Fund intelligence', 'Salary sacrifice optimiser', 'Division 296, Spouse, SMSF + more'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 13, color: f === 'Everything in Free' ? 'rgba(255,255,255,0.4)' : 'white' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#00D4AA" strokeWidth="1.2"/><path d="M4.5 7l2 2 3-3" stroke="#00D4AA" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {f}
              </div>
            ))}
            <Link href="/signup" style={{ display: 'block', marginTop: 22, textAlign: 'center', padding: '12px', background: '#00D4AA', color: '#0F1E3C', fontWeight: 800, fontSize: 13, borderRadius: 10, textDecoration: 'none' }}>
              Start free, upgrade anytime →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#00D4AA', padding: '72px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 38, fontWeight: 900, color: '#0F1E3C', letterSpacing: '-0.04em', marginBottom: 14, lineHeight: 1.1 }}>
          Your super health score.<br />2 minutes. Free.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(15,30,60,0.6)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          No credit card. No fund affiliation. No commissions. Just your numbers, clearly explained.
        </p>
        <Link href="/signup" style={{ display: 'inline-block', padding: '17px 44px', background: '#0F1E3C', color: '#00D4AA', fontWeight: 900, fontSize: 17, borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Get my free super score →
        </Link>
        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(15,30,60,0.5)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#0F1E3C', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0F1E3C', padding: '48px 40px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#00D4AA', letterSpacing: '0.18em', textTransform: 'uppercase' as const, marginBottom: 4 }}>AU · SUPER</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 4, letterSpacing: '-0.02em' }}>SmartSuper AU</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Brisbane, Australia · smartsuperau.com</div>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { label: 'Product', links: [{ t: 'Pricing', h: '/pricing' }, { t: 'Sign up', h: '/signup' }, { t: 'Sign in', h: '/login' }] },
                { label: 'Support', links: [{ t: 'Contact', h: '/contact' }, { t: 'Privacy policy', h: '/privacy' }, { t: 'Terms', h: '/terms' }] },
              ].map(col => (
                <div key={col.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{col.label}</div>
                  {col.links.map(l => (
                    <div key={l.t} style={{ marginBottom: 7 }}>
                      <Link href={l.h} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{l.t}</Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 22, fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
            SmartSuper AU provides general financial information and modelling only — not financial product advice. It does not take into account your personal financial objectives, situation, or needs. Before acting on any information, consider whether it is appropriate for your circumstances. SmartSuper AU is not an Australian Financial Services licensee. Fund fee data sourced from fund PDSs at June 2026.
          </div>
        </div>
      </footer>
    </div>
  )
}
