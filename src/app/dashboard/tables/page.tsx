import { prisma } from '@/lib/prisma'
import { getActiveRestaurantId } from '@/lib/saas'
import { getRestaurantPlan } from '@/lib/billing'
import TableClient from './TableClient'

export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const restaurantId = await getActiveRestaurantId()
  const billingInfo = restaurantId ? await getRestaurantPlan(restaurantId) : null

  const tables = await prisma.table.findMany({
    orderBy: { number: 'asc' },
    include: {
      orders: {
        where: {
          status: { notIn: ['SERVED', 'CANCELLED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  const restaurant = restaurantId ? await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { slug: true }
  }) : null

  return (
    <div className="animate-in fade-in duration-500">
      <TableClient 
        tables={tables} 
        billingInfo={billingInfo} 
        restaurantSlug={restaurant?.slug || ''} 
      />
    </div>
  )
}