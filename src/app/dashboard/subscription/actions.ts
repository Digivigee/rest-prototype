'use server'

import { prisma } from '@/lib/prisma'
import { getActiveRestaurantId } from '@/lib/saas'
import { revalidatePath } from 'next/cache'

export async function upgradePlan(planType: string, period: 'MONTHLY' | 'YEARLY') {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const expiresAt = new Date()
  if (period === 'MONTHLY') {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      planType,
      subscriptionPeriod: period,
      subscriptionStatus: 'ACTIVE',
      planExpiresAt: expiresAt
    }
  })

  revalidatePath('/dashboard/billing')
  return { success: true }
}
