'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Flame, CheckCircle, Clock, AlertTriangle, ChefHat } from 'lucide-react'
import { advanceTicketStatus } from './actions'
import { useToast } from '@/lib/ToastContext'

type Ticket = any;

export default function KitchenClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const { showToast } = useToast()

  useEffect(() => {
    // 10 second Auto-refresh logic via client-side cache busting router
    const interval = setInterval(() => {
      setNow(Date.now())
      router.refresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [router])

  const handleAdvance = async (ticketId: string, currentStatus: string, orderId: string) => {
    setLoadingId(ticketId)
    try {
      await advanceTicketStatus(ticketId, currentStatus, orderId)
      showToast("Ticket status updated", "success")
    } catch (e: any) {
      showToast(e.message, "error")
    } finally {
      setLoadingId(null)
    }
  }

  if (initialTickets.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center pt-24 pb-12">
        <div className="bg-slate-800/80 p-8 rounded-full mb-6 ring-8 ring-slate-800/30">
          <ChefHat className="w-16 h-16 text-slate-400" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">Kitchen is clear</h2>
        <p className="text-slate-400 mt-2 font-bold text-lg">Waiting for waiters to dispatch tickets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center">
            <Flame className="w-8 h-8 mr-3 text-orange-500" /> Kitchen Display (KDS)
          </h1>
          <p className="text-slate-400 font-bold mt-1.5 uppercase tracking-widest text-xs">Live active order queue</p>
        </div>
        <div className="flex items-center space-x-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
           <span className="flex items-center text-sm font-bold text-emerald-400"><Clock className="w-4 h-4 mr-2 animate-pulse"/> Tracking Real-Time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {initialTickets.map((ticket) => {
          const orderTime = new Date(ticket.createdAt).getTime();
          const minsDiff = Math.floor((now - orderTime) / 60000);
          const isDelayed = minsDiff >= 15;
          const isPreparing = ticket.status === 'PREPARING';

          return (
            <div key={ticket.id} className={`flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 shadow-2xl ` + 
              (isDelayed 
                ? 'bg-[#2A0F15] border-rose-900/50 ring-2 ring-rose-500/30' 
                : isPreparing 
                  ? 'bg-slate-800/40 border-indigo-500/40 transform scale-[1.02]' 
                  : 'bg-slate-800/60 border-slate-700')}
            >
              <div className={`p-5 flex justify-between items-center ` + 
                (isDelayed ? 'bg-rose-900/30 border-b border-rose-900/50' : isPreparing ? 'bg-indigo-900/30 border-b border-indigo-900/50' : 'bg-slate-800/80 border-b border-slate-700')}>
                <div>
                  <h3 className="text-2xl font-black text-white leading-none">Table {ticket.order?.table?.number || '??'}</h3>
                  <p className={`text-xs font-black mt-2 flex items-center tracking-wider ` + (isDelayed ? 'text-rose-400' : 'text-slate-400')}>
                    {isDelayed && <AlertTriangle className="w-3 h-3 mr-1 animate-pulse"/>}
                    {minsDiff} MIN AGO
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-inner border border-transparent ` + 
                  (ticket.status === 'PREPARING' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-700 text-slate-300 border-slate-600')}>
                  {ticket.status === 'QUEUED' || ticket.status === 'PENDING' ? 'QUEUED' : ticket.status}
                </div>
              </div>

              <div className="flex-1 p-5 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                {ticket.order?.items.map((item: any) => (
                  <div key={item.id} className="border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start">
                      <span className="font-black text-xl text-white bg-slate-700/80 px-3.5 py-1.5 rounded-xl mr-4 min-w-[3rem] text-center shadow-inner border border-slate-600">
                        {item.quantity}
                      </span>
                      <div className="flex-1 pt-1">
                        <p className="font-extrabold text-slate-100 text-lg leading-tight">
                          {item.menuItem?.name || 'Deleted Item'}
                          {item.menuItem?.quantityInGrams && <span className="ml-2 text-xs text-slate-400 font-black">({item.menuItem.quantityInGrams}g)</span>}
                        </p>
                        {item.notes && (
                          <div className="mt-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black px-3 py-2.5 rounded-lg inline-block w-full uppercase tracking-wide">
                            <span className="text-amber-500/70 mr-1">NOTE:</span> {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900/50 border-t border-slate-700/80">
                <button 
                  disabled={loadingId === ticket.id}
                  onClick={() => handleAdvance(ticket.id, ticket.status, ticket.orderId)}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all focus:outline-none focus:ring-4 flex items-center justify-center ` + 
                    (ticket.status === 'READY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-600/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : ticket.status === 'PREPARING' 
                        ? 'bg-amber-500 hover:bg-amber-400 focus:ring-amber-500/50 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50')}
                >
                  {loadingId === ticket.id 
                    ? 'Updating...' 
                    : ticket.status === 'READY'
                      ? <><CheckCircle className="w-5 h-5 mr-2"/> Ready for Pickup</>
                      : ticket.status === 'PREPARING' 
                        ? <><Flame className="w-5 h-5 mr-2 animate-pulse"/> Mark Ready</> 
                        : 'Start Preparing'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
