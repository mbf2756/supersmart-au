import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const { data: users } = await supabase.from('super_profiles').select('user_id, current_balance, profiles(email, full_name)').lt('current_balance', 500000)
  let sent = 0
  for (const u of users ?? []) {
    const profile = (u as any).profiles
    if (!profile?.email) continue
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: profile.email,
      subject: '⚠ Your $27,500 super cap expires 30 June — act now',
      html: `<p>Hi ${profile.full_name?.split(' ')[0] ?? 'there'},</p><p>Your 2020–21 carry-forward cap of $27,500 expires permanently on 30 June 2026. <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributions">Check your capacity →</a></p><p style="font-size:11px;color:#888">General information only. Not financial advice.</p>`,
    })
    sent++
  }
  return NextResponse.json({ sent })
}
