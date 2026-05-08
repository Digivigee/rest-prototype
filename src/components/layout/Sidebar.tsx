'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, LayoutGrid, ClipboardList,
  ChefHat, Receipt, Package, Users, BarChart3, Settings, Banknote, UserCircle, Clock,
  Building2, Store, Zap, ChevronDown, Shield, Activity, BarChart, X
} from 'lucide-react'
import { canAccess } from '@/lib/roles'
import { CONFIG } from '@/lib/config'

const navGroups = [
  {
    title: 'Admin Center',
    items: [
      { name: 'Overview', href: '/dashboard/admin', icon: Activity },
      { name: 'Restaurants', href: '/dashboard/admin/restaurants', icon: Building2 },
      { name: 'System Logs', href: '/dashboard/admin/logs', icon: Shield },
    ]
  },
  {
    title: 'General',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed },
      { name: 'Tables', href: '/dashboard/tables', icon: LayoutGrid },
      { name: 'Branches', href: '/dashboard/branches', icon: Building2 },
      { name: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
      { name: 'Kitchen', href: '/dashboard/kitchen', icon: ChefHat },
      { name: 'Billing', href: '/dashboard/billing', icon: Receipt },
      { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    ]
  },
  {
    title: 'Staff Management',
    items: [
      { name: 'Staff List', href: '/dashboard/staff', icon: Users },
      { name: 'Attendance', href: '/dashboard/attendance', icon: Clock },
      { name: 'Salary', href: '/dashboard/salary', icon: Banknote },
      { name: 'Staff Reports', href: '/dashboard/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Personal',
    items: [
      { name: 'My Profile', href: '/dashboard/me', icon: UserCircle },
      { name: 'Subscription', href: '/dashboard/subscription', icon: Zap },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]
  }
]

export default function Sidebar({ 
  restaurants = [], 
  activeId = '',
  branches = [],
  activeBranchId = '',
  logoUrl = '',
  themeColor = '',
  userName = '',
  userRole = '',
  onCloseMobile
}: { 
  restaurants?: any[], 
  activeId?: string,
  branches?: any[],
  activeBranchId?: string | null,
  logoUrl?: string | null,
  themeColor?: string | null,
  userName?: string,
  userRole?: string,
  onCloseMobile?: () => void
}) {
  const pathname = usePathname()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleSwitch = async (id: string) => {
    setIsSwitching(true)
    await (await import('@/app/dashboard/saas-actions')).switchRestaurant(id)
    setIsSwitching(false)
  }

  const handleBranchSwitch = async (id: string) => {
    setIsSwitching(true)
    await (await import('@/app/dashboard/branches/actions')).switchBranch(id === 'all' ? null : id)
    setIsSwitching(false)
  }

  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col flex-shrink-0 shadow-sm transition-all duration-300">
      <div className="h-auto flex flex-col p-6 border-b space-y-6 relative">
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Zap className="w-6 h-6 fill-white" />
            )}
          </div>
          <div className="overflow-hidden">
            <h1 className="font-black text-slate-900 tracking-tighter text-lg leading-tight truncate">{CONFIG.RESTAURANT_NAME}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Management Pro</p>
          </div>
        </div>

        <div className="space-y-2">
          {restaurants.length > 0 && (
            <div className="relative group">
              <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors pointer-events-none" />
              <select 
                value={activeId}
                onChange={(e) => handleSwitch(e.target.value)}
                disabled={isSwitching}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-black text-slate-700 outline-none hover:bg-white hover:border-indigo-100 transition-all cursor-pointer appearance-none shadow-sm shadow-slate-100/50"
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {branches.length > 0 && (
            <div className="relative group">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[var(--brand-primary)] transition-colors pointer-events-none" />
              <select 
                value={activeBranchId || 'all'}
                onChange={(e) => handleBranchSwitch(e.target.value)}
                disabled={isSwitching}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-black text-[var(--brand-primary)] outline-none hover:bg-white hover:border-indigo-100 transition-all cursor-pointer appearance-none shadow-sm shadow-slate-100/50"
              >
                <option value="all">Global (All Branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-8 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = userRole
            ? group.items.filter(item => canAccess(userRole as any, item.href))
            : group.items

          if (visibleItems.length === 0) return null

          return (
            <div key={group.title} className="space-y-2">
              <h4 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.title}</h4>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'text-white shadow-lg shadow-indigo-200 font-bold scale-[1.02]'
                          : 'text-slate-600 hover:text-[var(--brand-primary)] hover:bg-indigo-50/80'
                      }`}
                      style={isActive ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User indicator at bottom */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[var(--brand-primary)] font-black text-xs">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-800 truncate">{userName}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{userRole}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
