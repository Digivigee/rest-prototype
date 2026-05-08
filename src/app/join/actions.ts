'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function getInviteByToken(token: string) {
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { restaurant: true }
  })

  if (!invite) throw new Error('Invalid or expired invitation')
  if (invite.status !== 'PENDING') throw new Error('Invitation already used')
  if (invite.expiresAt < new Date()) throw new Error('Invitation expired')

  return invite
}

export async function joinRestaurant(token: string, data: any) {
  const { name, password } = data

  const invite = await getInviteByToken(token)
  const hashedPassword = await bcrypt.hash(password, 10)

  return await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name,
        email: invite.email,
        hashedPassword,
        userType: invite.userType,
        roleId: invite.roleId,
        restaurantId: invite.restaurantId
      }
    })

    // 2. Mark invite as accepted
    await tx.invitation.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' }
    })

    // 3. Create Staff Profile
    await tx.staffProfile.create({
      data: {
        userId: user.id,
        restaurantId: invite.restaurantId,
        salaryType: 'MONTHLY',
        isActive: true
      }
    })

    return { success: true }
  })
}
