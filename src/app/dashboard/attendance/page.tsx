import { prisma } from '@/lib/prisma'
import AttendanceClient from './AttendanceClient'
import { getActiveRestaurantId } from '@/lib/saas'
import { isFeatureEnabled } from '@/lib/billing'
import FeatureLocked from '@/components/ui/FeatureLocked'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  const isEnabled = await isFeatureEnabled(restaurantId, 'attendance')
  if (!isEnabled) {
    return <FeatureLocked featureName="Attendance Tracking" requiredPlan="BASIC" />
  }

  const staffProfiles = await prisma.staffProfile.findMany({
    include: {
      user: {
        include: { role: true }
      }
    },
    orderBy: { user: { name: 'asc' } }
  })

  const attendance = await prisma.attendance.findMany({
    orderBy: { date: 'desc' }
  })

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Management</h1>
        <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-widest text-xs">Attendance & Shift Records</p>
      </div>

      <AttendanceClient 
        staffProfiles={staffProfiles}
        initialAttendance={attendance}
        isAdmin={true} // For demo purpose we show all
      />
    </div>
  )
}
