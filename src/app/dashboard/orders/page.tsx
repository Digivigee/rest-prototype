import { prisma } from '@/lib/prisma'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const [orders, menuItems, categories, tables, staff] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { table: true, items: { include: { menuItem: true } }, tickets: true }
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true }
    }),
    prisma.menuCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.table.findMany({ orderBy: { number: 'asc' } }),
    prisma.staffProfile.findMany({ 
      where: { isActive: true },
      include: { user: { select: { name: true } } }
    })
  ]);

  return (
    <div className="animate-in fade-in duration-500">
      <OrdersClient 
        initialOrders={orders} 
        menuItems={menuItems} 
        categories={categories} 
        tables={tables} 
        staff={staff}
      />
    </div>
  )
}