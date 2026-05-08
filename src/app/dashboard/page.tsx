import { prisma } from '@/lib/prisma';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { ShoppingBag, Utensils, ChefHat, AlertTriangle, Plus, FileText, ArrowRight, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CONFIG, formatCurrency } from '@/lib/config';
import { getActiveRestaurantId } from '@/lib/saas';

import { OrderService } from '@/services/order.service';

export const dynamic = 'force-dynamic';

export default async function DashboardIndex() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeId = await getActiveRestaurantId();
  if (!activeId) return null;

  const activeRestaurant = await prisma.restaurant.findUnique({
    where: { id: activeId },
    select: { name: true, slug: true }
  });
  
  const displayName = activeRestaurant?.name || CONFIG.RESTAURANT_NAME;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all KPI metrics concurrently
  const [
    todaySalesAgg,
    activeOrdersList,
    occupiedTablesAgg,
    pendingKitchen,
    inventoryItems,
    monthlySales,
  ] = await Promise.all([
    prisma.bill.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today } }
    }),
    OrderService.getActiveOrders(activeId),
    prisma.table.count({
      where: { status: 'OCCUPIED' }
    }),
    prisma.kitchenTicket.count({
      where: { status: 'PENDING' }
    }),
    prisma.inventoryItem.findMany(),
    prisma.bill.findMany({
      where: { 
        createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
        status: 'PAID'
      },
      select: { total: true, createdAt: true }
    })
  ]);

  const activeOrders = activeOrdersList.length;
  const recentOrders = activeOrdersList.slice(0, 6);

  const todaySales = todaySalesAgg._sum.total || 0;
  const lowStockCount = inventoryItems.filter((item: any) => item.currentStock <= item.minStockLevel).length;

  // Process sales for chart (last 7 days)
  const salesByDay = Array(7).fill(0);
  monthlySales.forEach(bill => {
    const dayIndex = Math.floor((new Date().getTime() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) {
      salesByDay[6 - dayIndex] += bill.total;
    }
  });

  const maxSales = Math.max(...salesByDay, 1);
  const chartData = salesByDay.map(s => (s / maxSales) * 100);

  const quickActions = [
    { name: 'New Order', href: '/dashboard/orders', icon: <Plus className="w-5 h-5"/>, color: 'bg-blue-50 text-blue-600' },
    { name: 'Add Menu Item', href: '/dashboard/menu', icon: <Utensils className="w-5 h-5"/>, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Generate Bill', href: '/dashboard/billing', icon: <FileText className="w-5 h-5"/>, color: 'bg-purple-50 text-purple-600' },
    { name: 'View Kitchen', href: '/dashboard/kitchen', icon: <ChefHat className="w-5 h-5"/>, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-200/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[5%] right-[-5%] w-[30%] h-[30%] bg-purple-200/20 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight lowercase">{displayName.replace(' ', '')}</h1>
            <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-tighter rounded-md flex items-center gap-1 border border-emerald-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Live
            </div>
            {activeRestaurant?.slug && (
              <Link 
                href={`/p/${activeRestaurant.slug}`} 
                target="_blank"
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline ml-2"
              >
                View Public Page <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <p className="text-slate-500 mt-2 font-medium">Control center for your premium Indian dining experience.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard 
          title="Today's Sales" 
          value={formatCurrency(todaySales)} 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          trend="↑ 12% vs last week"
        />
        <DashboardCard 
          title="Active Orders" 
          value={activeOrders} 
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />} 
        />
        <DashboardCard 
          title="Occupied Tables" 
          value={occupiedTablesAgg} 
          icon={<Utensils className="w-5 h-5 text-rose-600" />} 
        />
        <DashboardCard 
          title="Pending Tickets" 
          value={pendingKitchen} 
          icon={<ChefHat className="w-5 h-5 text-amber-600" />} 
        />
        <DashboardCard 
          title="Low Stock" 
          value={lowStockCount} 
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />} 
          trend={lowStockCount > 0 ? "⚠️ Immediate attention" : "All healthy"}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-6 shadow-indigo-100/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-indigo-600 rounded-full" /> Sales Summary
              </h3>
            </div>
            <div className="h-64 w-full bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent" />
              <div className="text-center relative z-10">
                <BarChartVisualizer data={chartData} />
                <p className="text-slate-400 mt-6 text-xs font-black uppercase tracking-widest opacity-60">Revenue Performance Tracking</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
              <Link href="/dashboard/orders" className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">No orders have been placed yet today.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOrders.map((order: any) => (
                  <li key={order.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mr-4">
                        {order.table?.number || 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Order #{order.id.slice(-5).toUpperCase()}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{order.items.length} items • {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'SERVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-8">
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-6 shadow-indigo-100/20">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded-full" /> Quick Entry
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href} 
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 transition-all group bg-white shadow-sm">
                  <div className={`p-3.5 rounded-2xl mb-3 shadow-inner ${action.color} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-black text-slate-700 text-center uppercase tracking-tighter">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
            <p className="text-sm text-indigo-100 mb-4 opacity-90">
              Keep an eye on the low stock alerts. You have {lowStockCount} items that need restocking soon!
            </p>
            <Link href="/dashboard/inventory" className="text-sm font-semibold bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors inline-block">
              Check Inventory
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

function BarChartVisualizer({ data }: { data: number[] }) {
  return (
    <div className="flex items-end justify-center space-x-2 h-24">
      {data.map((h, i) => (
        <div key={i} className="w-8 bg-indigo-200 rounded-t-sm" style={{ height: `${h}%` }}>
          <div className="w-full bg-indigo-500 rounded-t-sm transition-all hover:opacity-80" style={{ height: `100%` }}></div>
        </div>
      ))}
    </div>
  )
}
