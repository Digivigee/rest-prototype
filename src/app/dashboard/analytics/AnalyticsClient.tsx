'use client'

import { TrendingUp, Users, Clock, ShoppingBag, ArrowUpRight, DollarSign, Percent } from 'lucide-react'

export default function AnalyticsClient({ data }: { data: any }) {
  const { peakHours, topItems, staffStats, financials } = data

  const maxPeak = Math.max(...peakHours)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
      {/* Financial Overview */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <DollarSign className="w-6 h-6" />
             </div>
             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">Revenue</span>
          </div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">₹{financials.totalRevenue.toLocaleString()}</h4>
          <p className="text-xs text-slate-400 font-medium mt-1">Last 30 days total</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <TrendingUp className="w-6 h-6" />
             </div>
             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">Gross Profit</span>
          </div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">₹{financials.totalProfit.toLocaleString()}</h4>
          <p className="text-xs text-slate-400 font-medium mt-1">Based on item cost prices</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <Percent className="w-6 h-6" />
             </div>
             <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-widest">Margin</span>
          </div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight">{financials.margin.toFixed(1)}%</h4>
          <p className="text-xs text-slate-400 font-medium mt-1">Average profit margin</p>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600" /> Peak Ordering Hours
        </h3>
        <div className="h-64 flex items-end justify-between gap-1">
          {peakHours.map((count: number, hour: number) => {
            const height = maxPeak > 0 ? (count / maxPeak) * 100 : 0
            return (
              <div key={hour} className="flex-1 group relative">
                <div 
                  className="w-full bg-slate-50 rounded-t-lg transition-all group-hover:bg-indigo-100 cursor-pointer" 
                  style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </div>
                </div>
                <div className="mt-4 text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter">
                  {hour % 4 === 0 ? `${hour}h` : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Items List */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-emerald-600" /> Best Selling Items
        </h3>
        <div className="space-y-6">
          {topItems.map((item: any, idx: number) => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} sold</p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-slate-900">₹{item.revenue.toLocaleString()}</p>
                 <p className="text-[10px] font-black text-emerald-600">₹{item.profit.toLocaleString()} Profit</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Performance */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600" /> Staff Performance Leaderboard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {staffStats.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
               No staff performance data available for this period.
            </div>
          ) : staffStats.map((staff: any) => (
            <div key={staff.name} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-sm mb-4">
                {staff.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <h4 className="font-bold text-slate-900">{staff.name}</h4>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Served</p>
                  <p className="text-lg font-black text-slate-900">{staff.count} <span className="text-xs text-slate-400">Orders</span></p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Revenue</p>
                   <p className="text-sm font-black text-slate-900">₹{staff.revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
