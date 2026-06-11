import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, email, subject, message, category } = await request.json()

  // Validate
  if (!name?.trim() || !email?.includes('@') || !message?.trim()) {
    return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
  }
  if (message.trim().length < 10) {
    return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
  }

  // Log to Supabase for a record even if email fails
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('contact_submissions').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || category || 'General enquiry',
      message: message.trim(),
      category: category || 'general',
    })
  } catch {
    // DB logging failure shouldn't block the email send
  }

  if (!process.env.RESEND_API_KEY) {
    // Dev mode — just return success
    return NextResponse.json({ success: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@smartsuperau.com'
  const toEmail = process.env.CONTACT_TO_EMAIL || 'support@smartsuperau.com'

  // Send notification to SmartSuper AU team
  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: email.trim(),
    subject: `[Contact] ${category ? `[${category}] ` : ''}${subject?.trim() || 'New enquiry'} — from ${name.trim()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px">
        <div style="background:#0F1E3C;padding:20px 24px;border-radius:12px 12px 0 0">
          <div style="color:#00D4AA;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">SmartSuper AU · Contact Form</div>
          <div style="color:white;font-size:18px;font-weight:600">${subject?.trim() || 'New enquiry'}</div>
        </div>
        <div style="background:white;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#8A9BB5;font-size:13px;width:120px">Name</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#0F1E3C;font-size:13px;font-weight:500">${name.trim()}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#8A9BB5;font-size:13px">Email</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#0F1E3C;font-size:13px"><a href="mailto:${email.trim()}" style="color:#534AB7">${email.trim()}</a></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#8A9BB5;font-size:13px">Category</td>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#0F1E3C;font-size:13px">${category || 'General'}</td></tr>
          </table>
          <div style="background:#f8f8f7;border-radius:8px;padding:16px;font-size:14px;color:#0F1E3C;line-height:1.7;white-space:pre-wrap">${message.trim()}</div>
          <div style="margin-top:20px">
            <a href="mailto:${email.trim()}?subject=Re: ${encodeURIComponent(subject?.trim() || 'Your SmartSuper AU enquiry')}"
              style="display:inline-block;background:#0F1E3C;color:#00D4AA;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
              Reply to ${name.trim()} →
            </a>
          </div>
        </div>
        <div style="margin-top:16px;font-size:11px;color:#8A9BB5;text-align:center">SmartSuper AU · Brisbane, Australia · smartsuperau.com</div>
      </div>
    `,
  })

  // Send auto-reply to the person
  await resend.emails.send({
    from: fromEmail,
    to: email.trim(),
    subject: `We received your message — SmartSuper AU`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:20px">
        <div style="background:#0F1E3C;padding:20px 24px;border-radius:12px;margin-bottom:20px;text-align:center">
          <div style="color:#00D4AA;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">AU · SUPER</div>
          <div style="color:white;font-size:20px;font-weight:600">SmartSuper AU</div>
        </div>
        <h2 style="color:#0F1E3C;margin-bottom:8px">Thanks, ${name.trim().split(' ')[0]}!</h2>
        <p style="color:#4A5F7A;line-height:1.7;margin-bottom:16px">
          We've received your message and will get back to you within 1–2 business days.
          Our team is based in Brisbane, Australia — so replies come from AEST business hours.
        </p>
        <div style="background:#f8f8f7;border-radius:8px;padding:16px;margin-bottom:20px">
          <div style="font-size:12px;color:#8A9BB5;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Your message</div>
          <div style="font-size:13px;color:#0F1E3C;line-height:1.6;white-space:pre-wrap">${message.trim().slice(0, 300)}${message.trim().length > 300 ? '…' : ''}</div>
        </div>
        <p style="color:#4A5F7A;line-height:1.7;font-size:14px">
          While you wait, you can <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://smartsuperau.com'}/dashboard" style="color:#534AB7">log in to your dashboard</a> 
          or <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://smartsuperau.com'}/pricing" style="color:#534AB7">view our plans</a>.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:11px;color:#8A9BB5;line-height:1.6">
          SmartSuper AU · Brisbane, Australia<br>
          General information only. Not financial advice.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
