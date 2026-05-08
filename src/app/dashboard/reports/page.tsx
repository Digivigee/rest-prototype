import { prisma } from '@/lib/prisma'
import ReportsClient from './ReportsClient'
import { getActiveRestaurantId } from '@/lib/saas'
import { isFeatureEnabled } from '@/lib/billing'
import FeatureLocked from '@/components/ui/FeatureLocked'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  const isEnabled = await isFeatureEnabled(restaurantId, 'analytics')
  if (!isEnabled) {
    return <FeatureLocked featureName="Advanced Analytics" requiredPlan="PRO" />
  }
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const fromDate = searchParams.from ? new Date(searchParams.from) : thirtyDaysAgo
  const toDate = searchParams.to ? new Date(new Date(searchParams.to).setHours(23, 59, 59, 999)) : today

  // 1. Bills in date range (for daily sales + payment methods)
  const bills = await prisma.bill.findMany({
    where: {
      status: 'PAID',
      createdAt: { gte: fromDate, lte: toDate }
    },
    select: {
      total: true,
      tax: true,
      discount: true,
      createdAt: true,
      payments: { select: { amount: true, method: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  // 2. All orders in range (for status summary & staff performance)
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    select: { status: true, totalAmount: true, user: { select: { name: true, role: true } } }
  })

  // 3. Top selling items & COGS (order items in range)
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: fromDate, lte: toDate }, status: { not: 'CANCELLED' } } },
    select: { 
      menuItemId: true,
      quantity: true, 
      priceAtTime: true,
      menuItem: { select: { name: true, costPrice: true } } 
    }
  })

  // 4. Table utilization (orders per table in range)
  const tableOrders = await prisma.order.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    select: { tableId: true, table: { select: { number: true, capacity: true } } }
  })

  // We fetch all and filter in memory since SQLite doesn't support column comparisons in where
  const allInventory = await prisma.inventoryItem.findMany({
    select: { id: true, name: true, currentStock: true, minStockLevel: true }
  })
  const lowStock = allInventory.filter(i => i.currentStock <= i.minStockLevel)

  // 5. Inventory Transactions (Usage)
  const inventoryTransactions = await prisma.inventoryTransaction.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate }, type: { in: ['DEBIT', 'OUT', 'WASTAGE'] } },
    select: { 
      quantity: true,
      inventoryItem: { select: { name: true, unit: true, costPerUnit: true } } 
    }
  })

  return (
    <div className="animate-in fade-in duration-500">
      <ReportsClient
        bills={bills}
        orders={orders}
        orderItems={orderItems}
        tableOrders={tableOrders}
        lowStock={lowStock}
        inventoryUsage={inventoryTransactions}
        fromDate={fromDate.toISOString().split('T')[0]}
        toDate={toDate.toISOString().split('T')[0]}
      />
    </div>
  )
}