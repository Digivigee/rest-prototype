'use client'

import { useState, useRef } from 'react'
import { Printer, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Receipt, ChevronRight, XCircle, RotateCcw } from 'lucide-react'
import { generateBill, recordPayment, refundPayment } from './actions'
import { CONFIG, formatCurrency } from '@/lib/config'
import { useToast } from '@/lib/ToastContext'
import { useConfirm } from '@/lib/ConfirmContext'

type Order = any

export default function BillingClient({ orders }: { orders: Order[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [taxRate, setTaxRate] = useState(CONFIG.TAX_RATE * 100)
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [discount, setDiscount] = useState(0)
  const [serviceCharge, setServiceCharge] = useState(0)
  const [payMethod, setPayMethod] = useState('CASH')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [generatedBill, setGeneratedBill] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const selectedOrder = orders.find(o => o.id === selectedOrderId)
  const existingBill = selectedOrder?.bill ?? generatedBill

  const subtotal = selectedOrder
    ? selectedOrder.items.reduce((acc: number, item: any) => acc + (item.priceAtTime * item.quantity), 0)
    : 0
  const taxAmt = subtotal * (taxRate / 100)
  const grandTotal = Math.max(0, subtotal + taxAmt + serviceCharge - discount)
  
  const validPayments = existingBill ? existingBill.payments.filter((p: any) => p.status === 'PAID') : []
  const totalPaid = validPayments.reduce((acc: number, p: any) => acc + p.amount, 0)
  const balanceDue = existingBill ? Math.max(0, existingBill.total - totalPaid) : grandTotal

  const handleGenerate = async () => {
    if (!selectedOrder) return
    setIsGenerating(true)
    try {
      const bill = await generateBill(selectedOrder.id, taxRate, discount, serviceCharge)
      setGeneratedBill(bill)
      showToast('Invoice generated successfully', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePayment = async () => {
    const bill = existingBill
    if (!bill || !selectedOrder) return
    setIsPaying(true)
    try {
      await recordPayment(bill.id, selectedOrder.id, selectedOrder.tableId, balanceDue, payMethod)
      setGeneratedBill(null)
      setSelectedOrderId(null)
      showToast('Payment recorded correctly. Table is now available.', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsPaying(false)
    }
  }

  const handleRefund = async (paymentId: string) => {
    const isConfirmed = await confirm({
      title: 'Refund Payment',
      message: 'Are you sure you want to refund this payment? This action cannot be undone.',
      confirmText: 'Refund Payment',
      isDangerous: true
    });
    if (!isConfirmed) return;

    setIsRefunding(true)
    try {
      await refundPayment(paymentId)
      showToast('Payment refunded successfully.', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsRefunding(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (order: Order) => {
    const bill = order.bill
    if (!bill) return <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">UNBILLED</span>
    if (bill.status === 'PAID') return <span className="text-xs font-black px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">PAID</span>
    if (bill.status === 'PARTIAL') return <span className="text-xs font-black px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">PARTIAL</span>
    return <span className="text-xs font-black px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full border border-rose-200">UNPAID</span>
  }

  return (
    <>
      {/* Print-only styles injected globally */}
      <style>{`
        @media print { 
          .no-print, nav, aside { display: none !important; } 
          body { background: white !important; }
          .print-full-width { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left: Order selector list */}
        <div className="xl:w-[380px] flex-shrink-0 no-print">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h1 className="text-xl font-black text-slate-800 flex items-center"><Receipt className="w-5 h-5 mr-2 text-indigo-500"/> Billing</h1>
              <p className="text-slate-500 text-xs mt-1">Select an order to generate or manage its invoice.</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {orders.length === 0 && (
                <p className="p-8 text-center text-slate-400 text-sm font-bold">No orders available.</p>
              )}
              {orders.map((order: Order) => (
                <button
                  key={order.id}
                  onClick={() => { setSelectedOrderId(order.id); setGeneratedBill(null) }}
                  className={`w-full text-left px-5 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors group ${selectedOrderId === order.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800">Table {order.table.number}</span>
                      {getStatusBadge(order)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Order #{order.id.slice(-5).toUpperCase()} · {order.items.length} items</p>
                    <p className="text-xs text-slate-400 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-colors ${selectedOrderId === order.id ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Invoice preview and payment */}
        {!selectedOrder ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-white rounded-2xl border border-dashed border-slate-200 no-print">
            <div className="text-center">
              <div className="bg-slate-50 p-5 rounded-full mb-5 inline-block ring-4 ring-slate-50/50">
                <Receipt className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-600 mb-1">Select an order</h3>
              <p className="text-slate-400 text-sm font-medium">Pick an order from the left panel to view or generate a bill.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 print-full-width">
            {/* Invoice Card */}
            <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-full-width">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-slate-50 to-white">
                <div>
                  <h2 className="text-2xl font-black text-indigo-600 tracking-tight">{CONFIG.RESTAURANT_NAME}</h2>
                  <p className="text-slate-500 text-sm mt-1">Authentic Indian Gastronomy</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800 text-lg">Invoice #{selectedOrder.id.slice(-6).toUpperCase()}</p>
                  <p className="text-slate-500 text-xs font-medium mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <div className="mt-2">
                    {existingBill?.status === 'PAID'
                      ? <span className="text-xs font-black px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">✓ PAID</span>
                      : <span className="text-xs font-black px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200">UNPAID</span>}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-b border-slate-100">
                <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100">
                  <span>Item</span>
                  <div className="flex gap-8">
                    <span>Qty</span>
                    <span className="w-20 text-right">Unit</span>
                    <span className="w-20 text-right">Total</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50 mt-1">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between py-3.5">
                      <span className="font-bold text-slate-800 text-sm">
                        {item.menuItem.name}
                        {item.menuItem.quantityInGrams && <span className="ml-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">({item.menuItem.quantityInGrams}g)</span>}
                      </span>
                      <div className="flex gap-8 text-sm">
                        <span className="font-bold text-slate-500 text-center w-6">{item.quantity}</span>
                        <span className="font-bold text-slate-600 w-20 text-right">{formatCurrency(item.priceAtTime)}</span>
                        <span className="font-black text-slate-800 w-20 text-right">{formatCurrency(item.priceAtTime * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Adjustments */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 justify-between">
                  {/* Adjustments — only show before bill generated */}
                  {!existingBill && (
                    <div className="space-y-4 no-print flex-1">
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Bill Adjustments</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Tax %</label>
                          <input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Discount</label>
                          <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Service</label>
                          <input type="number" min="0" value={serviceCharge} onChange={e => setServiceCharge(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-3 md:w-72 ml-auto">
                    <div className="flex justify-between text-sm text-slate-600 font-bold">
                      <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 font-bold">
                      <span>Tax ({existingBill ? ((existingBill.tax / subtotal) * 100).toFixed(0) : taxRate}%)</span>
                      <span>{formatCurrency(existingBill ? existingBill.tax : taxAmt)}</span>
                    </div>
                    {(serviceCharge > 0 || existingBill?.serviceCharge > 0) && (
                      <div className="flex justify-between text-sm text-slate-600 font-bold">
                        <span>Service Charge</span><span>+{formatCurrency(existingBill?.serviceCharge ?? serviceCharge)}</span>
                      </div>
                    )}
                    {(discount > 0 || existingBill?.discount > 0) && (
                      <div className="flex justify-between text-sm text-emerald-600 font-bold">
                        <span>Discount</span><span>-{formatCurrency(existingBill?.discount ?? discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span>{formatCurrency(existingBill?.total ?? grandTotal)}</span>
                    </div>
                    {existingBill && totalPaid > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-slate-500 font-bold">
                          <span>Amount Paid</span><span className="text-emerald-600">-{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-slate-800 pt-2 border-t border-slate-100">
                          <span>Balance Due</span><span>{formatCurrency(balanceDue)}</span>
                        </div>
                      </>
                    )}

                    {/* Payments List for Refunds */}
                    {validPayments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 no-print">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded Payments</h4>
                        {validPayments.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-bold flex items-center gap-1">
                              {p.method}
                              <span className="text-xs text-slate-400 font-medium ml-1">({new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-800">{formatCurrency(p.amount)}</span>
                              <button onClick={() => handleRefund(p.id)} disabled={isRefunding} className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline disabled:opacity-50">
                                Refund
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 no-print">
              {/* Generate Bill */}
              {!existingBill && (
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="flex-1 bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center text-sm shadow-lg">
                  {isGenerating ? 'Generating...' : <><Receipt className="w-5 h-5 mr-2"/> Generate Bill</>}
                </button>
              )}

              {/* Payment form */}
              {existingBill && existingBill.status !== 'PAID' && (
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-black text-slate-800">Record Payment</h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'CASH', label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
                        { id: 'CARD', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
                        { id: 'UPI', label: 'UPI', icon: <Smartphone className="w-5 h-5" /> },
                        { id: 'MIXED', label: 'Mixed', icon: <CheckCircle className="w-5 h-5" /> },
                      ].map(m => (
                        <button key={m.id} onClick={() => setPayMethod(m.id)}
                          className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 font-black text-sm transition-all ${payMethod === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                          {m.icon}
                          <span className="text-xs mt-1">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button onClick={handlePayment} disabled={isPaying}
                      className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(5,150,105,0.3)] flex items-center justify-center text-sm">
                      {isPaying ? 'Processing...' : <><CheckCircle className="w-5 h-5 mr-2"/> Pay {formatCurrency(balanceDue)}</>}
                    </button>
                    <button onClick={handlePrint}
                      className="px-5 py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-black rounded-xl transition-colors shadow-sm flex items-center text-sm">
                      <Printer className="w-5 h-5 mr-2" /> Print
                    </button>
                  </div>
                </div>
              )}

              {/* Already Paid */}
              {existingBill?.status === 'PAID' && (
                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-black text-emerald-800">Payment Completed</p>
                      <p className="text-emerald-700 text-sm font-bold">Bill has been fully settled. Table is now available.</p>
                    </div>
                  </div>
                  <button onClick={handlePrint}
                    className="px-6 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black rounded-2xl transition-colors shadow-sm flex items-center text-sm">
                    <Printer className="w-5 h-5 mr-2" /> Print Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
