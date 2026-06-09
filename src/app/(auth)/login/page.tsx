import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-teal tracking-widest uppercase mb-1">AU · SUPER</div>
          <h1 className="text-2xl font-semibold text-navy">Sign in to SuperSmart</h1>
          <p className="text-sm text-navy/50 mt-1">Australia's independent super optimisation platform</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border border-black/10 p-8 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
