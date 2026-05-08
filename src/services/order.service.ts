import { prisma } from '@/lib/prisma';
import { orderQueue } from '@/lib/queues';
import { cacheDelete, cacheGet, cacheSet } from '@/lib/redis';

export class OrderService {
  static async createOrder(restaurantId: string, tableId: string, items: any[], customerInfo?: any) {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          restaurantId,
          tableId,
          customerName: customerInfo?.name,
          customerPhone: customerInfo?.phone,
          totalAmount: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
          status: 'PENDING',
          items: {
            create: items.map(i => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              priceAtTime: i.price,
              restaurantId
            }))
          }
        },
        include: { items: true }
      });

      // Update table status
      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' }
        });
      }

      return newOrder;
    });

    // Add background task for notifications/KOT
    await orderQueue.add('new-order', {
      orderId: order.id,
      restaurantId,
      items: order.items
    });

    // Invalidate relevant caches
    await cacheDelete(`active_orders:${restaurantId}`);

    return order;
  }

  static async getActiveOrders(restaurantId: string) {
    const cacheKey = `active_orders:${restaurantId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const orders = await prisma.order.findMany({
      where: { 
        restaurantId,
        status: { notIn: ['SERVED', 'CANCELLED'] }
      },
      include: { items: { include: { menuItem: true } }, table: true },
      orderBy: { createdAt: 'desc' }
    });

    await cacheSet(cacheKey, orders, 60); // Cache for 1 min
    return orders;
  }

  static async updateStatus(orderId: string, status: string, servedById?: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        ...(status === 'SERVED' && servedById ? { servedById } : {})
      }
    });

    if (status === 'SERVED' || status === 'CANCELLED') {
      await prisma.table.update({
        where: { id: order.tableId || '' },
        data: { status: 'AVAILABLE' }
      });
    }

    await cacheDelete(`active_orders:${order.restaurantId}`);
    return order;
  }
}
