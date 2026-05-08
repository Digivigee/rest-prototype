
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/config'
import { Receipt, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function markAsPaid(billId: string) {
  'use server'
  await prisma.bill.update({
    where: { id: billId },
    data: { status: 'PAID' }
  })
  revalidatePath('/dashboard/billing')
}

export default async function CustomerBillingPage() {
  const bills = await prisma.bill.findMany({
    include: {
      order: {
        include: {
          table: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Bills</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage payments for customer orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Bill ID</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Table</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date/Time</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">#{bill.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-black text-xs border border-indigo-100">
                      Table {bill.order.table?.number || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{new Date(bill.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400">{new Date(bill.createdAt).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {bill.status === 'PAID' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {bill.status === 'UNPAID' && (
                      <form action={markAsPaid.bind(null, bill.id)}>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center ml-auto">
                          <Banknote className="w-3.5 h-3.5 mr-1.5" /> Mark Paid
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Receipt className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">No bills generated yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
