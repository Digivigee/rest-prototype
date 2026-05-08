'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import crypto from 'crypto'
import { canAddStaff } from '@/lib/billing'

export async function createInvite(email: string, roleId: string, targetRestaurantId?: string) {
  const session = await auth()
  if (!session?.user || (session.user as any).userType !== 'OWNER' && (session.user as any).userType !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const restaurantId = (session.user as any).restaurantId
  if (!restaurantId && (session.user as any).userType !== 'SUPER_ADMIN') {
    throw new Error('Restaurant context missing')
  }

  // Check plan limits
  if (restaurantId) {
    const allowed = await canAddStaff(restaurantId)
    if (!allowed) {
      throw new Error('You have reached the staff limit for your plan. Please upgrade to add more staff.')
    }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await prisma.invitation.create({
    data: {
      email,
      token,
      restaurantId: restaurantId || targetRestaurantId, // Super Admin needs to specify
      roleId,
      userType: 'STAFF',
      expiresAt
    }
  })

  // In a real app, send email here. For now, return the link.
  const joinLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/join/${token}`
  return { success: true, joinLink }
}
