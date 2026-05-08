import { Lock, Zap } from 'lucide-react'
import Link from 'next/link'

export default function FeatureLocked({ 
  featureName, 
  requiredPlan = 'BASIC' 
}: { 
  featureName: string, 
  requiredPlan?: string 
}) {
  return (
    <div className="relative min-h-[400px] flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      
      <div className="relative z-10 space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl shadow-indigo-100/50 text-indigo-600 mb-2 ring-1 ring-slate-100">
          <Lock className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{featureName} is Locked</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            This module is available on the <span className="text-indigo-600 font-black">{requiredPlan}</span> plan and above. Upgrade your subscription to access attendance, salary management, and more.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/dashboard/billing" 
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
          >
            <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            Upgrade to {requiredPlan}
          </Link>
          <Link 
            href="/dashboard" 
            className="text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            Go back to Dashboard
          </Link>
        </div>
      </div>

      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Zap className="w-32 h-32" />
      </div>
    </div>
  )
}
