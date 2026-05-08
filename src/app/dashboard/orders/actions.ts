'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function createOrder(tableIdStr: string, items: Array<{ menuItemId: string, quantity: number, notes?: string, price: number }>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!tableIdStr) throw new Error("Table or Takeaway must be selected");
  if (items.length === 0) throw new Error("Cart is empty");

  const isTakeaway = tableIdStr === 'TAKEAWAY';
  const tableId = isTakeaway ? null : tableIdStr;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Validate Stock & Prepare Deductions
    const deductionsMap: Record<string, { quantity: number, name: string, restaurantId: string, unit: string, currentStock: number }> = {};
    const alerts: string[] = [];

    for (const item of items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { 
          recipe: { 
            include: { 
              items: { 
                include: { inventoryItem: true } 
              } 
            } 
          } 
        }
      });

      if (menuItem?.recipe) {
        for (const recipeItem of menuItem.recipe.items) {
          const invItem = recipeItem.inventoryItem;
          // Calculate needed in inventory units considering conversion and wastage (yield)
          const totalNeededInInventoryUnits = (recipeItem.quantityUsed * item.quantity * invItem.recipeUnitConversion) / invItem.yieldFactor;
          
          if (!deductionsMap[recipeItem.inventoryItemId]) {
            deductionsMap[recipeItem.inventoryItemId] = {
              quantity: 0,
              name: invItem.name,
              restaurantId: menuItem.restaurantId,
              unit: invItem.unit,
              currentStock: invItem.currentStock
            };
          }
          deductionsMap[recipeItem.inventoryItemId].quantity += totalNeededInInventoryUnits;
        }
      }
    }

    for (const [id, d] of Object.entries(deductionsMap)) {
      if (d.currentStock < d.quantity) {
        throw new Error(`Insufficient stock for ${d.name}. Need ${d.quantity.toFixed(3)}${d.unit}, but only ${d.currentStock.toFixed(3)}${d.unit} available.`);
      }
    }

    // 2. Check for existing active order for the table
    let order;
    
    if (!isTakeaway) {
      const existingOrder = await tx.order.findFirst({
        where: {
          tableId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] }
        }
      });

      if (existingOrder) {
        // Append to existing order
        order = await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            items: {
              create: items.map(i => ({
                menuItemId: i.menuItemId,
                quantity: i.quantity,
                notes: i.notes || null,
                priceAtTime: i.price,
                restaurantId: (session.user as any).restaurantId
              }))
            },
            tickets: {
              create: {
                status: 'PENDING',
                restaurantId: (session.user as any).restaurantId
              }
            }
          }
        });
      }
    }

    if (!order) {
      // Create new order
      order = await tx.order.create({
        data: {
          tableId,
          userId: (session.user as any).id,
          restaurantId: (session.user as any).restaurantId,
          status: 'CONFIRMED',
          items: {
            create: items.map(i => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              notes: i.notes || null,
              priceAtTime: i.price,
              restaurantId: (session.user as any).restaurantId
            }))
          },
          tickets: {
            create: {
              status: 'PENDING',
              restaurantId: (session.user as any).restaurantId
            }
          }
        }
      });
    }

    // 3. Deduct Stock & Log Transactions
    for (const [id, d] of Object.entries(deductionsMap)) {
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: { decrement: d.quantity } }
      });

      if (updatedItem.currentStock < 0) {
        throw new Error(`Insufficient stock for ${updatedItem.name} after concurrent update. Please try again.`);
      }

      if (updatedItem.currentStock < updatedItem.minStockLevel) {
        alerts.push(`Low Stock Alert: ${updatedItem.name} dropped to ${updatedItem.currentStock.toFixed(2)}${updatedItem.unit}!`);
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          restaurantId: d.restaurantId,
          type: 'DEBIT',
          quantity: d.quantity,
          reason: `Order #${order.id.slice(-6).toUpperCase()}`,
          reference: order.id
        }
      });
    }

    // 4. Update table status to occupied
    if (!isTakeaway && tableId) {
      await tx.table.update({
        where: { id: tableId as string },
        data: { status: 'OCCUPIED' }
      });
    }

    return { success: true, alerts };
  });

  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/tables');
  revalidatePath('/dashboard/kitchen');
  revalidatePath('/dashboard');

  return result;
}

export async function updateOrderStatus(orderId: string, status: string, servedById?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { 
          include: { 
            menuItem: { 
              include: { 
                recipe: { 
                  include: { 
                    items: { 
                      include: { inventoryItem: true } 
                    } 
                  } 
                } 
              } 
            } 
          } 
        } 
      }
    });

    if (!order) throw new Error("Order not found");

    // Prevent duplicate cancellation logic
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      // Revert Stock
      for (const item of order.items) {
        if (item.menuItem.recipe) {
          for (const recipeItem of item.menuItem.recipe.items) {
            const invItem = recipeItem.inventoryItem;
            const amountToRevert = (recipeItem.quantityUsed * item.quantity * invItem.recipeUnitConversion) / invItem.yieldFactor;
            
            await tx.inventoryItem.update({
              where: { id: recipeItem.inventoryItemId },
              data: { currentStock: { increment: amountToRevert } }
            });

            await tx.inventoryTransaction.create({
              data: {
                inventoryItemId: recipeItem.inventoryItemId,
                restaurantId: order.restaurantId,
                type: 'CREDIT',
                quantity: amountToRevert,
                reason: `Cancellation of Order #${order.id.slice(-6).toUpperCase()}`,
                reference: order.id
              }
            });
          }
        }
      }

      // Mark table as AVAILABLE
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    if (status === 'SERVED' && order.status !== 'SERVED') {
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { 
        status,
        ...(status === 'SERVED' && servedById ? { userId: servedById } : {})
      }
    });
  });

  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/tables');
}

export async function generateBill(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true }
    });

    if (!order) throw new Error("Order not found");

    const subtotal = order.items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0);
    const tax = subtotal * 0.05;
    const serviceCharge = subtotal * 0.10;
    const total = subtotal + tax + serviceCharge;

    // 1. Create or Update Bill (Idempotent)
    await prisma.bill.upsert({
      where: { orderId },
      update: {
        subtotal,
        tax,
        serviceCharge,
        total,
        status: 'UNPAID'
      },
      create: {
        orderId,
        subtotal,
        tax,
        serviceCharge,
        total,
        status: 'UNPAID',
        restaurantId: order.restaurantId
      }
    });

    // 2. Mark Order as SERVED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SERVED' }
    });

    // 3. Mark Table as AVAILABLE
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });
    }

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/tables');
    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('GENERATE_BILL_ERROR:', error);
    throw error;
  }
}
