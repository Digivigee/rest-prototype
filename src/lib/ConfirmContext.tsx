'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts)
      setResolveFn(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleClose = (value: boolean) => {
    setIsOpen(false)
    if (resolveFn) resolveFn(value)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b border-slate-100 flex items-start gap-4 ${options.isDangerous ? 'bg-rose-50/50' : 'bg-slate-50/50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${options.isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{options.title}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{options.message}</p>
              </div>
            </div>
            <div className="p-4 bg-white flex justify-end gap-3">
              <button 
                onClick={() => handleClose(false)} 
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button 
                onClick={() => handleClose(true)} 
                className={`px-4 py-2.5 text-sm font-black text-white rounded-lg transition-colors shadow-sm ${
                  options.isDangerous ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return context
}
