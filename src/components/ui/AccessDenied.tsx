'use client'

import { useSession } from 'next-auth/react'
import { ShieldOff } from 'lucide-react'
import Link from 'next/link'
import { ROLE_PERMISSIONS, Role } from '@/lib/roles'

export default function AccessDenied({ requiredRoles }: { requiredRoles?: string[] }) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as Role
  const firstPage = role ? (ROLE_PERMISSIONS[role]?.[0] ?? '/dashboard') : '/dashboard'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="bg-rose-50 p-5 rounded-full mb-5 ring-8 ring-rose-50/50">
        <ShieldOff className="w-10 h-10 text-rose-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Access Denied</h2>
      <p className="text-slate-500 text-sm max-w-xs font-medium mb-2">
        Your current role <span className="font-black text-slate-700">({role ?? 'Guest'})</span> does not have permission to view this page.
      </p>
      {requiredRoles && (
        <p className="text-xs text-slate-400 mb-6">Requires: {requiredRoles.join(', ')}</p>
      )}
      <Link href={firstPage} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md">
        Go to my dashboard
      </Link>
    </div>
  )
}
