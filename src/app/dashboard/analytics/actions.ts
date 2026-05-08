'use server'

import { prisma } from '@/lib/prisma'
import { getActiveRestaurantId } from '@/lib/saas'

export async function getAnalyticsData() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

  // 1. Peak Hours (Last 30 Days)
  const orders = await prisma.order.findMany({
    where: { 
      restaurantId,
      createdAt: { gte: thirtyDaysAgo },
      status: 'SERVED'
    },
    select: { createdAt: true }
  })

  const peakHours = Array(24).fill(0)
  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours()
    peakHours[hour]++
  })

  // 2. Top Items
  const orderItems = await prisma.orderItem.findMany({
    where: { 
      restaurantId,
      order: { createdAt: { gte: thirtyDaysAgo }, status: 'SERVED' }
    },
    include: { menuItem: true }
  })

  const itemStats: Record<string, { name: string, quantity: number, revenue: number, profit: number }> = {}
  orderItems.forEach(oi => {
    if (!itemStats[oi.menuItemId]) {
      itemStats[oi.menuItemId] = { name: oi.menuItem.name, quantity: 0, revenue: 0, profit: 0 }
    }
    const cost = oi.menuItem.costPrice || 0
    itemStats[oi.menuItemId].quantity += oi.quantity
    itemStats[oi.menuItemId].revenue += oi.priceAtTime * oi.quantity
    itemStats[oi.menuItemId].profit += (oi.priceAtTime - cost) * oi.quantity
  })

  const topItems = Object.values(itemStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // 3. Staff Performance
  const staffPerformance = await prisma.order.groupBy({
    by: ['userId'],
    where: { 
      restaurantId,
      createdAt: { gte: thirtyDaysAgo },
      status: 'SERVED'
    },
    _count: { id: true },
    _sum: { totalAmount: true }
  })

  // Fetch staff names
  const staffIds = staffPerformance
    .filter(sp => sp.userId !== null)
    .map(sp => sp.userId as string)
  const staffInfo = await prisma.staffProfile.findMany({
    where: { userId: { in: staffIds } },
    include: { user: { select: { id: true, name: true } } }
  })

  const staffStats = staffPerformance.map(sp => ({
    name: staffInfo.find(si => si.userId === sp.userId)?.user.name || 'Unknown',
    count: sp._count.id,
    revenue: sp._sum.totalAmount || 0
  }))

  // 4. Financial Summary
  const totalRevenue = topItems.reduce((sum, item) => sum + item.revenue, 0)
  const totalProfit = topItems.reduce((sum, item) => sum + item.profit, 0)

  return {
    peakHours,
    topItems,
    staffStats,
    financials: {
      totalRevenue,
      totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    }
  }
}
