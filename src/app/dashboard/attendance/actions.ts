'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CONFIG } from '@/lib/config'

export async function checkIn(staffId: string, localDateString: string) {
  try {
    const [y, m, d] = localDateString.split('-').map(Number)
    const dateOnly = new Date(Date.UTC(y, m - 1, d))
    
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { id: staffId }
    })

    if (!staffProfile) throw new Error("Staff profile not found")

    const shift = CONFIG.ATTENDANCE.SHIFTS[staffProfile.shiftType as keyof typeof CONFIG.ATTENDANCE.SHIFTS] || CONFIG.ATTENDANCE.SHIFTS.MORNING
    const [shiftH, shiftM] = shift.start.split(':').map(Number)
    
    // Shift start time needs to be compared against check-in time.
    // Since we just want late minutes, we can construct the shift start in the local timezone (approx).
    const checkInTime = new Date()
    // A simplified late calculation based on local time
    const currentH = checkInTime.getHours()
    const currentM = checkInTime.getMinutes()
    let lateMinutes = 0
    
    const shiftMinutes = shiftH * 60 + shiftM
    const currentMinutes = currentH * 60 + currentM
    
    if (currentMinutes > shiftMinutes) {
      lateMinutes = currentMinutes - shiftMinutes
    }

    const existing = await prisma.attendance.findUnique({
      where: { staffId_date: { staffId, date: dateOnly } }
    })

    if (existing?.checkInTime) {
      return { success: false, error: "Already checked in for today" }
    }

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInTime, lateMinutes, status: 'PRESENT' }
      })
    } else {
      await prisma.attendance.create({
        data: {
          staffId,
          restaurantId: staffProfile.restaurantId,
          branchId: staffProfile.branchId,
          date: dateOnly,
          checkInTime,
          lateMinutes,
          status: 'PRESENT'
        }
      })
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (error: any) {
    console.error('Check-In Error:', error)
    return { success: false, error: error.message }
  }
}

export async function checkOut(staffId: string, localDateString: string) {
  try {
    const [y, m, d] = localDateString.split('-').map(Number)
    const dateOnly = new Date(Date.UTC(y, m - 1, d))
    const checkOutTime = new Date()

    const record = await prisma.attendance.findUnique({
      where: { staffId_date: { staffId, date: dateOnly } }
    })

    if (!record || !record.checkInTime) {
      return { success: false, error: 'No check-in record found for today' }
    }

    if (record.checkOutTime) {
      return { success: false, error: 'Already checked out for today' }
    }

    const totalHours = (checkOutTime.getTime() - record.checkInTime.getTime()) / 3600000
    const status = totalHours < CONFIG.ATTENDANCE.HALF_DAY_THRESHOLD ? 'HALF_DAY' : 'PRESENT'

    await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime,
        totalHours,
        status
      }
    })

    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (error: any) {
    console.error('Check-Out Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateAttendance(id: string, data: any) {
  const { checkInTime, checkOutTime, status, lateMinutes } = data
  
  let totalHours = null
  if (checkInTime && checkOutTime) {
    totalHours = (new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 3600000
  }

  await prisma.attendance.update({
    where: { id },
    data: {
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      status,
      lateMinutes: parseInt(lateMinutes) || 0,
      totalHours
    }
  })

  revalidatePath('/dashboard/attendance')
}

export async function markLeave(staffId: string, date: string, status: string) {
  const [y, m, d] = date.split('-').map(Number)
  const dateOnly = new Date(Date.UTC(y, m - 1, d))

  const staffProfile = await prisma.staffProfile.findUnique({
    where: { id: staffId }
  })
  if (!staffProfile) throw new Error("Staff not found")

  await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: dateOnly } },
    update: { status, checkInTime: null, checkOutTime: null, totalHours: 0, lateMinutes: 0 },
    create: {
      staffId,
      restaurantId: staffProfile.restaurantId,
      branchId: staffProfile.branchId,
      date: dateOnly,
      status,
      lateMinutes: 0
    }
  })

  revalidatePath('/dashboard/attendance')
}
