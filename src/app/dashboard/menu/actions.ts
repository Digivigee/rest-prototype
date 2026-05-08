'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { uploadImage } from '@/lib/cloudinary'
import { getActiveRestaurantId } from '@/lib/saas'

export async function uploadMenuItemImage(formData: FormData) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

  return await uploadImage(base64Image, `${restaurantId}/menu`)
}

export async function createMenuItem(data: any) {
  if (!data.name || !data.categoryId || data.price === undefined || data.price === null) {
      throw new Error('Name, category and price are required.');
  }

  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const existing = await prisma.menuItem.findFirst({
    where: {
      name: data.name,
      categoryId: data.categoryId,
      restaurantId
    }
  })
  if (existing) throw new Error('Menu item with this name already exists in this category.')

  await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      categoryId: data.categoryId,
      isAvailable: data.isAvailable ?? true,
      quantityInGrams: data.quantityInGrams ? parseInt(data.quantityInGrams) : null,
      prepTime: data.prepTime ? parseInt(data.prepTime) : null,
      imageUrl: data.imageUrl || null,
      restaurantId
    }
  })
  revalidatePath('/dashboard/menu')
}

export async function updateMenuItem(id: string, data: any) {
  const restaurantId = await getActiveRestaurantId()
  
  if (data.name && data.categoryId) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        id: { not: id },
        name: data.name,
        categoryId: data.categoryId,
        restaurantId: restaurantId!
      }
    })
    if (existing) throw new Error('Another menu item with this name already exists in this category.')
  }

  await prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      categoryId: data.categoryId,
      isAvailable: data.isAvailable,
      quantityInGrams: data.quantityInGrams ? parseInt(data.quantityInGrams) : null,
      prepTime: data.prepTime ? parseInt(data.prepTime) : null,
      imageUrl: data.imageUrl || null
    }
  })
  revalidatePath('/dashboard/menu')
}

export async function deleteMenuItem(id: string) {
  await prisma.menuItem.delete({
    where: { id }
  })
  revalidatePath('/dashboard/menu')
}

export async function toggleAvailability(id: string, isAvailable: boolean) {
  await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !isAvailable }
  })
  revalidatePath('/dashboard/menu')
}

export async function createCategory(name: string) {
  if (!name.trim()) throw new Error('Category name required');
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const existing = await prisma.menuCategory.findFirst({
    where: {
      name: name.trim(),
      restaurantId
    }
  })
  if (existing) throw new Error('Category already exists.')

  await prisma.menuCategory.create({ 
    data: { 
      name: name.trim(),
      restaurantId
    } 
  });
  revalidatePath('/dashboard/menu');
}

export async function updateCategory(id: string, name: string) {
  if (!name.trim()) throw new Error('Category name required');
  const restaurantId = await getActiveRestaurantId()
  
  const existing = await prisma.menuCategory.findFirst({
    where: {
      id: { not: id },
      name: name.trim(),
      restaurantId: restaurantId!
    }
  })
  if (existing) throw new Error('Another category with this name already exists.')

  await prisma.menuCategory.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath('/dashboard/menu');
}

export async function deleteCategory(id: string) {
  const items = await prisma.menuItem.count({ where: { categoryId: id } });
  if (items > 0) throw new Error('Cannot delete category with items assigned. Delete or move the items first.');
  await prisma.menuCategory.delete({ where: { id } });
  revalidatePath('/dashboard/menu');
}

export async function saveRecipe(menuItemId: string, recipeItems: Array<{ inventoryItemId: string, quantityUsed: number }>) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  await prisma.$transaction(async (tx) => {
    // Upsert the Recipe itself
    const recipe = await tx.recipe.upsert({
      where: { menuItemId },
      update: {},
      create: {
        menuItemId,
        restaurantId
      }
    })

    // Delete existing recipe items
    await tx.recipeItem.deleteMany({
      where: { recipeId: recipe.id }
    })

    // Create new recipe items
    if (recipeItems.length > 0) {
      await tx.recipeItem.createMany({
        data: recipeItems.map(item => ({
          recipeId: recipe.id,
          inventoryItemId: item.inventoryItemId,
          quantityUsed: item.quantityUsed,
          restaurantId
        }))
      })
    }
  })

  revalidatePath('/dashboard/menu')
}
