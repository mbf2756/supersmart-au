'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-teal tracking-widest uppercase mb-1">AU · SUPER</div>
          <h1 className="text-2xl font-semibold text-navy">Reset your password</h1>
        </div>
        <div className="bg-white rounded-2xl border border-black/10 p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-3xl mb-3">✉️</div>
              <p className="text-navy/70">Check your email for a password reset link.</p>
              <Link href="/login" className="block mt-4 text-sm text-teal hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending…' : 'Send reset link'}</Button>
              <p className="text-center text-sm text-navy/50">
                <Link href="/login" className="hover:text-navy">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
