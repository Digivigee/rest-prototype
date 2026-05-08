'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, ShoppingCart, Minus, Trash2, ArrowLeft, Coffee, Clock } from 'lucide-react'
import { createOrder, updateOrderStatus, generateBill } from './actions'
import { CONFIG, formatCurrency } from '@/lib/config'
import { useToast } from '@/lib/ToastContext'

type ViewMode = 'LIST' | 'NEW' | 'HISTORY';

export default function OrdersClient({ initialOrders, menuItems, categories, tables, staff }: any) {
  const [view, setView] = useState<ViewMode>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const [servingOrderId, setServingOrderId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const handleGenerateBill = async (orderId: string) => {
    if (!confirm('Are you sure you want to generate the bill and close this order?')) return;
    try {
      await generateBill(orderId);
      showToast('Bill generated and order closed', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    if (status === 'SERVED') {
      setServingOrderId(orderId);
      return;
    }
    try {
      await updateOrderStatus(orderId, status);
      showToast(`Order marked as ${status}`, 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  const handleFinalServe = async () => {
    if (!servingOrderId) return;
    try {
      await updateOrderStatus(servingOrderId, 'SERVED', selectedStaffId || undefined);
      showToast('Order served successfully', 'success');
      setServingOrderId(null);
      setSelectedStaffId('');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  }

  const availableTables = tables.filter((t: any) => t.status === 'AVAILABLE' || t.status === 'RESERVED');

  const filteredMenu = useMemo(() => {
    return menuItems.filter((i: any) => {
      const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCat === 'ALL' || i.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [menuItems, searchTerm, selectedCat]);

  const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

  const addToCart = (menuItem: any) => {
    const existing = cart.find(i => i.menuItemId === menuItem.id);
    if (existing) {
      setCart(cart.map(i => i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { 
        menuItemId: menuItem.id, 
        name: menuItem.name, 
        price: menuItem.price, 
        quantity: 1, 
        notes: '',
        quantityInGrams: menuItem.quantityInGrams 
      }]);
    }
  }

  const updateCartQty = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.menuItemId === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  }

  const updateNotes = (id: string, notes: string) => {
    setCart(cart.map(i => i.menuItemId === id ? { ...i, notes } : i));
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.menuItemId !== id));
  }

  const handleConfirmOrder = async () => {
    if (!selectedTable) return showToast("Please select a table", "warning");
    if (cart.length === 0) return showToast("Cart is empty", "warning");
    setIsSubmitting(true);
    try {
      const res = await createOrder(selectedTable, cart);
      setCart([]);
      setSelectedTable('');
      setView('LIST');
      showToast("Order created successfully!", "success");
      
      if (res?.alerts && res.alerts.length > 0) {
        res.alerts.forEach((alert: string) => {
          showToast(alert, "error"); // Use error/warning style for visibility
        });
      }
    } catch(e: any) {
      showToast(e.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (view === 'NEW') {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <button onClick={() => setView('LIST')} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-shrink-0">
              <button onClick={() => setSelectedCat('ALL')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCat === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>All Items</button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCat === c.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{c.name}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50 content-start">
            {filteredMenu.map((item: any) => (
              <button key={item.id} onClick={() => addToCart(item)} className="bg-white border border-slate-100 p-4 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between h-36 relative group text-left">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm line-clamp-2 leading-snug">
                    {item.name}
                    {item.quantityInGrams && <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">({item.quantityInGrams}g)</span>}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50/50 w-full">
                  <span className="font-extrabold text-emerald-600">{formatCurrency(item.price)}</span>
                  <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-500">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex-shrink-0 z-10">
          <div className="p-5 border-b border-slate-100 bg-slate-900 text-white">
            <h2 className="font-extrabold flex items-center text-lg"><ShoppingCart className="w-5 h-5 mr-2 text-indigo-400"/> Order Cart</h2>
          </div>
          <div className="p-4 border-b border-slate-100 bg-slate-50/80">
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer">
              <option value="">-- Choose target table (or Takeaway) --</option>
              <option value="TAKEAWAY">🛍️ Takeaway / No Table</option>
              {tables.map((t: any) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} ({t.capacity} seats) {t.status === 'OCCUPIED' ? '- OCCUPIED' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ShoppingCart className="w-16 h-16 mb-3 text-slate-300" />
                <p className="text-sm font-bold">Tap meals to build order</p>
              </div>
            ) : (
              cart.map((c, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm relative group transition-all hover:border-indigo-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-sm leading-tight pr-6">
                      {c.name}
                      {c.quantityInGrams && <span className="ml-1.5 text-[10px] text-slate-400 font-bold">({c.quantityInGrams}g)</span>}
                    </span>
                    <button onClick={() => removeFromCart(c.menuItemId)} className="text-slate-300 hover:text-rose-500 absolute top-3.5 right-3.5 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-extrabold text-indigo-600 text-sm">{formatCurrency(c.price * c.quantity)}</span>
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-md p-1 shadow-inner">
                      <button onClick={() => updateCartQty(c.menuItemId, -1)} className="p-1 bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"><Minus className="w-3 h-3"/></button>
                      <span className="text-sm font-bold w-5 text-center text-slate-700">{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.menuItemId, 1)} className="p-1 bg-white rounded shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"><Plus className="w-3 h-3"/></button>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add special instructions for kitchen..." 
                    value={c.notes} 
                    onChange={(e) => updateNotes(c.menuItemId, e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-600 placeholder:text-slate-400"
                  />
                </div>
              ))
            )}
          </div>
          <div className="p-5 border-t border-slate-200 bg-white">
            <div className="flex justify-between items-center mb-5">
              <span className="text-slate-500 font-extrabold uppercase tracking-widest text-xs">Subtotal</span>
              <span className="text-2xl font-black text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            <button 
              onClick={handleConfirmOrder} 
              disabled={isSubmitting || cart.length === 0 || !selectedTable}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-[0_4px_14px_rgba(79,70,229,0.3)] flex justify-center items-center text-sm"
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Print Ticket'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeOrders = initialOrders.filter((o: any) => o.status !== 'SERVED' && o.status !== 'CANCELLED');
  const historyOrders = initialOrders.filter((o: any) => o.status === 'SERVED' || o.status === 'CANCELLED');

  const displayedOrders = view === 'HISTORY' ? historyOrders : activeOrders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
          <p className="text-slate-500 text-sm mt-1">Take new orders, track fulfillment status, and coordinate tables.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView(view === 'HISTORY' ? 'LIST' : 'HISTORY')} 
            className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-sm transition-all shadow-sm flex items-center"
          >
            {view === 'HISTORY' ? 'View Active Orders' : 'Order History'}
          </button>
          <button onClick={() => setView('NEW')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all shadow-sm flex items-center hover:shadow-md hover:-translate-y-0.5">
            <Plus className="w-4 h-4 mr-2" /> Take New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayedOrders.map((order: any) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-black flex items-center justify-center text-lg shadow-inner mr-4">
                  {order.table ? order.table.number : '🛍️'}
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 tracking-tight">
                    Order #{order.id.slice(-4).toUpperCase()} 
                    {!order.table && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Takeaway</span>}
                  </h2>
                  <p className="text-xs font-medium text-slate-400 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <select 
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-full outline-none appearance-none border cursor-pointer transition-colors shadow-sm ${
                  order.status === 'PENDING' ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' :
                  order.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' :
                  order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' :
                  'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                }`}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="SERVED">SERVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            
            <div className="flex-1 mb-5 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Items ({order.items.length})</p>
              <div className="space-y-2.5">
                {order.items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700 truncate pr-4 flex items-baseline">
                      <span className="font-black text-indigo-600 w-5 inline-block text-xs">{item.quantity}x</span>
                      <span className="font-semibold">
                        {item.menuItem.name}
                        {item.menuItem.quantityInGrams && <span className="ml-1 text-[10px] text-slate-400 font-bold">({item.menuItem.quantityInGrams}g)</span>}
                      </span>
                    </span>
                    <span className="text-slate-800 font-bold">{formatCurrency(item.priceAtTime * item.quantity)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs font-bold text-indigo-400 pt-2">+ {order.items.length - 3} more items</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50/80 -mx-5 px-5 py-4 shadow-inner">
              <span className="text-slate-500 font-extrabold text-xs uppercase tracking-widest">Subtotal</span>
              <span className="text-xl font-black text-slate-800">
                {formatCurrency(order.items.reduce((acc: number, item: any) => acc + (item.priceAtTime * item.quantity), 0))}
              </span>
            </div>
            
            {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
              <div className="px-5 pb-5 pt-2">
                <button 
                  onClick={() => handleGenerateBill(order.id)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Generate Bill & Close
                </button>
              </div>
            )}
          </div>
        ))}
        {displayedOrders.length === 0 && (
          <div className="col-span-full p-16 text-center flex flex-col items-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="bg-indigo-50 p-4 rounded-full mb-4 ring-4 ring-indigo-50/50">
              <Coffee className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">
              {view === 'HISTORY' ? 'No order history' : 'No active orders'}
            </h3>
            <p className="text-slate-500 text-sm font-medium">
              {view === 'HISTORY' 
                ? 'Completed and cancelled orders will appear here.'
                : 'The floor is quiet. Hit "Take New Order" when your guests are ready.'}
            </p>
          </div>
        )}
      </div>

      {/* Staff Selection Modal */}
      {servingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assign Staff</h3>
              <p className="text-slate-500 text-sm font-medium">Who served this order?</p>
            </div>
            
            <div className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Server</label>
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose staff member --</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.userId}>{s.user?.name || 'Unknown'}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => { setServingOrderId(null); setSelectedStaffId(''); }}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalServe}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  Confirm Serve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
