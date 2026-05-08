'use server'

import { prisma } from '@/lib/prisma'
import { setActiveRestaurantId } from '@/lib/saas'
import { revalidatePath } from 'next/cache'

export async function getRestaurants() {
  return await prisma.restaurant.findMany()
}

export async function switchRestaurant(id: string) {
  await setActiveRestaurantId(id)
  revalidatePath('/')
}
