// Role permission definitions for the demo prototype

export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER' | 'OWNER' | 'SUPER_ADMIN'

export interface NavItem {
  name: string
  href: string
  icon: string
}

export const ALL_NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Menu', href: '/dashboard/menu', icon: 'UtensilsCrossed' },
  { name: 'Tables', href: '/dashboard/tables', icon: 'LayoutGrid' },
  { name: 'Branches', href: '/dashboard/branches', icon: 'Building2' },
  { name: 'Orders', href: '/dashboard/orders', icon: 'ClipboardList' },
  { name: 'Kitchen', href: '/dashboard/kitchen', icon: 'ChefHat' },
  { name: 'Billing', href: '/dashboard/billing', icon: 'Receipt' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: 'Package' },
  { name: 'Staff', href: '/dashboard/staff', icon: 'Users' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: 'Clock' },
  { name: 'Salary', href: '/dashboard/salary', icon: 'Banknote' },
  { name: 'My Profile', href: '/dashboard/me', icon: 'UserCircle' },
  { name: 'Reports', href: '/dashboard/reports', icon: 'BarChart3' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
]

// Which hrefs each role is allowed to access
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: [
    '/dashboard',
    '/dashboard/menu',
    '/dashboard/tables',
    '/dashboard/branches',
    '/dashboard/orders',
    '/dashboard/kitchen',
    '/dashboard/billing',
    '/dashboard/inventory',
    '/dashboard/staff',
    '/dashboard/attendance',
    '/dashboard/salary',
    '/dashboard/me',
    '/dashboard/reports',
    '/dashboard/settings',
  ],
  MANAGER: [
    '/dashboard',
    '/dashboard/menu',
    '/dashboard/tables',
    '/dashboard/orders',
    '/dashboard/inventory',
    '/dashboard/attendance',
    '/dashboard/salary',
    '/dashboard/me',
    '/dashboard/reports',
    '/dashboard/settings',
  ],
  WAITER: [
    '/dashboard/tables',
    '/dashboard/orders',
    '/dashboard/attendance',
    '/dashboard/me',
  ],
  KITCHEN: [
    '/dashboard/kitchen',
    '/dashboard/attendance',
    '/dashboard/me',
  ],
  CASHIER: [
    '/dashboard/orders',
    '/dashboard/billing',
    '/dashboard/attendance',
    '/dashboard/me',
  ],
  OWNER: [
    '/dashboard',
    '/dashboard/menu',
    '/dashboard/tables',
    '/dashboard/branches',
    '/dashboard/orders',
    '/dashboard/kitchen',
    '/dashboard/billing',
    '/dashboard/inventory',
    '/dashboard/staff',
    '/dashboard/attendance',
    '/dashboard/salary',
    '/dashboard/me',
    '/dashboard/reports',
    '/dashboard/settings',
  ],
  SUPER_ADMIN: [
    '/dashboard',
    '/dashboard/menu',
    '/dashboard/tables',
    '/dashboard/branches',
    '/dashboard/admin',
    '/dashboard/admin/restaurants',
    '/dashboard/admin/logs',
    '/dashboard/orders',
    '/dashboard/kitchen',
    '/dashboard/billing',
    '/dashboard/inventory',
    '/dashboard/staff',
    '/dashboard/attendance',
    '/dashboard/salary',
    '/dashboard/me',
    '/dashboard/reports',
    '/dashboard/settings',
  ],
}

export const ROLE_META: Record<Role, { label: string; color: string; description: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-purple-600', description: 'Full access to all modules' },
  MANAGER: { label: 'Manager', color: 'bg-indigo-600', description: 'Dashboard, menu, tables, orders, inventory, reports' },
  WAITER: { label: 'Waiter', color: 'bg-blue-500', description: 'Tables and order taking only' },
  KITCHEN: { label: 'Kitchen', color: 'bg-orange-500', description: 'Kitchen display screen only' },
  CASHIER: { label: 'Cashier', color: 'bg-emerald-600', description: 'Orders and billing only' },
  OWNER: { label: 'Owner', color: 'bg-rose-600', description: 'Restaurant owner with full access' },
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-slate-900', description: 'System-wide administrative access' },
}

export function canAccess(role: Role, href: string): boolean {
  const allowed = ROLE_PERMISSIONS[role] || []
  return allowed.some(p => href === p || href.startsWith(p + '/'))
}
