'use server'

import { cookies } from 'next/headers'
import { auth } from '@/auth'

export async function initSessionCookies() {
  const session = await auth()
  if (!session?.user) return

  const cookieStore = await cookies()
  const userType = (session.user as any).userType
  const restaurantId = (session.user as any).restaurantId

  const isProd = process.env.NODE_ENV === 'production'
  cookieStore.set('user_type', userType, { path: '/', httpOnly: true, secure: isProd })
  if (restaurantId) {
    cookieStore.set('active_restaurant_id', restaurantId, { path: '/', httpOnly: true, secure: isProd })
  }
}
