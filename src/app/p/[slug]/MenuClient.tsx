"use client";
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { submitPublicOrder } from './actions'
import { Plus, Minus, ShoppingBag, X, Check, UtensilsCrossed, Info, QrCode } from 'lucide-react'

export default function MenuClient({ restaurant }: { restaurant: any }) {
  const searchParams = useSearchParams()
  const tableFromUrl = searchParams.get('table')

  const [cart, setCart] = useState<{ [id: string]: { item: any, quantity: number } }>({})
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ 
    name: '', 
    phone: '', 
    table: tableFromUrl || '' 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState<string | null>(null)

  const categories = restaurant.menuCategories || []

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        quantity: (prev[item.id]?.quantity || 0) + 1
      }
    }))
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const updated = { ...prev }
      if (updated[itemId].quantity > 1) {
        updated[itemId].quantity -= 1
      } else {
        delete updated[itemId]
      }
      return updated
    })
  }

  const cartItems = Object.values(cart)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await submitPublicOrder({
        restaurantId: restaurant.id,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        tableNumber: customerInfo.table,
        items: cartItems.map(i => ({
          menuItemId: i.item.id,
          quantity: i.quantity,
          price: i.item.price
        }))
      })
      setOrderComplete(res.orderId)
      setCart({})
      setIsCheckoutOpen(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="py-20 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Order Received!</h2>
        <p className="text-slate-500 font-medium mb-8">Your order ID is <span className="font-mono font-black text-indigo-600">#{orderComplete.slice(-6).toUpperCase()}</span></p>
        <button 
          onClick={() => setOrderComplete(null)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Place Another Order
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Categories Nav */}
      <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide sticky top-16 z-20 bg-slate-50/90 backdrop-blur-md pt-2">
        {categories.map((cat: any) => (
          <a 
            key={cat.id} 
            href={`#cat-${cat.id}`}
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 whitespace-nowrap hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all shadow-sm"
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Menu List */}
      <div className="space-y-12 mt-4">
        {categories.map((cat: any) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 group hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 overflow-hidden relative shrink-0">
                    <UtensilsCrossed className="w-8 h-8" />
                    {/* Placeholder for item image */}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-black text-slate-900 text-lg">₹{item.price}</span>
                      {cart[item.id] ? (
                        <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center shadow-sm hover:text-rose-500 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-black w-4 text-center">{cart[item.id].quantity}</span>
                          <button 
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ backgroundColor: 'var(--brand-primary)' }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(item)}
                          className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--brand-primary)' }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Cart Drawer Toggle */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="max-w-md mx-auto w-full text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-indigo-200 transition-transform active:scale-[0.98]"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black uppercase tracking-widest opacity-80">{cartCount} Items</div>
                <div className="text-sm font-black">View Cart</div>
              </div>
            </div>
            <div className="text-right">
               <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Total</div>
               <div className="text-lg font-black tracking-tight">₹{cartTotal}</div>
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Complete Order</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4 mb-8">
                 {cartItems.map(i => (
                   <div key={i.item.id} className="flex justify-between items-center text-sm">
                     <div className="flex gap-3">
                       <span className="font-black text-indigo-600">x{i.quantity}</span>
                       <span className="font-bold text-slate-700">{i.item.name}</span>
                     </div>
                     <span className="font-black text-slate-900">₹{i.item.price * i.quantity}</span>
                   </div>
                 ))}
                 <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Grand Total</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">₹{cartTotal}</span>
                 </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input 
                    required
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all" 
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Table Number</label>
                    {tableFromUrl && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <QrCode className="w-2.5 h-2.5" /> Scanned
                      </span>
                    )}
                  </div>
                  <input 
                    value={customerInfo.table}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, table: e.target.value }))}
                    disabled={!!tableFromUrl}
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all ${
                      tableFromUrl ? 'opacity-70 font-black text-slate-900 cursor-not-allowed' : 'focus:bg-white focus:border-indigo-500'
                    }`} 
                    placeholder="e.g. Table 05"
                  />
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex gap-3 mt-6">
                  <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                    By clicking order, your request will be sent directly to the restaurant kitchen. You can pay at the counter.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-100 mt-6 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {isSubmitting ? 'Processing Order...' : 'Place Order Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
