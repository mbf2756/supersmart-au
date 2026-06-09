'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-black/10 p-10 max-w-md w-full text-center">
        <div className="text-3xl mb-4">✉️</div>
        <h2 className="text-xl font-semibold text-navy mb-2">Check your email</h2>
        <p className="text-sm text-navy/60">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-teal tracking-widest uppercase mb-1">AU · SUPER</div>
          <h1 className="text-2xl font-semibold text-navy">Create your account</h1>
          <p className="text-sm text-navy/50 mt-1">Free to start · No credit card required</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/10 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}
            <Input label="Full name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" />
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required hint="(8+ characters)" minLength={8} />
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Creating account…' : 'Create free account'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-navy/50">
            Already have an account? <Link href="/login" className="hover:text-navy">Sign in</Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-navy/30">
          By signing up you agree to our Terms of Service. General information only — not financial advice.
        </p>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
