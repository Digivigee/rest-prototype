import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';
import { cacheGet, cacheSet } from '@/lib/redis';

export class BillingService {
  static async getRestaurantPlan(restaurantId: string) {
    const cacheKey = `plan:${restaurantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { planType: true, subscriptionStatus: true }
    });

    if (!restaurant) return null;

    const plan = PLANS[restaurant.planType as keyof typeof PLANS] || PLANS.FREE;
    
    // Calculate usage
    const [tables, staff] = await Promise.all([
      prisma.table.count({ where: { restaurantId } }),
      prisma.staffProfile.count({ where: { restaurantId } })
    ]);

    const result = {
      planType: restaurant.planType,
      status: restaurant.subscriptionStatus,
      limits: plan,
      usage: { tables, staff },
      features: plan.features
    };

    await cacheSet(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  static async isFeatureEnabled(restaurantId: string, feature: string) {
    const plan = await this.getRestaurantPlan(restaurantId);
    return plan?.features.includes(feature) || false;
  }
}
