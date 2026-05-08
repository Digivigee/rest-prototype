import { prisma } from '@/lib/prisma'
import InventoryClient from './InventoryClient'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="animate-in fade-in duration-500">
      <InventoryClient items={items} />
    </div>
  )
}