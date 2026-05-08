import { prisma } from '@/lib/prisma'
import MyDashboardClient from './MyDashboardClient'

export const dynamic = 'force-dynamic'

export default async function MyProfilePage() {
  const staffProfiles = await prisma.staffProfile.findMany({
    include: {
      user: {
        include: { role: true }
      }
    },
    orderBy: { user: { name: 'asc' } }
  })

  const allAttendance = await prisma.attendance.findMany({
    orderBy: { date: 'desc' }
  })

  const allSalaryRecords = await prisma.salaryRecord.findMany()

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Personal Dashboard</h1>
        <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-widest text-xs">Your Attendance & Earnings Overview</p>
      </div>

      <MyDashboardClient 
        staffProfiles={staffProfiles}
        allAttendance={allAttendance}
        allSalaryRecords={allSalaryRecords}
      />
    </div>
  )
}
