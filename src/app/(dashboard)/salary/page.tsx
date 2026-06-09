import { DashboardTopbar } from '@/components/DashboardTopbar'
import { SalaryClient } from './SalaryClient'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Salary Sacrifice Optimiser' }
export default function SalaryPage() {
  return <>
    <DashboardTopbar title="Salary sacrifice optimiser" subtitle="Calculate your tax saving from salary sacrificing into super" />
    <div className="p-8"><SalaryClient /></div>
  </>
}
