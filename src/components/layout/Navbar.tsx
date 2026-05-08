'use client'

import { LogOut, Menu, Bell, Search } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function Navbar({ 
  userName = '', 
  userRole = '',
  onOpenMobile
}: { 
  userName?: string, 
  userRole?: string,
  onOpenMobile?: () => void 
}) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-sm border-slate-100">
      <div className="flex items-center gap-4 flex-1">
        {onOpenMobile && (
          <button onClick={onOpenMobile} className="md:hidden text-slate-500 hover:text-slate-700">
            <Menu className="h-6 w-6" />
          </button>
        )}
        
        <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full max-w-md group focus-within:border-indigo-300 transition-colors">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
          <input 
            type="text" 
            placeholder="Search orders, items, or staff..." 
            className="bg-transparent border-none outline-none text-sm px-2 w-full text-slate-600 placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6">
        <button className="relative text-slate-400 hover:text-indigo-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden xs:flex">
            <span className="text-sm font-black text-slate-800 leading-none">{userName}</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{userRole}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 group cursor-pointer hover:scale-105 transition-transform">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-400 hover:text-rose-500 transition-colors ml-2" 
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
