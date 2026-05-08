'use client'

import { useState } from 'react'
import { updateRestaurantStatus, updateRestaurantPlan } from '../actions'
import { MoreHorizontal, ShieldOff, ShieldCheck, Zap, CreditCard, Users, LayoutGrid, Search, Filter } from 'lucide-react'

export default function RestaurantManagementClient({ initialRestaurants }: { initialRestaurants: any[] }) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    if (confirm(`Are you sure you want to ${newStatus === 'BLOCKED' ? 'BLOCK' : 'UNBLOCK'} this restaurant?`)) {
      try {
        const updated = await updateRestaurantStatus(id, newStatus)
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r))
      } catch (e: any) {
        alert(e.message)
      }
    }
  }

  const handleChangePlan = async (id: string, currentPlan: string) => {
    const plans = ['FREE', 'BASIC', 'PRO']
    const nextPlan = plans[(plans.indexOf(currentPlan) + 1) % plans.length]
    
    if (confirm(`Change plan for this restaurant to ${nextPlan}?`)) {
      try {
        const updated = await updateRestaurantPlan(id, nextPlan)
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, planType: updated.planType } : r))
      } catch (e: any) {
        alert(e.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96 group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            placeholder="Search by name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
            <Filter className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{filtered.length} Restaurants Found</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Restaurant Info</th>
              <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan & Status</th>
              <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Stats</th>
              <th className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((res) => (
              <tr key={res.id} className={`hover:bg-slate-50/80 transition-colors ${res.status === 'BLOCKED' ? 'opacity-60 bg-slate-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                      {res.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{res.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-tight">Joined {new Date(res.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] font-mono text-indigo-400 mt-1 uppercase">ID: {res.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                        res.planType === 'PRO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        res.planType === 'BASIC' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {res.planType} Plan
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${res.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className={`text-[10px] font-black uppercase ${res.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {res.status}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Users className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                      <div className="text-[10px] font-black text-slate-700">{res._count.staffProfiles}</div>
                    </div>
                    <div className="text-center">
                      <LayoutGrid className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                      <div className="text-[10px] font-black text-slate-700">{res._count.tables}</div>
                    </div>
                    <div className="text-center">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                      <div className="text-[10px] font-black text-slate-700">{res._count.orders}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleChangePlan(res.id, res.planType)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                      title="Upgrade/Downgrade Plan"
                    >
                      <Zap className="w-4 h-4 fill-indigo-600" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(res.id, res.status)}
                      className={`p-2.5 rounded-xl transition-all ${
                        res.status === 'ACTIVE' 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                      title={res.status === 'ACTIVE' ? 'Block Restaurant' : 'Unblock Restaurant'}
                    >
                      {res.status === 'ACTIVE' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
