'use client'
import { useState, useMemo } from 'react'
import { calcSpouseOffset, fmt } from '@/lib/calculations'

// ─── STRATEGY EXPLAINER CARDS ────────────────────────────────────────────────
const STRATEGIES = [
  {
    id: 'offset',
    icon: '💸',
    title: 'Spouse contribution tax offset',
    who: 'You contribute from your after-tax income into your spouse\'s super',
    benefit: 'You get up to $540 cash back on your tax return',
    rules: 'Spouse must earn under $40,000/yr. Max offset is on a $3,000 contribution.',
    best_for: 'Best when one partner earns significantly less (stay-at-home, part-time, on parental leave)',
  },
  {
    id: 'splitting',
    icon: '⚖️',
    title: 'Contribution splitting',
    who: 'You redirect up to 85% of your concessional contributions (salary sacrifice + employer SG) to your spouse\'s super account',
    benefit: 'Gradually equalises balances — protects against Division 296 tax when balances near $3M and improves Age Pension eligibility',
    rules: 'Must apply to your fund by 30 June each year. Split goes to spouse\'s accumulation account.',
    best_for: 'Best when one partner has a much larger super balance, or when one partner is closer to the $3M threshold',
  },
  {
    id: 'downsizer',
    icon: '🏠',
    title: 'Downsizer contributions',
    who: 'Both partners contribute up to $300,000 each from a home sale ($600,000 combined)',
    benefit: 'Bypasses contribution caps — huge one-time injection into super for both partners',
    rules: 'Must be 55+. Home owned 10+ years. Must lodge notice within 90 days of settlement.',
    best_for: 'Couples over 55 selling the family home who want to boost super',
  },
]

