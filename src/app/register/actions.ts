'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function registerRestaurant(data: any) {
  const { name, email, password, restaurantName } = data

  if (!name || !email || !password || !restaurantName) {
    throw new Error('Missing required fields')
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new Error('Email already registered')

  const hashedPassword = await bcrypt.hash(password, 10)

  // Get Owner role
  const ownerRole = await prisma.role.findFirst({
    where: { name: { contains: 'Owner' } }
  })

  if (!ownerRole) throw new Error('Owner role not found in database')

  return await prisma.$transaction(async (tx) => {
    // 1. Create Restaurant
    const restaurant = await tx.restaurant.create({
      data: {
        name: restaurantName,
        planType: 'FREE'
      }
    })

    // 2. Create User
    const user = await tx.user.create({
      data: {
        name,
        email,
        hashedPassword,
        userType: 'OWNER',
        roleId: ownerRole.id,
        restaurantId: restaurant.id
      }
    })

    // 3. Create Staff Profile for the owner
    await tx.staffProfile.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        salaryType: 'MONTHLY',
        isActive: true
      }
    })

    return { success: true }
  })
}
