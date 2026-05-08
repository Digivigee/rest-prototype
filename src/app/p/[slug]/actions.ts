'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { cacheGet, cacheSet } from '@/lib/redis'
import { OrderService } from '@/services/order.service'

export async function getPublicRestaurant(slug: string) {
  const cacheKey = `public_menu:${slug}`
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      menuCategories: {
        include: {
          items: {
            where: { isAvailable: true }
          }
        }
      }
    }
  })

  if (restaurant) {
    await cacheSet(cacheKey, restaurant, 300) // Cache for 5 mins
  }

  return restaurant
}

export async function submitPublicOrder(data: { 
  restaurantId: string, 
  customerName: string, 
  customerPhone: string,
  tableNumber?: string,
  items: { menuItemId: string, quantity: number, price: number }[]
}) {
  const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const order = await prisma.order.create({
    data: {
      restaurantId: data.restaurantId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      tableNumber: data.tableNumber,
      totalAmount,
      status: 'PENDING',
      items: {
        create: data.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtTime: item.price,
          restaurantId: data.restaurantId
        }))
      }
    }
  })

  // Create associated bill
  await prisma.bill.create({
    data: {
      restaurantId: data.restaurantId,
      orderId: order.id,
      subtotal: totalAmount,
      total: totalAmount,
      status: 'UNPAID'
    }
  })

  return { success: true, orderId: order.id }
}
