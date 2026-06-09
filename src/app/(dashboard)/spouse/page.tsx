import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SpouseClient } from './SpouseClient'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Spouse Contribution Analysis' }
export default function SpousePage() {
  return <>
    <DashboardTopbar title="Spouse contribution analysis" subtitle="Spouse tax offset and balance equalisation modelling" />
    <div className="p-8"><SpouseClient /></div>
  </>
}
