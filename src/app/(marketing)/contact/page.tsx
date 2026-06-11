'use client'
import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'general',      label: 'General enquiry' },
  { value: 'account',      label: 'Account or billing' },
  { value: 'accuracy',     label: 'Data accuracy / fee correction' },
  { value: 'unlock',       label: 'Profile unlock request' },
  { value: 'feedback',     label: 'Feature feedback' },
  { value: 'advice',       label: 'Question about my super' },
  { value: 'partnership',  label: 'Partnership or media' },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', subject: '', message: '', category: 'general',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid rgba(15,30,60,0.15)',
    borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    color: '#0F1E3C', background: 'white', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(15,30,60,0.6)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid rgba(15,30,60,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#00D4AA', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 1 }}>AU · SUPER</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#0F1E3C', lineHeight: 1 }}>SmartSuper AU</div>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontSize: 14, color: 'rgba(15,30,60,0.6)', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/login" style={{ fontSize: 14, color: 'rgba(15,30,60,0.6)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ fontSize: 14, background: '#0F1E3C', color: 'white', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 500 }}>Get started free</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#00D4AA', marginBottom: 12 }}>Contact</div>
          <h1 style={{ fontSize: 36, fontWeight: 600, color: '#0F1E3C', marginBottom: 12, letterSpacing: '-0.02em' }}>Get in touch</h1>
          <p style={{ fontSize: 16, color: 'rgba(15,30,60,0.55)', maxWidth: 480, margin: '0 auto' }}>
            Questions about your super, account issues, or feedback on the platform — we read and respond to every message.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

          {/* ── FORM ─────────────────────────────────────────────────────── */}
          {status === 'sent' ? (
            <div style={{ background: 'white', borderRadius: 20, padding: '56px 48px', border: '1px solid rgba(15,30,60,0.1)', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0F1E3C', marginBottom: 10 }}>Message sent!</h2>
              <p style={{ fontSize: 14, color: 'rgba(15,30,60,0.6)', lineHeight: 1.8, maxWidth: 380, margin: '0 auto 28px' }}>
                Thanks for getting in touch. We'll reply to <strong>{form.email}</strong> within 1–2 business days (AEST).
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '', category: 'general' }) }}
                  style={{ padding: '10px 20px', border: '1px solid rgba(15,30,60,0.15)', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'white', color: '#0F1E3C' }}>
                  Send another message
                </button>
                <Link href="/dashboard" style={{ padding: '10px 20px', background: '#0F1E3C', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#00D4AA', textDecoration: 'none' }}>
                  Go to dashboard →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 20, padding: '36px', border: '1px solid rgba(15,30,60,0.1)', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Category */}
              <div>
                <label style={label}>What's this about?</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inp, appearance: 'auto' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Name + Email row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={label}>Your name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Jane Smith" required style={inp} />
                </div>
                <div>
                  <label style={label}>Email address <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="jane@example.com" required style={inp} />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={label}>Subject</label>
                <input type="text" value={form.subject} onChange={e => set('subject', e.target.value)}
                  placeholder="e.g. Question about my carry-forward cap" style={inp} />
              </div>

              {/* Message */}
              <div>
                <label style={label}>Message <span style={{ color: '#EF4444' }}>*</span></label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Tell us what you need help with, or share your feedback..."
                  required rows={6}
                  style={{ ...inp, resize: 'vertical', minHeight: 140, lineHeight: 1.6 }} />
              </div>

              {/* Profile unlock helper */}
              {form.category === 'unlock' && (
                <div style={{ background: 'rgba(83,74,183,0.06)', border: '1px solid rgba(83,74,183,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                  💡 For a profile unlock, please include your registered email address and a brief description of what you need to correct. We'll process unlock requests within 24 hours.
                </div>
              )}

              {/* Accuracy helper */}
              {form.category === 'accuracy' && (
                <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'rgba(15,30,60,0.7)', lineHeight: 1.6 }}>
                  📋 For fee or return corrections, please include: fund name, investment option, the figure you believe is wrong, the correct figure, and the PDS or fund website URL where you found it.
                </div>
              )}

              {status === 'error' && (
                <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991B1B' }}>
                  ⚠ {errorMsg}
                </div>
              )}

              <button type="submit" disabled={status === 'sending'}
                style={{ background: '#0F1E3C', color: '#00D4AA', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: status === 'sending' ? 'not-allowed' : 'pointer', opacity: status === 'sending' ? 0.7 : 1, marginTop: 4 }}>
                {status === 'sending' ? 'Sending…' : 'Send message →'}
              </button>

              <p style={{ fontSize: 11, color: 'rgba(15,30,60,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
                We respond within 1–2 business days (AEST). Your message is stored securely and never shared.
              </p>
            </form>
          )}

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* About us card */}
            <div style={{ background: '#0F1E3C', borderRadius: 16, padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>About SmartSuper AU</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>📍</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Based in Brisbane, Australia</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>We're a local team building tools for Australian super members. Replies come from Australian business hours (AEST/AEDT).</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🛡</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>Independent — no fund bias</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>SmartSuper AU is not affiliated with or paid by any super fund. All comparisons are independently compiled from fund PDSs.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚖️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>General information only</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>We provide modelling tools and educational information — not financial advice. We can't tell you what to do with your super.</div>
                </div>
              </div>
            </div>

            {/* Response time */}
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid rgba(15,30,60,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>What to expect</div>
              {[
                { icon: '⚡', label: 'Profile unlocks', time: 'Within 24 hours' },
                { icon: '💬', label: 'General questions', time: '1–2 business days' },
                { icon: '📊', label: 'Data corrections', time: '2–5 business days' },
                { icon: '🤝', label: 'Partnership enquiries', time: '3–5 business days' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(15,30,60,0.05)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: 'rgba(15,30,60,0.7)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#00D4AA', fontWeight: 600 }}>{item.time}</span>
                </div>
              ))}
            </div>

            {/* Common links */}
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid rgba(15,30,60,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(15,30,60,0.4)', marginBottom: 14 }}>Quick links</div>
              {[
                { label: 'View pricing & plans', href: '/pricing' },
                { label: 'Create a free account', href: '/signup' },
                { label: 'Sign in to dashboard', href: '/login' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(15,30,60,0.05)', fontSize: 13, color: '#534AB7', textDecoration: 'none', fontWeight: 500 }}>
                  {item.label} <span style={{ opacity: 0.6 }}>→</span>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(15,30,60,0.08)', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(15,30,60,0.4)', lineHeight: 1.8 }}>
          SmartSuper AU · Brisbane, QLD, Australia · ABN pending<br />
          General information only. Not financial product advice. Always consider your personal circumstances.
        </div>
      </div>
    </div>
  )
}
