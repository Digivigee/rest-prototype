import { prisma } from '@/lib/prisma'
import MenuClient from './MenuClient'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const items = await prisma.menuItem.findMany({
    include: { 
      category: true,
      recipe: {
        include: {
          items: {
            include: { inventoryItem: true }
          }
        }
      }
    },
    orderBy: { category: { name: 'asc' } }
  })
  
  const categories = await prisma.menuCategory.findMany({
    orderBy: { name: 'asc' }
  })

  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="animate-in fade-in duration-500">
      <MenuClient initialItems={items} categories={categories} inventoryItems={inventoryItems} />
    </div>
  )
}