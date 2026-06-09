import { DashboardTopbar } from '@/components/DashboardTopbar'
import { FeesClient } from './FeesClient'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Fee Analyser' }
export default function FeesPage() {
  return <>
    <DashboardTopbar title="Fee analyser" subtitle="See the true cost of fee drag on your super over time" />
    <div className="p-8"><FeesClient /></div>
  </>
}
