import { cookies } from 'next/headers'
import { AsyncLocalStorage } from 'async_hooks'

const RESTAURANT_ID_COOKIE = 'active_restaurant_id'
const BRANCH_ID_COOKIE = 'active_branch_id'

export const tenantContext = new AsyncLocalStorage<{ 
  restaurantId: string | null; 
  branchId: string | null;
  userType: string 
}>()

export async function getActiveRestaurantId(): Promise<string | null> {
  const context = tenantContext.getStore()
  if (context?.restaurantId) return context.restaurantId

  try {
    const { auth } = await import('@/auth')
    const session = await auth()
    if (!session?.user) return null

    const userType = (session.user as any).userType
    const userRestId = (session.user as any).restaurantId

    // SUPER_ADMIN can switch contexts via cookie
    if (userType === 'SUPER_ADMIN') {
      const cookieStore = await cookies()
      const cookieVal = cookieStore.get(RESTAURANT_ID_COOKIE)?.value
      if (cookieVal) return cookieVal

      // Fallback: Get first restaurant if no cookie is set
      const { prisma } = await import('@/lib/prisma')
      const firstRest = await prisma.restaurant.findFirst()
      return firstRest?.id || null
    }

    // Regular users are locked to their assigned restaurant
    return userRestId || null
  } catch (e) {
    return null
  }
}

export async function getActiveBranchId(): Promise<string | null> {
  const context = tenantContext.getStore()
  if (context?.branchId) return context.branchId

  try {
    const { auth } = await import('@/auth')
    const session = await auth()
    if (!session?.user) return null

    const userType = (session.user as any).userType
    const userBranchId = (session.user as any).branchId

    // SUPER_ADMIN and OWNER can switch branches via cookie
    if (userType === 'SUPER_ADMIN' || userType === 'OWNER') {
      const cookieStore = await cookies()
      return cookieStore.get(BRANCH_ID_COOKIE)?.value || null
    }

    // STAFF are locked to their assigned branch
    return userBranchId || null
  } catch (e) {
    return null
  }
}

export async function getAuthUserType(): Promise<string> {
  const context = tenantContext.getStore()
  if (context?.userType) return context.userType

  try {
    const { auth } = await import('@/auth')
    const session = await auth()
    return (session?.user as any)?.userType || 'STAFF'
  } catch (e) {
    return 'STAFF'
  }
}

export async function setActiveRestaurantId(id: string) {
  try {
    const { auth } = await import('@/auth')
    const session = await auth()
    const userType = (session?.user as any)?.userType
    
    // Only SUPER_ADMIN is allowed to manually switch tenant cookies
    if (userType !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized to switch restaurant context')
    }

    const cookieStore = await cookies()
    cookieStore.set(RESTAURANT_ID_COOKIE, id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  } catch (e) {
    console.error('Failed to set restaurant ID cookie', e)
  }
}

export async function setActiveBranchId(id: string | null) {
  try {
    const { auth } = await import('@/auth')
    const session = await auth()
    const userType = (session?.user as any)?.userType
    
    // Only SUPER_ADMIN and OWNER can manually switch branch contexts
    if (userType !== 'SUPER_ADMIN' && userType !== 'OWNER') {
      throw new Error('Unauthorized to switch branch context')
    }

    const cookieStore = await cookies()
    if (id) {
      cookieStore.set(BRANCH_ID_COOKIE, id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      })
    } else {
      cookieStore.delete(BRANCH_ID_COOKIE)
    }
  } catch (e) {
    console.error('Failed to set branch ID cookie', e)
  }
}

export function runWithTenant<T>(
  restaurantId: string | null, 
  branchId: string | null, 
  fn: () => Promise<T>, 
  userType: string = 'STAFF'
): Promise<T> {
  return tenantContext.run({ restaurantId, branchId, userType }, fn)
}

export async function getAuthUserRole(): Promise<string> {
  // This is a placeholder, usually you'd get this from the session
  return 'ADMIN' 
}
