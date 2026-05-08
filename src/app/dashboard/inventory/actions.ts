'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActiveRestaurantId } from '@/lib/saas'

export async function createInventoryItem(data: {
  name: string; unit: string; quantity: number;
  minThreshold: number; costPerUnit?: number; supplier?: string;
  recipeUnit?: string; yieldFactor?: number; recipeUnitConversion?: number;
}) {
  if (!data.name || !data.unit) throw new Error('Name and unit are required');
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  await prisma.inventoryItem.create({
    data: {
      name: data.name,
      unit: data.unit,
      currentStock: Number(data.quantity) || 0,
      minStockLevel: Number(data.minThreshold) || 0,
      costPerUnit: data.costPerUnit ? Number(data.costPerUnit) : null,
      supplier: data.supplier || null,
      recipeUnit: data.recipeUnit || null,
      yieldFactor: data.yieldFactor ? Number(data.yieldFactor) : 1.0,
      recipeUnitConversion: data.recipeUnitConversion ? Number(data.recipeUnitConversion) : 1.0,
      restaurantId
    }
  });
  revalidatePath('/dashboard/inventory');
}

export async function updateInventoryItem(id: string, data: {
  name: string; unit: string; minThreshold: number;
  costPerUnit?: number; supplier?: string;
  recipeUnit?: string; yieldFactor?: number; recipeUnitConversion?: number;
}) {
  await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name,
      unit: data.unit,
      minStockLevel: Number(data.minThreshold) || 0,
      costPerUnit: data.costPerUnit ? Number(data.costPerUnit) : null,
      supplier: data.supplier || null,
      recipeUnit: data.recipeUnit || null,
      yieldFactor: data.yieldFactor ? Number(data.yieldFactor) : 1.0,
      recipeUnitConversion: data.recipeUnitConversion ? Number(data.recipeUnitConversion) : 1.0,
    }
  });
  revalidatePath('/dashboard/inventory');
}

export async function deleteInventoryItem(id: string) {
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath('/dashboard/inventory');
}

export async function addTransaction(data: {
  inventoryItemId: string; type: string; quantity: number; reason?: string;
  costPerUnit?: number; supplier?: string;
}) {
  const qty = Number(data.quantity);
  if (qty <= 0) throw new Error('Quantity must be positive');

  const item = await prisma.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
  if (!item) throw new Error('Item not found');

  let newStock = item.currentStock;
  if (data.type === 'IN') {
    newStock += qty;
  } else if (data.type === 'OUT' || data.type === 'WASTAGE') {
    if (item.currentStock < qty) throw new Error(`Cannot remove ${qty} ${item.unit}. Only ${item.currentStock} in stock.`);
    newStock -= qty;
  } else if (data.type === 'ADJUSTMENT') {
    newStock = qty; // Set to exact value
  }

  await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        type: data.type,
        quantity: qty,
        reason: data.reason || null,
        restaurantId: item.restaurantId
      }
    }),
    prisma.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: { 
        currentStock: newStock,
        ...(data.type === 'IN' && data.costPerUnit ? { costPerUnit: Number(data.costPerUnit) } : {}),
        ...(data.type === 'IN' && data.supplier ? { supplier: data.supplier } : {})
      }
    })
  ]);

  revalidatePath('/dashboard/inventory');
}
