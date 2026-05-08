export type PlanType = 'FREE' | 'BASIC' | 'PRO'

export interface PlanLimits {
  maxTables: number
  maxStaff: number
  features: string[]
}

export const PLANS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxTables: 5,
    maxStaff: 3,
    features: ['menu', 'orders', 'inventory']
  },
  BASIC: {
    maxTables: 100, // Effectively unlimited for most
    maxStaff: 50,
    features: ['menu', 'orders', 'inventory', 'attendance', 'salary']
  },
  PRO: {
    maxTables: 1000,
    maxStaff: 500,
    features: ['menu', 'orders', 'inventory', 'attendance', 'salary', 'analytics', 'multi-branch', 'branding', 'priority-support']
  }
}

export const PLAN_PRICES = {
  FREE: 0,
  BASIC: 2999, // Monthly in INR
  PRO: 7999    // Monthly in INR
}
