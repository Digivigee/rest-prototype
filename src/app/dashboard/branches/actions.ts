'use server'

import { prisma } from '@/lib/prisma'
import { getActiveRestaurantId, setActiveBranchId } from '@/lib/saas'
import { revalidatePath } from 'next/cache'
import { isFeatureEnabled } from '@/lib/billing'

export async function getBranches() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return []
  return await prisma.branch.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createBranch(data: { name: string, location?: string }) {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) throw new Error('Restaurant not found')

  // Plan Check: Multi-branch is PRO only
  const isPro = await isFeatureEnabled(restaurantId, 'multi-branch')
  const existingBranches = await prisma.branch.count({ where: { restaurantId } })
  
  if (!isPro && existingBranches >= 1) {
    throw new Error('Multi-branch support is only available on the PRO plan.')
  }

  const branch = await prisma.branch.create({
    data: {
      ...data,
      restaurantId
    }
  })

  revalidatePath('/dashboard/branches')
  return branch
}

export async function switchBranch(branchId: string | null) {
  await setActiveBranchId(branchId)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBranch(id: string) {
  await prisma.branch.delete({ where: { id } })
  revalidatePath('/dashboard/branches')
  return { success: true }
}
