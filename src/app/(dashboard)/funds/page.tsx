import { DashboardTopbar } from '@/components/DashboardTopbar'
import { FundsClient } from './FundsClient'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Fund Comparison' }
export default function FundsPage() {
  return <>
    <DashboardTopbar title="Fund comparison" subtitle="Top MySuper options ranked by 7-year net return · APRA 2025 data" />
    <div className="p-8"><FundsClient /></div>
  </>
}
