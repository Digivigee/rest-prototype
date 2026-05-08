'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActiveRestaurantId } from '@/lib/saas'

export async function generateBill(orderId: string, taxRate: number = 5, discount: number = 0, serviceCharge: number = 0) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const order = await prisma.order.findUnique({
    where: { id: orderId, restaurantId },
    include: { items: true }
  })

  if (!order) throw new Error('Order not found')

  const subtotal = order.items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0)
  const tax = subtotal * (taxRate / 100)
  const total = Math.max(0, subtotal + tax + serviceCharge - discount)

  const bill = await prisma.bill.upsert({
    where: { orderId },
    update: {
      subtotal,
      tax,
      discount,
      serviceCharge,
      total,
      status: 'UNPAID'
    },
    create: {
      orderId,
      restaurantId,
      subtotal,
      tax,
      discount,
      serviceCharge,
      total,
      status: 'UNPAID'
    },
    include: { payments: true }
  })

  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/orders')
  return bill
}

export async function recordPayment(billId: string, orderId: string, tableId: string, amount: number, method: string) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  await prisma.$transaction(async (tx) => {
    const currentBill = await tx.bill.findUnique({ where: { id: billId } })
    if (!currentBill) throw new Error('Bill not found')
    if (currentBill.status === 'PAID') throw new Error('Bill is already fully paid')

    // 1. Create payment
    await tx.payment.create({
      data: {
        billId,
        restaurantId,
        amount,
        method,
        status: 'PAID'
      }
    })

    // 2. Check if bill is fully paid
    const bill = await tx.bill.findUnique({
      where: { id: billId },
      include: { payments: true }
    })

    if (!bill) throw new Error('Bill not found')

    const totalPaid = bill.payments.reduce((acc, p) => acc + p.amount, 0)
    if (totalPaid >= bill.total) {
      await tx.bill.update({
        where: { id: billId },
        data: { status: 'PAID' }
      })

      // 3. Complete order and free table
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'SERVED' }
      })

      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'AVAILABLE' }
        })
      }
    } else if (totalPaid > 0) {
      await tx.bill.update({
        where: { id: billId },
        data: { status: 'PARTIAL' }
      })
    }
  })

  revalidatePath('/dashboard/billing')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/tables')
}

export async function refundPayment(paymentId: string) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId, restaurantId },
      include: { bill: true }
    })

    if (!payment) throw new Error('Payment not found')
    if (payment.status === 'REFUNDED') throw new Error('Payment already refunded')

    // 1. Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    })

    // 2. Recalculate bill status
    const allPayments = await tx.payment.findMany({
      where: { billId: payment.billId, status: 'PAID' }
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
    
    let newStatus = 'UNPAID'
    if (totalPaid >= payment.bill.total) newStatus = 'PAID'
    else if (totalPaid > 0) newStatus = 'PARTIAL'

    await tx.bill.update({
      where: { id: payment.billId },
      data: { status: newStatus }
    })
    
    // Note: Re-opening an order or table on refund depends on business logic, 
    // but typically a refund doesn't un-serve a table.
  })

  revalidatePath('/dashboard/billing')
}
