'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActiveRestaurantId } from '@/lib/saas'

export async function generateSalaries(month: number, year: number) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return { success: false, error: "No active restaurant" }

  const staff = await prisma.staffProfile.findMany({
    where: { restaurantId },
    include: { user: true }
  })

  try {
    for (const profile of staff) {
      const attendance = await prisma.attendance.findMany({
        where: {
          staffId: profile.id,
          restaurantId,
          date: {
            gte: new Date(Date.UTC(year, month - 1, 1)),
            lt: new Date(Date.UTC(year, month, 1))
          }
        }
      })

      const daysInMonth = new Date(year, month, 0).getDate()
      
      let presentDays = 0
      let absentDays = 0
      let halfDays = 0
      let totalHours = 0
      let overtimeHours = 0

      attendance.forEach(a => {
        if (a.status === 'PRESENT') presentDays++
        else if (a.status === 'ABSENT') absentDays++
        else if (a.status === 'HALF_DAY') halfDays++
        else if (a.status === 'LEAVE') presentDays++ // Paid leave
        
        const hours = a.totalHours || 0
        totalHours += hours
        if (hours > 9) { 
          overtimeHours += (hours - 9)
        }
      })

      let basePay = 0
      let deductions = 0
      let overtimePay = 0

      // Calculate hourly rate for OT
      let hourlyRate = 0
      if (profile.salaryType === 'HOURLY') {
        hourlyRate = profile.perHourSalary || 0
      } else if (profile.salaryType === 'DAILY') {
        hourlyRate = (profile.perDaySalary || 0) / 9
      } else {
        hourlyRate = (profile.baseSalary || 0) / (30 * 9) // Assuming 30 average days
      }

      overtimePay = overtimeHours * (hourlyRate * 1.5)

      if (profile.salaryType === 'MONTHLY') {
        basePay = profile.baseSalary || 0
        const perDayRate = basePay / 30
        // Only deduct explicitly marked absences
        deductions = absentDays * perDayRate + (halfDays * perDayRate * 0.5)
      } else if (profile.salaryType === 'DAILY') {
        basePay = (presentDays * (profile.perDaySalary || 0)) + (halfDays * (profile.perDaySalary || 0) * 0.5)
      } else if (profile.salaryType === 'HOURLY') {
        basePay = totalHours * (profile.perHourSalary || 0)
      }

      const grossSalary = basePay + overtimePay
      const netSalary = Math.max(0, grossSalary - deductions)

      const existing = await prisma.salaryRecord.findFirst({
        where: { 
          staffId: profile.id, 
          restaurantId,
          month, 
          year 
        }
      })

      const salaryData = {
        staffId: profile.id,
        restaurantId,
        branchId: profile.branchId,
        month,
        year,
        totalDays: daysInMonth,
        presentDays,
        absentDays,
        halfDays,
        overtimeHours,
        grossSalary,
        deductions,
        netSalary,
        status: 'PENDING' as const
      }

      if (existing) {
        await prisma.salaryRecord.update({
          where: { id: existing.id },
          data: salaryData
        })
      } else {
        await prisma.salaryRecord.create({
          data: salaryData
        })
      }
    }

    revalidatePath('/dashboard/salary')
    return { success: true }
  } catch (error: any) {
    console.error('Salary Generation Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSalaryStatus(id: string, status: string) {
  const restaurantId = await getActiveRestaurantId()
  await prisma.salaryRecord.update({
    where: { id, restaurantId: restaurantId! },
    data: { status }
  })
  revalidatePath('/dashboard/salary')
}

export async function updateSalaryAdjustments(id: string, deductions: number) {
    const restaurantId = await getActiveRestaurantId()
    const record = await prisma.salaryRecord.findUnique({ where: { id, restaurantId: restaurantId! } })
    if (!record) throw new Error("Record not found")
    
    const netSalary = Math.max(0, record.grossSalary - deductions)
    
    await prisma.salaryRecord.update({
      where: { id, restaurantId: restaurantId! },
      data: { deductions, netSalary }
    })
    revalidatePath('/dashboard/salary')
}

