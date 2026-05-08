'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function advanceTicketStatus(ticketId: string, currentStatus: string, orderId: string) {
  let nextStatus = '';
  let orderStatus = '';

  if (currentStatus === 'QUEUED' || currentStatus === 'PENDING') {
    nextStatus = 'PREPARING';
    orderStatus = 'PREPARING';
  } else if (currentStatus === 'PREPARING') {
    nextStatus = 'READY';
    orderStatus = 'READY';
  } else if (currentStatus === 'READY') {
    nextStatus = 'COMPLETED'; // Removed from KDS
    orderStatus = 'READY'; // Remains READY for waiter in Orders dashboard
  } else {
    throw new Error('Invalid ticket state transition.');
  }

  await prisma.$transaction([
    prisma.kitchenTicket.update({
      where: { id: ticketId },
      data: { status: nextStatus }
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus }
    })
  ]);

  revalidatePath('/dashboard/kitchen');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/tables');
}
