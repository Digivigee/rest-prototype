'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpCircle, ArrowDownCircle, History, Package, X, CheckCircle } from 'lucide-react'
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, addTransaction } from './actions'
import { CONFIG, formatCurrency } from '@/lib/config'
import { useToast } from '@/lib/ToastContext'
import { useConfirm } from '@/lib/ConfirmContext'

type Item = any;

export default function InventoryClient({ items }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isHistOpen, setIsHistOpen] = useState(false)
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW'>('ALL')
  const [itemForm, setItemForm] = useState({ name: '', unit: '', quantity: 0, minThreshold: 0, costPerUnit: 0, supplier: '', recipeUnit: '', yieldFactor: 1.0, recipeUnitConversion: 1.0 })
  const [txType, setTxType] = useState('IN')

  const lowStockItems = items.filter(i => i.currentStock <= i.minStockLevel)
  const filteredItems = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = filterMode === 'ALL' || i.currentStock <= i.minStockLevel
    return matchSearch && matchFilter
  })

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      unit: formData.get('unit') as string,
      quantity: Number(formData.get('quantity')) || 0,
      minThreshold: Number(formData.get('minThreshold')) || 0,
      costPerUnit: Number(formData.get('costPerUnit')) || 0,
      supplier: formData.get('supplier') as string,
      recipeUnit: formData.get('recipeUnit') as string,
      yieldFactor: Number(formData.get('yieldFactor')) || 1.0,
      recipeUnitConversion: Number(formData.get('recipeUnitConversion')) || 1.0,
    }

    try {
      if (editingItem?.id) {
        await updateInventoryItem(editingItem.id, data)
      } else {
        await createInventoryItem(data)
      }
      setIsItemModalOpen(false)
      setEditingItem(null)
      showToast('Inventory item saved', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Inventory Item',
      message: 'Delete this inventory item and all its transaction history? This action cannot be undone.',
      confirmText: 'Delete',
      isDangerous: true
    });
    if (isConfirmed) {
      try { 
        await deleteInventoryItem(id) 
        showToast('Item deleted', 'success')
      } catch (e: any) { 
        showToast(e.message, 'error') 
      }
    }
  }

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target as HTMLFormElement)
    try {
      await addTransaction({
        inventoryItemId: selectedItem!.id,
        type: txType,
        quantity: Number(fd.get('quantity')),
        reason: fd.get('reason') as string,
        costPerUnit: fd.get('costPerUnit') ? Number(fd.get('costPerUnit')) : undefined,
        supplier: fd.get('supplier') ? (fd.get('supplier') as string) : undefined,
      })
      setIsTxModalOpen(false)
      setSelectedItem(null)
      showToast('Transaction recorded', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const txTypeIcon = (type: string) => {
    if (type === 'IN') return <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
    if (type === 'OUT') return <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />
    if (type === 'WASTAGE') return <Trash2 className="w-3.5 h-3.5 text-orange-500" />
    return <Package className="w-3.5 h-3.5 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Track stock levels, set alerts, and log supply transactions.</p>
        </div>
        <button onClick={() => { setEditingItem(null); setItemForm({ name: '', unit: '', quantity: 0, minThreshold: 0, costPerUnit: 0, supplier: '', recipeUnit: '', yieldFactor: 1.0, recipeUnitConversion: 1.0 }); setIsItemModalOpen(true) }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-2.5 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-amber-900 text-sm">Low Stock Alert</p>
            <p className="text-amber-700 text-xs mt-0.5 truncate">
              {lowStockItems.map(i => i.name).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} running low.
            </p>
          </div>
          <button onClick={() => setFilterMode(filterMode === 'LOW' ? 'ALL' : 'LOW')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex-shrink-0 ${filterMode === 'LOW' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-800 hover:bg-amber-300'}`}>
            {filterMode === 'LOW' ? 'Show All' : `View ${lowStockItems.length} Low`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-white" />
          </div>
          <div className="text-xs font-bold text-slate-400 ml-auto">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {filteredItems.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <Package className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-1">No inventory items</h3>
              <p className="text-slate-400 text-sm">Add items using the button above.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Item</th>
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Cost/Unit</th>
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Current Stock</th>
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Min Level</th>
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minStockLevel
                  return (
                    <tr key={item.id} className={`group hover:bg-slate-50/80 transition-colors ${isLow ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLow ? 'bg-amber-100' : 'bg-indigo-50'}`}>
                            <Package className={`w-4 h-4 ${isLow ? 'text-amber-500' : 'text-indigo-400'}`} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                            {isLow && <p className="text-xs font-black text-amber-600 flex items-center mt-0.5"><AlertTriangle className="w-3 h-3 mr-1"/> Low Stock</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-6 text-sm font-black text-slate-700">{formatCurrency(item.costPerUnit || 0)}</td>
                      <td className="py-4 px-6">
                        <span className={`text-sm font-black ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-500">{item.minStockLevel}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-600">
                        {item.costPerUnit ? `$${item.costPerUnit.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 font-medium">{item.supplier || '—'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedItem(item); setIsHistOpen(true) }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Transaction History">
                            <History className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedItem(item); setIsTxModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Add Transaction">
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingItem(item); setItemForm(item); setIsItemModalOpen(true) }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Item">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Item">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">{editingItem ? 'Edit Item' : 'New Inventory Item'}</h2>
              <button onClick={() => { setIsItemModalOpen(false); setEditingItem(null) }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Item Name *</label>
                  <input required name="name" defaultValue={editingItem?.name} placeholder="e.g. Tomatoes" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Unit *</label>
                  <input required name="unit" defaultValue={editingItem?.unit} placeholder="kg / pcs / litre" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                {!editingItem && (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Opening Stock</label>
                    <input type="number" min="0" step="0.01" name="quantity" defaultValue={0} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Min Stock Level *</label>
                  <input required type="number" min="0" step="0.01" name="minThreshold" defaultValue={editingItem?.minStockLevel ?? 0} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Cost per Unit ($)</label>
                  <input type="number" min="0" step="0.01" name="costPerUnit" defaultValue={editingItem?.costPerUnit ?? ''} placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Supplier (optional)</label>
                  <input name="supplier" defaultValue={editingItem?.supplier ?? ''} placeholder="Supplier or vendor name" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
                
                {/* Advanced Recipe & Yield settings */}
                <div className="col-span-2 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-700 mb-3">Recipe & Yield Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5" title="The unit used in recipes (e.g. g, ml)">Recipe Unit</label>
                      <input name="recipeUnit" defaultValue={editingItem?.recipeUnit ?? ''} placeholder="e.g. g, ml" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5" title="How many Inventory Units equal 1 Recipe Unit? (e.g., if Inv=kg, Recipe=g, factor=0.001)">Conversion Factor</label>
                      <input type="number" step="0.0001" min="0" name="recipeUnitConversion" defaultValue={editingItem?.recipeUnitConversion ?? 1.0} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5" title="Usable yield percentage (e.g., 0.8 for 80% usable)">Yield Factor</label>
                      <input type="number" step="0.01" min="0" max="1" name="yieldFactor" defaultValue={editingItem?.yieldFactor ?? 1.0} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {isTxModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-black text-slate-800">Stock Transaction</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItem?.name} · Current: <strong>{selectedItem?.currentStock} {selectedItem?.unit}</strong></p>
              </div>
              <button onClick={() => { setIsTxModalOpen(false); setSelectedItem(null) }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTx} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Transaction Type</label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'IN', label: 'Stock In', icon: <ArrowUpCircle className="w-4 h-4" />, color: 'bg-emerald-600 text-white border-emerald-600' },
                      { id: 'OUT', label: 'Stock Out', icon: <ArrowDownCircle className="w-4 h-4" />, color: 'bg-rose-600 text-white border-rose-600' },
                      { id: 'WASTAGE', label: 'Wastage', icon: <Trash2 className="w-4 h-4" />, color: 'bg-orange-600 text-white border-orange-600' },
                      { id: 'ADJUSTMENT', label: 'Adjust', icon: <Package className="w-4 h-4" />, color: 'bg-blue-600 text-white border-blue-600' },
                    ].map(t => (
                    <label key={t.id} className="cursor-pointer">
                      <input type="radio" name="type" value={t.id} className="sr-only peer" checked={txType === t.id} onChange={() => setTxType(t.id)} />
                      <div className={`flex flex-col items-center text-center justify-center p-2 rounded-xl border-2 text-[10px] font-black transition-all peer-checked:${t.color} border-slate-200 text-slate-600 hover:border-slate-300`}>
                        {t.icon}<span className="mt-1 leading-tight">{t.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Quantity *</label>
                <input required type="number" min="0.01" step="0.01" name="quantity" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Reason / Note</label>
                <input name="reason" placeholder="e.g. Daily delivery, Spoilage..." className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
              </div>
              {txType === 'IN' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Update Cost/Unit ($)</label>
                    <input type="number" step="0.01" min="0" name="costPerUnit" defaultValue={selectedItem?.costPerUnit ?? ''} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Update Supplier</label>
                    <input name="supplier" defaultValue={selectedItem?.supplier ?? ''} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsTxModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-black text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 shadow-sm">
                  {isSubmitting ? 'Processing...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Slide Panel */}
      {isHistOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => { setIsHistOpen(false); setSelectedItem(null) }}>
          <div className="w-full sm:max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center"><History className="w-4 h-4 mr-2 text-indigo-500" /> History</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItem.name} · Current: <strong>{selectedItem.quantity} {selectedItem.unit}</strong></p>
              </div>
              <button onClick={() => setIsHistOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 flex-1">
              {selectedItem.transactions.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-12">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedItem.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'IN' ? 'bg-emerald-100' : tx.type === 'OUT' ? 'bg-rose-100' : tx.type === 'WASTAGE' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                        {txTypeIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black uppercase ${tx.type === 'IN' ? 'text-emerald-700' : tx.type === 'OUT' ? 'text-rose-700' : 'text-blue-700'}`}>{tx.type}</span>
                          <span className="font-black text-slate-800 text-sm">{tx.type === 'OUT' ? '-' : tx.type === 'IN' ? '+' : '='}{tx.quantity} {selectedItem.unit}</span>
                        </div>
                        {tx.reason && <p className="text-xs text-slate-500 mt-0.5 truncate">{tx.reason}</p>}
                        <p className="text-xs text-slate-400 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
