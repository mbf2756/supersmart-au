import { DashboardTopbar } from '@/components/DashboardTopbar'
import { Div296Client } from './Div296Client'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Division 296 Exposure' }
export default function Div296Page() {
  return <>
    <DashboardTopbar title="Division 296 exposure" subtitle="Model your exposure to the $3M super tax commencing 1 July 2026" />
    <div className="p-8"><Div296Client /></div>
  </>
}
