import { getRestaurantPlan } from '@/lib/billing'
import { getActiveRestaurantId } from '@/lib/saas'
import { PLAN_PRICES, PLANS } from '@/lib/plans'
import { Check, ShieldCheck, Zap, Crown, AlertCircle } from 'lucide-react'
import { upgradePlan } from './actions'

export default async function BillingPage() {
  const restaurantId = await getActiveRestaurantId()
  if (!restaurantId) return <div>Restaurant not found</div>

  const info = await getRestaurantPlan(restaurantId)
  if (!info) return <div>Loading...</div>

  const plans = [
    {
      name: 'FREE',
      price: PLAN_PRICES.FREE,
      icon: <ShieldCheck className="w-6 h-6 text-slate-400" />,
      features: ['Up to 5 Tables', 'Up to 3 Staff', 'Menu Management', 'Standard Ordering'],
      color: 'border-slate-200',
      btnColor: 'bg-slate-100 text-slate-600',
      active: info.planType === 'FREE'
    },
    {
      name: 'BASIC',
      price: PLAN_PRICES.BASIC,
      icon: <Zap className="w-6 h-6 text-indigo-500" />,
      features: ['Up to 100 Tables', 'Up to 50 Staff', 'Attendance Tracking', 'Salary Management'],
      color: 'border-indigo-500 ring-2 ring-indigo-500/20',
      btnColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',
      active: info.planType === 'BASIC'
    },
    {
      name: 'PRO',
      price: PLAN_PRICES.PRO,
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      features: ['Unlimited Everything', 'Advanced Analytics', 'Multi-branch Support', 'Priority Support'],
      color: 'border-slate-200',
      btnColor: 'bg-slate-900 text-white',
      active: info.planType === 'PRO'
    }
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Subscription</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your plan and usage limits.</p>
      </div>

      {/* Current Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-800">{info.planType}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${info.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {info.status}
            </span>
          </div>
          {info.expiresAt && (
             <p className="text-xs text-slate-500 mt-2">Renews on {new Date(info.expiresAt).toLocaleDateString()}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Table Usage</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">{info.usage.tables} / {info.limits.maxTables}</span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500" style={{ width: `${(info.usage.tables / info.limits.maxTables) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Staff Usage</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">{info.usage.staff} / {info.limits.maxStaff}</span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-purple-500" style={{ width: `${(info.usage.staff / info.limits.maxStaff) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-white rounded-3xl p-8 border ${plan.color} relative overflow-hidden transition-all hover:translate-y-[-4px]`}>
            {plan.active && (
              <div className="absolute top-4 right-[-32px] rotate-45 bg-indigo-600 text-white text-[10px] font-black px-12 py-1 uppercase tracking-widest">
                Active
              </div>
            )}
            
            <div className="mb-6">
              <div className="mb-4">{plan.icon}</div>
              <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
                <span className="text-slate-500 text-sm ml-1 font-medium">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 min-h-[160px]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <form action={async () => {
              'use server'
              await upgradePlan(plan.name, 'MONTHLY')
            }}>
              <button 
                disabled={plan.active}
                className={`w-full py-4 rounded-2xl font-black transition-all ${plan.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.active ? 'Current Plan' : 'Select Plan'}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <h4 className="text-amber-900 font-bold mb-1">Developer Mode</h4>
          <p className="text-amber-800 text-sm opacity-80 leading-relaxed">
            Payment integration is currently mocked. Selecting a plan will immediately update your account status for testing purposes.
          </p>
        </div>
      </div>
    </div>
  )
}