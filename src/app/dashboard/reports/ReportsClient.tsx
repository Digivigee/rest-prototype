'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  TrendingUp, ShoppingBag, ClipboardList, CreditCard,
  LayoutGrid, AlertTriangle, Download, BarChart3, Calendar
} from 'lucide-react'
import { CONFIG, formatCurrency } from '@/lib/config'

type Props = {
  bills: any[]
  orders: any[]
  orderItems: any[]
  tableOrders: any[]
  lowStock: any[]
  inventoryUsage: any[]
  fromDate: string
  toDate: string
}

// --- CSV export helper ---
function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// --- Simple inline bar chart component ---
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function ReportsClient({ bills, orders, orderItems, tableOrders, lowStock, inventoryUsage, fromDate, toDate }: Props) {
  const router = useRouter()
  const [from, setFrom] = useState(fromDate)
  const [to, setTo] = useState(toDate)

  const applyFilter = () => {
    router.push(`/dashboard/reports?from=${from}&to=${to}`)
  }

  // --- Compute daily sales ---
  const salesByDay = bills.reduce((acc: Record<string, number>, b) => {
    const day = new Date(b.createdAt).toLocaleDateString('en-CA') // YYYY-MM-DD
    acc[day] = (acc[day] || 0) + b.total
    return acc
  }, {})
  const salesRows = Object.entries(salesByDay).sort(([a], [b]) => a.localeCompare(b))
  const totalRevenue = bills.reduce((s, b) => s + b.total, 0)
  const totalTax = bills.reduce((s, b) => s + b.tax, 0)
  const totalDiscount = bills.reduce((s, b) => s + b.discount, 0)

  // --- Top selling items ---
  const itemTotals = orderItems.reduce((acc: Record<string, { name: string; qty: number; rev: number }>, item) => {
    const key = item.menuItemId
    if (!acc[key]) acc[key] = { name: item.menuItem.name, qty: 0, rev: 0 }
    acc[key].qty += item.quantity
    acc[key].rev += item.quantity * item.priceAtTime
    return acc
  }, {})
  const topItems = Object.values(itemTotals).sort((a, b) => b.qty - a.qty).slice(0, 10)
  const maxItemQty = Math.max(...topItems.map(i => i.qty), 1)

  // --- Profit Calculation (COGS) ---
  const totalCOGS = orderItems.reduce((acc, item) => acc + (item.quantity * (item.menuItem.costPrice || 0)), 0)
  const grossProfit = totalRevenue - totalCOGS

  // --- Staff Performance ---
  const staffStats = orders.reduce((acc: Record<string, { name: string; orders: number; rev: number }>, o) => {
    if (o.status === 'CANCELLED') return acc;
    const key = o.user?.name || 'System / Kiosk'
    if (!acc[key]) acc[key] = { name: key, orders: 0, rev: 0 }
    acc[key].orders++
    acc[key].rev += (o.totalAmount || 0)
    return acc
  }, {})
  const staffRows = Object.values(staffStats).sort((a, b) => b.rev - a.rev)
  const maxStaffRev = Math.max(...staffRows.map(s => s.rev), 1)

  // --- Inventory Usage ---
  const usageStats = inventoryUsage.reduce((acc: Record<string, { name: string; unit: string; qty: number; cost: number }>, tx) => {
    const key = tx.inventoryItem.name
    if (!acc[key]) acc[key] = { name: key, unit: tx.inventoryItem.unit, qty: 0, cost: 0 }
    acc[key].qty += tx.quantity
    acc[key].cost += tx.quantity * (tx.inventoryItem.costPerUnit || 0)
    return acc
  }, {})
  const usageRows = Object.values(usageStats).sort((a, b) => b.cost - a.cost).slice(0, 10)
  const maxUsageCost = Math.max(...usageRows.map(u => u.cost), 1)

  // --- Orders by status ---
  const statusCount = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const statusColors: Record<string, string> = {
    PENDING: 'text-slate-600 bg-slate-100', CONFIRMED: 'text-blue-700 bg-blue-100',
    PREPARING: 'text-indigo-700 bg-indigo-100', READY: 'text-purple-700 bg-purple-100',
    SERVED: 'text-emerald-700 bg-emerald-100', CANCELLED: 'text-rose-700 bg-rose-100',
  }
  const barColors: Record<string, string> = {
    PENDING: 'bg-slate-400', CONFIRMED: 'bg-blue-500', PREPARING: 'bg-indigo-500',
    READY: 'bg-purple-500', SERVED: 'bg-emerald-500', CANCELLED: 'bg-rose-500',
  }
  const maxStatusCount = Math.max(...Object.values(statusCount), 1)

  // --- Payment method summary ---
  const allPayments = bills.flatMap(b => b.payments)
  const methodTotals = allPayments.reduce((acc: Record<string, { count: number; amount: number }>, p) => {
    if (!acc[p.method]) acc[p.method] = { count: 0, amount: 0 }
    acc[p.method].count++
    acc[p.method].amount += p.amount
    return acc
  }, {})
  const methodColors: Record<string, string> = {
    CASH: 'bg-emerald-500', CARD: 'bg-blue-500', UPI: 'bg-indigo-500', MIXED: 'bg-purple-500'
  }
  const maxMethodAmt = Math.max(...Object.values(methodTotals).map(m => m.amount), 1)

  // --- Table utilization ---
  const tableUtil = tableOrders.reduce((acc: Record<string, { number: string; count: number }>, o) => {
    const key = o.tableId || 'takeaway'
    if (!acc[key]) acc[key] = { number: o.table?.number || 'Takeaway', count: 0 }
    acc[key].count++
    return acc
  }, {})
  const tableRows = Object.values(tableUtil).sort((a, b) => b.count - a.count)
  const maxTableCount = Math.max(...tableRows.map(r => r.count), 1)

  // --- CSV export for daily sales ---
  const exportSalesCSV = () => {
    const rows = [
      ['Date', 'Revenue ($)'],
      ...salesRows.map(([day, total]) => [day, total.toFixed(2)])
    ]
    downloadCSV(`sales_report_${from}_to_${to}.csv`, rows)
  }

  const SectionCard = ({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="font-black text-slate-800 flex items-center gap-2 text-base">{icon} {title}</h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="py-10 text-center text-slate-400 text-sm font-bold">{msg}</div>
  )

  return (
    <div className="space-y-6">
      {/* Header + Date filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-500" /> Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time insights from your restaurant data.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="text-sm font-bold text-slate-700 border-0 outline-none bg-transparent" />
          <span className="text-slate-400 font-bold">→</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="text-sm font-bold text-slate-700 border-0 outline-none bg-transparent" />
          <button onClick={applyFilter} className="px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            Apply
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Profit', value: formatCurrency(grossProfit), icon: <TrendingUp className="w-5 h-5"/>, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <CreditCard className="w-5 h-5"/>, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Orders', value: orders.length, icon: <ClipboardList className="w-5 h-5"/>, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Low Stock Items', value: lowStock.length, icon: <AlertTriangle className="w-5 h-5"/>, color: 'text-amber-600 bg-amber-50' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className="text-2xl font-black text-slate-900">{c.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{c.label}</p>
          </div>
        ))}
      </div>

      {/* 1. Daily Sales */}
      <SectionCard
        title="Daily Sales"
        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
        action={
          <button onClick={exportSalesCSV} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      >
        {salesRows.length === 0 ? (
          <EmptyState msg="No paid bills in this date range." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-100">
                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest pl-6 hidden sm:table-cell">Share</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {salesRows.map(([day, total]) => (
                  <tr key={day}>
                    <td className="py-3 font-bold text-slate-700 text-sm">{new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="py-3 font-black text-emerald-600 text-sm text-right">{formatCurrency(total)}</td>
                    <td className="py-3 pl-6 w-48 hidden sm:table-cell">
                      <MiniBar value={total} max={totalRevenue} color="bg-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-slate-200">
                <td className="pt-3 font-black text-slate-800">Total</td>
                <td className="pt-3 font-black text-emerald-700 text-right">{formatCurrency(totalRevenue)}</td>
                <td className="hidden sm:table-cell" />
              </tr></tfoot>
            </table>
          </div>
        )}
      </SectionCard>

      {/* 2 + 3 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Top Selling Items */}
        <SectionCard title="Top Selling Items" icon={<ShoppingBag className="w-4 h-4 text-indigo-500" />}>
          {topItems.length === 0 ? (
            <EmptyState msg="No sales data in this range." />
          ) : (
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400 w-5">#{i + 1}</span>
                      <span className="text-sm font-bold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-800">{item.qty} sold</span>
                      <span className="text-xs text-slate-400 ml-2 font-bold">{formatCurrency(item.rev)}</span>
                    </div>
                  </div>
                  <MiniBar value={item.qty} max={maxItemQty} color="bg-indigo-500" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 3. Orders by Status */}
        <SectionCard title="Orders by Status" icon={<ClipboardList className="w-4 h-4 text-blue-500" />}>
          {Object.keys(statusCount).length === 0 ? (
            <EmptyState msg="No orders in this date range." />
          ) : (
            <div className="space-y-4">
              {Object.entries(statusCount).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
                    <span className="text-sm font-black text-slate-800">{count} orders</span>
                  </div>
                  <MiniBar value={count} max={maxStatusCount} color={barColors[status] || 'bg-slate-400'} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 4 + 5 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Staff Performance */}
        <SectionCard title="Staff Performance" icon={<ClipboardList className="w-4 h-4 text-emerald-500" />}>
          {staffRows.length === 0 ? (
            <EmptyState msg="No staff orders in this range." />
          ) : (
            <div className="space-y-4">
              {staffRows.map(staff => (
                <div key={staff.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600">{formatCurrency(staff.rev)}</span>
                      <span className="text-xs text-slate-400 font-bold ml-2">({staff.orders} orders)</span>
                    </div>
                  </div>
                  <MiniBar value={staff.rev} max={maxStaffRev} color="bg-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 5. Inventory Usage (Cost) */}
        <SectionCard title="Inventory Usage (Cost)" icon={<TrendingUp className="w-4 h-4 text-rose-500" />}>
          {usageRows.length === 0 ? (
            <EmptyState msg="No inventory used in this range." />
          ) : (
            <div className="space-y-4">
              {usageRows.map(u => (
                <div key={u.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-slate-800">{u.name} <span className="text-xs text-slate-400">({u.qty.toFixed(2)}{u.unit})</span></span>
                    <span className="text-sm font-black text-rose-600">{formatCurrency(u.cost)}</span>
                  </div>
                  <MiniBar value={u.cost} max={maxUsageCost} color="bg-rose-500" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 6 + 7 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6. Payment Method Summary */}
        <SectionCard title="Payment Methods" icon={<CreditCard className="w-4 h-4 text-purple-500" />}>
          {Object.keys(methodTotals).length === 0 ? (
            <EmptyState msg="No payments recorded in this range." />
          ) : (
            <div className="space-y-4">
              {Object.entries(methodTotals).sort((a, b) => b[1].amount - a[1].amount).map(([method, { count, amount }]) => (
                <div key={method}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${methodColors[method] || 'bg-slate-400'}`} />
                      <span className="text-sm font-bold text-slate-700">{method}</span>
                      <span className="text-xs text-slate-400 font-bold">({count} txns)</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{formatCurrency(amount)}</span>
                  </div>
                  <MiniBar value={amount} max={maxMethodAmt} color={methodColors[method] || 'bg-slate-400'} />
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-sm font-black text-slate-700">Total Collected</span>
                <span className="text-sm font-black text-emerald-600">
                  {formatCurrency(Object.values(methodTotals).reduce((s, m) => s + m.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* 5. Table Utilization */}
        <SectionCard title="Table Utilization" icon={<LayoutGrid className="w-4 h-4 text-orange-500" />}>
          {tableRows.length === 0 ? (
            <EmptyState msg="No orders placed in this range." />
          ) : (
            <div className="space-y-4">
              {tableRows.map(t => (
                <div key={t.number}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-slate-800">Table {t.number}</span>
                    <span className="text-sm font-black text-slate-700">{t.count} order{t.count !== 1 ? 's' : ''}</span>
                  </div>
                  <MiniBar value={t.count} max={maxTableCount} color="bg-orange-400" />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        {/* 7. Profit Summary */}
        <SectionCard title="Profit Summary" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Total Revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-rose-600">
              <span>Cost of Goods Sold (COGS)</span>
              <span>-{formatCurrency(totalCOGS)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Total Tax Collected</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Total Discounts Given</span>
              <span>{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>Gross Profit</span>
              <span className="text-emerald-600">{formatCurrency(grossProfit)}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 8. Low Stock Report */}
      <SectionCard title="Low Stock Alert" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
        {lowStock.length === 0 ? (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-emerald-700 font-black text-sm mb-1">All items are well stocked!</p>
            <p className="text-slate-400 text-xs font-medium">No inventory items are below the minimum threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-100">
                {['Item', 'Unit', 'In Stock', 'Min Level', 'Deficit', 'Supplier'].map(h => (
                  <th key={h} className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest pr-6">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {lowStock.map(item => (
                  <tr key={item.id} className="bg-amber-50/30">
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-6 text-sm font-bold text-slate-500">{item.unit}</td>
                    <td className="py-3 pr-6 text-sm font-black text-rose-600">{item.quantity}</td>
                    <td className="py-3 pr-6 text-sm font-bold text-slate-500">{item.minThreshold}</td>
                    <td className="py-3 pr-6 text-sm font-black text-amber-700">
                      -{(item.minThreshold - item.quantity).toFixed(2)}
                    </td>
                    <td className="py-3 text-sm text-slate-400 font-medium">{item.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
