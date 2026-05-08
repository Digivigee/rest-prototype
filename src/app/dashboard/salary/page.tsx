import { prisma } from '@/lib/prisma'
import SalaryClient from './SalaryClient'
import { getActiveRestaurantId } from '@/lib/saas'
import { isFeatureEnabled } from '@/lib/billing'
import FeatureLocked from '@/components/ui/FeatureLocked'

export const dynamic = 'force-dynamic'

export default async function SalaryPage() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  const isEnabled = await isFeatureEnabled(restaurantId, 'salary')
  if (!isEnabled) {
    return <FeatureLocked featureName="Payroll Management" requiredPlan="BASIC" />
  }
  const staffProfiles = await prisma.staffProfile.findMany({
    include: {
      user: {
        include: { role: true }
      }
    },
    orderBy: { user: { name: 'asc' } }
  })

  const salaryRecords = await prisma.salaryRecord.findMany({
    include: {
      staff: {
        include: {
          user: {
            include: { role: true }
          }
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ]
  })

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Management</h1>
        <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-widest text-xs">Payroll & Salary Distribution</p>
      </div>

      <SalaryClient 
        staffProfiles={staffProfiles}
        initialRecords={salaryRecords}
      />
    </div>
  )
}
