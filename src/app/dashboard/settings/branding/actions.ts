'use server'

import { prisma } from '@/lib/prisma'
import { getActiveRestaurantId } from '@/lib/saas'
import { revalidatePath } from 'next/cache'
import { isFeatureEnabled } from '@/lib/billing'

import { uploadImage } from '@/lib/cloudinary'

export async function getBrandingData() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  return await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { 
      logoUrl: true, 
      themeColor: true,
      planType: true
    }
  })
}

export async function uploadBrandingLogo(formData: FormData) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const file = formData.get('logo') as File
  if (!file) throw new Error('No file provided')

  // Convert File to base64 for Cloudinary
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

  const logoUrl = await uploadImage(base64Image, `${restaurantId}/branding`)
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { logoUrl }
  })

  revalidatePath('/dashboard')
  return logoUrl
}

export async function updateBranding(data: { themeColor?: string }) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data
  })

  revalidatePath('/dashboard')
  return updated
}
