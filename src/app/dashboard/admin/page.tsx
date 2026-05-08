import { getAdminStats, getTopRestaurants } from './actions'
import { Building2, CreditCard, Users, LayoutGrid, TrendingUp, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const stats = await getAdminStats()
  const topRestaurants = await getTopRestaurants()

  const cards = [
    { label: 'Total Restaurants', value: stats.totalRestaurants, icon: Building2, color: 'bg-indigo-600', trend: '+12%' },
    { label: 'Active Subscriptions', value: stats.activeSubs, icon: ShieldCheck, color: 'bg-emerald-600', trend: '+5%' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-600', trend: '+18%' },
    { label: 'System Staff', value: stats.totalStaff, icon: Users, color: 'bg-purple-600', trend: '+8%' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Platform-wide overview and system health.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform`} />
            <div className="relative z-10">
              <div className={`w-12 h-12 ${card.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100`}>
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> {card.trend} <span className="text-slate-400 font-medium">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900 tracking-tight">Top Performing Restaurants</h3>
            <Link href="/dashboard/admin/restaurants" className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant</th>
                  <th className="text-left px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="text-left px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Volume</th>
                  <th className="text-right px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topRestaurants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900">{res.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">ID: {res.id.slice(-8)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                        res.planType === 'PRO' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        res.planType === 'BASIC' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {res.planType}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-700">{res._count.orders} orders</td>
                    <td className="px-8 py-5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-indigo-100">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight mb-2">Platform Power-up</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              You are managing {stats.totalRestaurants} businesses. Ensure all restaurants follow the platform guidelines.
            </p>
          </div>
          <div className="relative z-10 mt-8 space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-widest opacity-80">Infrastructure</span>
                <span className="text-xs font-black">99.9%</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[99.9%]" />
              </div>
            </div>
            <Link href="/dashboard/admin/restaurants" className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">
              Manage Infrastructure
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
