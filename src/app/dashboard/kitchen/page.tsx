import { prisma } from '@/lib/prisma'
import KitchenClient from './KitchenClient'

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
  const tickets = await prisma.kitchenTicket.findMany({
    where: {
      status: { in: ['QUEUED', 'PENDING', 'PREPARING', 'READY'] },
      order: {
        status: { notIn: ['SERVED', 'CANCELLED'] }
      }
    },
    include: {
      order: {
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' } 
  });

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-6rem)] bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
      <KitchenClient initialTickets={tickets} />
    </div>
  )
}