import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, source = 'homepage' } = await request.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: dbError } = await supabaseAdmin.from('waitlist').insert({ email, source })
  if (dbError && dbError.code !== '23505') {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@supersmart.au',
      to: email,
      subject: "You're on the SuperSmart AU waitlist 🎉",
      html: `<div style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:20px">
        <h2 style="color:#0F1E3C">You're in!</h2>
        <p style="color:#4A5F7A;line-height:1.7">Thanks for joining SuperSmart AU — Australia's independent super optimisation platform.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup" style="display:inline-block;background:#00D4AA;color:#0F1E3C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Get your free super score →</a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:11px;color:#8A9BB5">General information only. Not financial advice.</p>
      </div>`,
    })
  }

  return NextResponse.json({ success: true })
}
