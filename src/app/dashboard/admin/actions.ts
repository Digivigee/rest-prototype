'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

async function ensureSuperAdmin() {
  const session = await auth()
  if ((session?.user as any)?.userType !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required')
  }
}

export async function getAdminStats() {
  await ensureSuperAdmin()

  const [totalRestaurants, activeSubs, totalRevenue, totalStaff, totalTables] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    }),
    prisma.staffProfile.count(),
    prisma.table.count()
  ])

  return {
    totalRestaurants,
    activeSubs,
    totalRevenue: totalRevenue._sum.amount || 0,
    totalStaff,
    totalTables
  }
}

export async function getRestaurantsManagement() {
  await ensureSuperAdmin()

  return await prisma.restaurant.findMany({
    include: {
      _count: {
        select: {
          staffProfiles: true,
          tables: true,
          orders: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateRestaurantStatus(id: string, status: 'ACTIVE' | 'BLOCKED') {
  await ensureSuperAdmin()

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { status }
  })

  await prisma.activityLog.create({
    data: {
      restaurantId: id,
      action: 'UPDATE_STATUS',
      details: `Restaurant ${status.toLowerCase()} by Super Admin`
    }
  })

  revalidatePath('/dashboard/admin/restaurants')
  return restaurant
}

export async function updateRestaurantPlan(id: string, planType: string) {
  await ensureSuperAdmin()

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { planType }
  })

  await prisma.activityLog.create({
    data: {
      restaurantId: id,
      action: 'UPDATE_PLAN',
      details: `Plan manually changed to ${planType} by Super Admin`
    }
  })

  revalidatePath('/dashboard/admin/restaurants')
  return restaurant
}

export async function getTopRestaurants() {
  await ensureSuperAdmin()

  // Simplified performance metric: total orders
  return await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      planType: true,
      _count: {
        select: { orders: true }
      }
    },
    orderBy: {
      orders: { _count: 'desc' }
    },
    take: 5
  })
}

export async function getRecentLogs() {
  await ensureSuperAdmin()

  return await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  })
}
