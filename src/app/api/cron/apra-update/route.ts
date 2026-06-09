import { NextResponse } from 'next/server'

// Runs each October when APRA publishes annual performance test results
// In MVP phase: trigger manual fund data update
// Future: scrape APRA published data via their API
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorised', { status: 401 })
  }
  // TODO: fetch and update fund performance data from APRA
  return NextResponse.json({ message: 'APRA update cron — update fund data manually for now', updated: false })
}
