'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { canAddTable } from '@/lib/billing'
import { getActiveRestaurantId } from '@/lib/saas'

export async function addTable(data: { number: string; capacity: number }) {
  if (!data.number || !data.capacity) throw new Error('Number and capacity required');

  const restaurantId = await getActiveRestaurantId()
  if (restaurantId) {
    const allowed = await canAddTable(restaurantId)
    if (!allowed) {
      throw new Error('You have reached the table limit for your plan. Please upgrade to add more tables.')
    }
  }

  await prisma.table.create({
    data: {
      number: data.number,
      capacity: Number(data.capacity),
      status: 'AVAILABLE',
      restaurantId: restaurantId!
    }
  });
  revalidatePath('/dashboard/tables');
}

export async function updateTable(id: string, data: { number: string; capacity: number, status?: string }) {
  if (!data.number || !data.capacity) throw new Error('Number and capacity required');
  await prisma.table.update({
    where: { id },
    data: {
      number: data.number,
      capacity: Number(data.capacity),
      ...(data.status ? { status: data.status } : {})
    }
  });
  revalidatePath('/dashboard/tables');
}

export async function updateTableStatus(id: string, status: string) {
  await prisma.table.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/dashboard/tables');
}

export async function deleteTable(id: string) {
  // Enforce delete only if no active order exists
  const activeOrders = await prisma.order.count({
    where: {
      tableId: id,
      status: { notIn: ['SERVED', 'CANCELLED'] }
    }
  });
  
  if (activeOrders > 0) {
    throw new Error('Cannot delete table with active orders.')
  }
  
  await prisma.table.delete({ where: { id } });
  revalidatePath('/dashboard/tables');
}
