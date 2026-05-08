import { getAnalyticsData } from './actions'
import { getActiveRestaurantId } from '@/lib/saas'
import { isFeatureEnabled } from '@/lib/billing'
import AnalyticsClient from './AnalyticsClient'
import Link from 'next/link'
import { Zap, Lock, BarChart3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return null

  const isPro = await isFeatureEnabled(restaurantId, 'analytics')

  if (!isPro) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100/50">
          <BarChart3 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Advanced Insights</h1>
        <p className="text-slate-500 max-w-md font-medium leading-relaxed mb-10">
          Unlock peak hour analysis, staff performance leaderboards, and real-time profit tracking by upgrading to the PRO plan.
        </p>
        <Link 
          href="/dashboard/billing"
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
        >
          <Zap className="w-4 h-4 fill-white" /> Upgrade to PRO Now
        </Link>
      </div>
    )
  }

  const data = await getAnalyticsData()
  if (!data) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
        <p className="text-slate-500 mt-1 font-medium">Deep dive into your restaurant's operational and financial data.</p>
      </div>

      <AnalyticsClient data={data} />
    </div>
  )
}
