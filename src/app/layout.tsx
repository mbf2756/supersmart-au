import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SuperSmart AU — Independent Super Optimisation',
    template: '%s | SuperSmart AU',
  },
  description: 'Australia\'s only independent superannuation optimisation platform. Free super health score, carry-forward tracker, fee analyser, Division 296 modeller and more. General information only — not financial advice.',
  keywords: ['superannuation', 'super', 'salary sacrifice', 'division 296', 'carry forward super', 'super fee calculator', 'SMSF'],
  openGraph: {
    siteName: 'SuperSmart AU',
    type: 'website',
    locale: 'en_AU',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://supersmart.au'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
