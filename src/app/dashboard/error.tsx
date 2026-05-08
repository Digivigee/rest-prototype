'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mb-6 shadow-xl shadow-rose-100/50 transform -rotate-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Oops! Something went wrong.</h2>
      <p className="mt-3 text-sm font-medium text-slate-500 max-w-md text-center leading-relaxed">
        We encountered an unexpected error while loading this page. 
        <br />
        <span className="text-xs text-rose-500 bg-rose-50 px-2 py-1 rounded mt-2 inline-block font-mono">
          {error.message || 'Unknown error'}
        </span>
      </p>
      <button
        onClick={() => reset()}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  )
}
