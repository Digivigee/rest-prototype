'use client'

import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayoutClient({ 
  children, 
  sidebarProps, 
  navbarProps, 
  themeColor 
}: { 
  children: ReactNode,
  sidebarProps: any,
  navbarProps: any,
  themeColor: string | null
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div 
      className="flex bg-slate-50 min-h-screen text-slate-900 font-sans"
      style={themeColor ? { 
        '--brand-primary': themeColor, 
        '--brand-primary-hover': `${themeColor}dd` 
      } as React.CSSProperties : undefined}
    >
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          {...sidebarProps} 
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar 
          {...navbarProps} 
          onOpenMobile={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
