import { prisma } from './prisma'
import { PLANS, PlanType } from './plans'

export async function getRestaurantPlan(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      planType: true,
      subscriptionStatus: true,
      planExpiresAt: true,
      _count: {
        select: {
          tables: true,
          staffProfiles: true
        }
      }
    }
  })

  if (!restaurant) return null

  return {
    planType: restaurant.planType as PlanType,
    status: restaurant.subscriptionStatus,
    expiresAt: restaurant.planExpiresAt,
    usage: {
      tables: restaurant._count.tables,
      staff: restaurant._count.staffProfiles
    },
    limits: PLANS[restaurant.planType as PlanType] || PLANS.FREE
  }
}

export async function canAddTable(restaurantId: string) {
  const info = await getRestaurantPlan(restaurantId)
  if (!info) return false
  return info.usage.tables < info.limits.maxTables
}

export async function canAddStaff(restaurantId: string) {
  const info = await getRestaurantPlan(restaurantId)
  if (!info) return false
  return info.usage.staff < info.limits.maxStaff
}

export async function isFeatureEnabled(restaurantId: string, feature: string) {
  const info = await getRestaurantPlan(restaurantId)
  if (!info) return false
  
  // Check if status is ACTIVE
  if (info.status !== 'ACTIVE') return false
  
  // Check if expired
  if (info.expiresAt && info.expiresAt < new Date()) return false

  return info.limits.features.includes(feature)
}