export function SpouseClient({ superProfile: sp }: { superProfile: any }) {
  const [yourTSB,      setYourTSB]      = useState(sp?.current_balance ?? 0)
  const [yourSalary,   setYourSalary]   = useState(sp?.salary ?? 0)
  const [yourAge,      setYourAge]      = useState(sp?.age ?? 45)
  const [spouseTSB,    setSpouseTSB]    = useState(0)
  const [spouseIncome, setSpouseIncome] = useState(0)
  const [spouseAge,    setSpouseAge]    = useState(42)
  const [contribution, setContribution] = useState(3000)
  const [ssAmount,     setSsAmount]     = useState(sp ? (sp.salary ?? 0) * 0.12 : 0)

  const offsetResult = useMemo(
    () => calcSpouseOffset(spouseIncome, contribution, spouseTSB),
    [spouseIncome, contribution, spouseTSB]
  )

  const combinedTSB = yourTSB + spouseTSB
  const gap = Math.abs(yourTSB - spouseTSB)
  const higherBalance = Math.max(yourTSB, spouseTSB)
  const lowerBalance  = Math.min(yourTSB, spouseTSB)
  const higherIsYou   = yourTSB >= spouseTSB

  // Concessional contributions = SG + salary sacrifice
  const yourSG = yourSalary * 0.12
  const totalConcessional = yourSG + ssAmount
  const maxSplit = Math.min(totalConcessional * 0.85, 25500)  // 85% of concessional, capped at $25,500

  // Division 296 risk
  const div296Risk = higherBalance >= 2_500_000 ? 'high' : higherBalance >= 2_000_000 ? 'medium' : higherBalance >= 1_500_000 ? 'watch' : 'low'

  // Years to retirement (estimate)
  const yourYrsToRetire  = Math.max(0, 67 - yourAge)
  const spouseYrsToRetire = Math.max(0, 67 - spouseAge)

  // Project balances without splitting (7% growth)
  function project(balance: number, contribPerYear: number, years: number) {
    let b = balance
    for (let i = 0; i < years; i++) b = (b + contribPerYear) * 1.07
    return b
  }

  const yourProjected   = project(yourTSB, yourSG + ssAmount, yourYrsToRetire)
  const spouseProjected = project(spouseTSB, spouseIncome * 0.12, spouseYrsToRetire)
  const projGap         = Math.abs(yourProjected - spouseProjected)

  // Project WITH splitting — redirect maxSplit to spouse each year
  const yourProjectedSplit   = project(yourTSB, yourSG + ssAmount - maxSplit, yourYrsToRetire)
  const spouseProjectedSplit = project(spouseTSB, spouseIncome * 0.12 + maxSplit, Math.min(yourYrsToRetire, spouseYrsToRetire))
  const splitSavingAtRetirement = Math.abs(yourProjectedSplit - spouseProjectedSplit)

  const c: React.CSSProperties  = { background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid rgba(15,30,60,0.1)' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(15,30,60,0.5)', marginBottom: 5 }
  const inp: React.CSSProperties = { width: '100%', paddingLeft: 26, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid rgba(15,30,60,0.12)', borderRadius: 9, fontFamily: 'monospace', fontSize: 13, color: '#0F1E3C', outline: 'none', boxSizing: 'border-box' }

  function PI({ val, setVal }: { val: number; setVal: (v: number) => void }) {
    return (
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,30,60,0.4)', fontSize: 12 }}>$</span>
        <input type="number" value={val || ''} onChange={e => setVal(+e.target.value)} style={inp} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000 }}>

      {/* ── WHY THIS PAGE EXISTS ──────────────────────────────────────── */}
      <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '22px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Why couples need a super strategy
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 10, lineHeight: 1.4 }}>
          Two super accounts, optimised together, can be worth significantly more than two accounts managed in isolation.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            { icon: '💸', point: 'Tax offsets', desc: 'Contributing to a lower-earning spouse\'s super earns you up to $540 cash back on your tax return.' },
            { icon: '⚖️', point: 'Balance equalisation', desc: 'Splitting contributions reduces the gap between balances — protecting the higher earner from Division 296 tax.' },
            { icon: '🏦', point: 'Age Pension strategy', desc: 'Equalised balances may improve combined Age Pension entitlements when the older partner reaches pension age.' },
          ].map(item => (
            <div key={item.point} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 3 }}>{item.point}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ENTER DETAILS ────────────────────────────────────────────── */}
      <div style={c} >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 18 }}>Enter both partners' details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* You */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#534AB7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #534AB7' }}>You</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Super balance (TSB)</label>
                <PI val={yourTSB} setVal={setYourTSB} />
              </div>
              <div>
                <label style={lbl}>Age</label>
                <input type="number" value={yourAge} onChange={e => setYourAge(+e.target.value)}
                  style={{ ...inp, paddingLeft: 12 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Annual salary</label>
                <PI val={yourSalary} setVal={setYourSalary} />
              </div>
              <div>
                <label style={lbl}>Salary sacrifice /yr</label>
                <PI val={ssAmount} setVal={setSsAmount} />
              </div>
            </div>
          </div>
          {/* Spouse */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #00D4AA' }}>Spouse / partner</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Super balance (TSB)</label>
                <PI val={spouseTSB} setVal={setSpouseTSB} />
              </div>
              <div>
                <label style={lbl}>Age</label>
                <input type="number" value={spouseAge} onChange={e => setSpouseAge(+e.target.value)}
                  style={{ ...inp, paddingLeft: 12 }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Spouse annual income</label>
              <PI val={spouseIncome} setVal={setSpouseIncome} />
              <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>
                Used to check spouse tax offset eligibility (must be under $40,000)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMBINED PICTURE ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, margin: '16px 0' }}>
        {[
          { label: 'Your balance', value: fmt(yourTSB), colour: '#534AB7', sub: `${yourAge} yrs old` },
          { label: 'Spouse balance', value: fmt(spouseTSB), colour: '#00D4AA', sub: `${spouseAge} yrs old` },
          { label: 'Combined super', value: fmt(combinedTSB), colour: '#0F1E3C', sub: div296Risk !== 'low' ? `⚠ Div 296 watch` : 'Well below $3M threshold' },
          { label: 'Balance gap', value: fmt(gap), colour: gap > 100000 ? '#D97706' : '#10B981', sub: gap > 100000 ? 'Consider equalising' : 'Reasonably balanced' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(15,30,60,0.1)' }}>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: s.colour, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.5)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── STRATEGY 1: SPOUSE OFFSET ────────────────────────────────── */}
      <div style={{ ...c, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💸</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 3 }}>Strategy 1 — Spouse contribution tax offset</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>
              You contribute from your <strong>after-tax income</strong> into your spouse's super fund. The government gives you up to <strong>$540 back as a tax offset</strong> on your personal tax return. This is not a deduction — it's a direct credit that reduces your tax bill dollar-for-dollar.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={lbl}>Amount you contribute to spouse's super (from after-tax income)</label>
            <PI val={contribution} setVal={setContribution} />
            <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', marginTop: 4 }}>
              The maximum eligible for the offset is $3,000. Anything above $3,000 earns no extra offset.
            </div>
          </div>
          <div style={{ background: offsetResult.eligible ? 'rgba(0,212,170,0.06)' : '#FFFBEB', borderRadius: 12, padding: '16px 18px', border: `1px solid ${offsetResult.eligible ? 'rgba(0,212,170,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
            {offsetResult.eligible ? (
              <>
                <div style={{ fontSize: 12, color: '#065F46', fontWeight: 600, marginBottom: 6 }}>✓ You qualify for the spouse offset</div>
                <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: '#00D4AA', marginBottom: 4 }}>{fmt(offsetResult.offset)}</div>
                <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.6 }}>
                  Direct credit on your tax return for contributing {fmt(Math.min(contribution, 3000))} to your spouse's super.
                  {contribution < 3000 && <span> Contribute {fmt(3000 - contribution)} more to reach the full $540 offset.</span>}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, marginBottom: 6 }}>⚠ Not eligible for the offset</div>
                <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.7 }}>
                  {offsetResult.reason}. The offset phases out between $37,000–$40,000 spouse income and disappears entirely above $40,000.
                </div>
                {spouseIncome > 37000 && spouseIncome < 40000 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#78350F', fontWeight: 500 }}>
                    Partial offset available: {fmt(calcSpouseOffset(spouseIncome, 3000, spouseTSB).offset)} — reduces as spouse income approaches $40k.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── STRATEGY 2: CONTRIBUTION SPLITTING ───────────────────────── */}
      <div style={{ ...c, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(83,74,183,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚖️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 3 }}>Strategy 2 — Contribution splitting to equalise balances</div>
            <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6 }}>
              You ask your super fund to redirect up to <strong>85% of your concessional contributions</strong> (employer SG + salary sacrifice) into your spouse's super each year. The money counts as it was contributed to your fund first — so your concessional caps and tax concessions aren't affected. It simply transfers across at year end.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Your concessional contributions this year', value: fmt(totalConcessional), note: `SG ${fmt(yourSG)} + salary sacrifice ${fmt(ssAmount)}` },
              { label: 'Maximum you can split to spouse (85%)', value: fmt(maxSplit), note: 'Applied by requesting a split from your fund before 30 June' },
              { label: 'Current balance gap', value: fmt(gap), note: higherIsYou ? 'Your balance is higher — you split to spouse' : 'Spouse balance is higher — spouse would split to you' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(15,30,60,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#534AB7', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0F1E3C', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.45)' }}>{s.note}</div>
              </div>
            ))}
          </div>

          {/* Projection */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Balance projection at retirement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Without splitting', yourBal: yourProjected, spouseBal: spouseProjected, gap: projGap, colour: '#EF4444' },
                { label: 'With splitting (max)', yourBal: yourProjectedSplit, spouseBal: spouseProjectedSplit, gap: splitSavingAtRetirement, colour: '#00D4AA' },
              ].map(row => (
                <div key={row.label} style={{ background: row.colour === '#00D4AA' ? 'rgba(0,212,170,0.06)' : 'rgba(15,30,60,0.03)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${row.colour === '#00D4AA' ? 'rgba(0,212,170,0.2)' : 'rgba(15,30,60,0.08)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,30,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{row.label}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginBottom: 2 }}>You</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#534AB7' }}>{fmt(row.yourBal)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginBottom: 2 }}>Spouse</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#00D4AA' }}>{fmt(row.spouseBal)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(15,30,60,0.4)', marginBottom: 2 }}>Gap</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: row.colour }}>{fmt(row.gap)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Division 296 warning if relevant */}
            {higherBalance > 1_500_000 && (
              <div style={{ background: higherBalance > 2_500_000 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${higherBalance > 2_500_000 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.7, color: higherBalance > 2_500_000 ? '#7F1D1D' : '#78350F' }}>
                <strong>{higherBalance > 2_500_000 ? '⚠ Division 296 risk — take action' : '⏰ Watch: approaching Division 296 threshold'}</strong><br/>
                The higher balance ({fmt(higherBalance)}) is {higherBalance > 2_500_000 ? 'approaching or above' : 'within range of'} the $3M Division 296 threshold. Splitting contributions now reduces how quickly the larger balance grows. Each year of splitting now compounds to a much larger difference by retirement.
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#0F1E3C', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📋</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
            <strong style={{ color: 'white' }}>How to request a contribution split:</strong> Contact your super fund before 30 June and ask to split contributions from the <em>prior</em> financial year. Most funds have a form on their website. The split must be to your spouse's complying super fund or retirement savings account. You can do this every year — it's not a one-time election.
          </div>
        </div>
      </div>

      {/* ── STRATEGY 3: DOWNSIZER ────────────────────────────────────── */}
      {(yourAge >= 50 || spouseAge >= 50) && (
        <div style={{ ...c, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F1E3C', marginBottom: 3 }}>Strategy 3 — Downsizer contributions (age 55+)</div>
              <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
                If you sell a home you've owned for 10+ years, both partners can each contribute up to $300,000 into super from the proceeds ($600,000 combined). This is <strong>completely outside the normal contribution caps</strong> — the biggest single opportunity to boost super for couples near retirement.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Max per person', value: '$300,000', colour: '#F97316' },
                  { label: 'Max combined', value: '$600,000', colour: '#F97316' },
                  { label: 'Minimum age', value: '55 years', colour: '#F97316' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(249,115,22,0.06)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: s.colour, marginBottom: 3 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(15,30,60,0.6)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(15,30,60,0.55)', lineHeight: 1.7, background: 'rgba(15,30,60,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                Eligible if: (1) you or your spouse are 55+, (2) you've owned the home continuously for at least 10 years, (3) it was your main residence at some point. Must notify your fund within 90 days of settlement. Partner doesn't need to be 55 themselves — one eligible partner unlocks both contributions.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECOMMENDED ACTIONS ──────────────────────────────────────── */}
      <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1E3C', marginBottom: 12 }}>Based on your details — recommended actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {offsetResult.eligible && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0 }}>✓</span>
              <span>Contribute {fmt(Math.max(3000, contribution))} to your spouse's super this year to claim the <strong>{fmt(offsetResult.offset)} tax offset</strong> on your return.</span>
            </div>
          )}
          {gap > 50000 && maxSplit > 0 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0 }}>✓</span>
              <span>Request a contribution split of up to <strong>{fmt(maxSplit)}</strong> from your super fund before 30 June to start closing the {fmt(gap)} balance gap.</span>
            </div>
          )}
          {higherBalance >= 2_000_000 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>The higher balance is approaching the <strong>$3M Division 296 threshold</strong>. Maximising contribution splitting each year is important — consider financial advice for a more detailed strategy.</span>
            </div>
          )}
          {!offsetResult.eligible && gap <= 50000 && (
            <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'rgba(15,30,60,0.65)', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0 }}>ℹ</span>
              <span>Your situation looks well-balanced. No urgent action needed — revisit if either balance changes significantly or if you approach the $3M threshold.</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
            <span style={{ flexShrink: 0 }}>✓</span>
            <span>For a full personalised analysis of your spouse's super (fund comparison, health score, fee analysis), <a href="/signup" style={{ color: '#534AB7', fontWeight: 600 }}>create them a separate account</a> — it's free.</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(15,30,60,0.04)', border: '1px solid rgba(15,30,60,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 11, color: 'rgba(15,30,60,0.5)', lineHeight: 1.6 }}>
        <strong style={{ color: 'rgba(15,30,60,0.65)' }}>General information only.</strong> Spouse contribution offset eligibility is based on spouse income and TSB at 30 June of the prior year. Contribution splitting rules per ATO Superannuation guidelines at June 2026. Projections use a 7% flat annual return assumption and are illustrative only — actual returns will vary. Balance projections do not account for tax, fees, insurance, or future legislation changes. Before implementing any strategy, consider your specific circumstances and seek advice from a licensed financial adviser.
      </div>
    </div>
  )
}
