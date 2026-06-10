'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(searchParams.get('redirectTo') ?? '/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8" style={{ border: '1px solid rgba(15,30,60,0.1)' }}>
      <form onSubmit={handleLogin}>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid rgba(232,93,93,0.2)' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          <label
            className="block text-xs font-medium uppercase tracking-wide"
            style={{ color: 'rgba(15,30,60,0.5)' }}
          >
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl font-mono text-sm"
            style={{
              border: '1px solid rgba(15,30,60,0.12)',
              color: '#0F1E3C',
              outline: 'none',
              background: 'white',
            }}
          />
        </div>

        <div className="space-y-1.5 mb-6">
          <label
            className="block text-xs font-medium uppercase tracking-wide"
            style={{ color: 'rgba(15,30,60,0.5)' }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm"
            style={{
              border: '1px solid rgba(15,30,60,0.12)',
              color: '#0F1E3C',
              outline: 'none',
              background: 'white',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: '#0F1E3C',
            color: '#FFFFFF',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

      </form>

      <div className="mt-5 text-center text-sm space-x-3" style={{ color: 'rgba(15,30,60,0.5)' }}>
        <Link href="/forgot-password" className="hover:underline">Forgot password?</Link>
        <span>·</span>
        <Link href="/signup" className="hover:underline">Create account</Link>
      </div>
    </div>
  )
}
