'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push(searchParams.get('redirectTo') ?? '/dashboard'); router.refresh() }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/10 p-8">
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
        <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-5 text-center text-sm text-navy/50 space-x-3">
        <Link href="/forgot-password" className="hover:text-navy">Forgot password?</Link>
        <span>·</span>
        <Link href="/signup" className="hover:text-navy">Create account</Link>
      </div>
    </div>
  )
}
