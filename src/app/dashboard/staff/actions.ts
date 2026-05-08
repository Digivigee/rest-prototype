'use server'

import { prisma } from '@/lib/prisma'
import { getRestaurantPlan } from '@/lib/billing'
import { getActiveRestaurantId } from '@/lib/saas'

export async function getStaff() {
  try {
    const restaurantId = await getActiveRestaurantId()
    if (!restaurantId) return []

    const users = await prisma.user.findMany({
      where: { restaurantId },
      include: {
        role: true,
        staffProfile: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role.name.toUpperCase()) as any,
      staffProfile: u.staffProfile
    }))
  } catch (error) {
    console.error('Error fetching staff:', error)
    return []
  }
}

export async function deleteStaff(userId: string) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  // Security check: ensure user belongs to this restaurant
  const user = await prisma.user.findUnique({
    where: { id: userId, restaurantId }
  })

  if (!user) throw new Error('User not found or unauthorized')

  await prisma.$transaction([
    prisma.staffProfile.delete({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ])

  return { success: true }
}

export async function updateStaffProfile(userId: string, data: {
  name?: string;
  roleId?: string;
  salaryType?: string;
  baseSalary?: number;
  isActive?: boolean;
}) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  await prisma.user.update({
    where: { id: userId, restaurantId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.roleId ? { roleId: data.roleId } : {}),
      staffProfile: {
        update: {
          ...(data.salaryType ? { salaryType: data.salaryType } : {}),
          ...(data.baseSalary ? { baseSalary: data.baseSalary } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        }
      }
    }
  })

  return { success: true }
}

export async function getBillingStatus() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null
  return await getRestaurantPlan(restaurantId)
}
