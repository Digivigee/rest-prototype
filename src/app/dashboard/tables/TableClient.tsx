'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, User, Coffee, XCircle, AlertCircle, Zap, QrCode, Printer } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { addTable, updateTable, updateTableStatus, deleteTable } from './actions'
import Link from 'next/link'

type Table = any; 

export default function TableClient({ 
  tables,
  billingInfo,
  restaurantSlug
}: { 
  tables: Table[],
  billingInfo: any,
  restaurantSlug: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null)

  const handleEdit = (table: Table) => {
    setEditingTable(table)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, activeOrdersCount: number) => {
    if (activeOrdersCount > 0) {
      alert("This table has an active order and cannot be deleted.");
      return;
    }
    if (confirm("Are you sure you want to remove this table?")) {
      try {
        await deleteTable(id);
      } catch (e: any) {
        alert(e.message)
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      if (editingTable) {
        await updateTable(editingTable.id, { 
          number: fd.get('number') as string, 
          capacity: Number(fd.get('capacity')),
          status: fd.get('status') as string
        });
      } else {
        await addTable({ 
          number: fd.get('number') as string, 
          capacity: Number(fd.get('capacity'))
        });
      }
      setIsModalOpen(false);
      setEditingTable(null);
    } catch(e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'OCCUPIED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RESERVED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CLEANING': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            Table Management
            {billingInfo && (
              <span className={`ml-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                billingInfo.usage.tables >= billingInfo.limits.maxTables 
                  ? 'bg-rose-50 text-rose-600 border-rose-100' 
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {billingInfo.usage.tables} / {billingInfo.limits.maxTables} {billingInfo.planType} Limit
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage restaurant floor plan, capacities, and active table status.</p>
        </div>
        <div className="flex items-center gap-3">
          {billingInfo && billingInfo.usage.tables >= billingInfo.limits.maxTables && (
             <Link 
               href="/dashboard/billing" 
               className="hidden sm:flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2.5 rounded-xl transition-all"
             >
               <Zap className="w-3 h-3 fill-indigo-600" /> Upgrade to add more
             </Link>
          )}
          <button 
            onClick={() => { setEditingTable(null); setIsModalOpen(true); }} 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center bg-white rounded-xl border border-slate-100">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No tables setup yet</h3>
          <p className="text-slate-500 text-sm mb-4">Click "Add Table" to start building your floorplan layout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const activeOrder = table.orders[0];
            
            return (
              <div key={table.id} className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`h-2 w-full ${getStatusColor(table.status).split(' ')[0]}`}></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-baseline space-x-2">
                      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{table.number}</h2>
                      <span className="text-sm font-bold text-slate-400 flex items-center bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-500" /> {table.capacity}
                      </span>
                    </div>
                    
                    {/* Status Dropdown Indicator */}
                    <div className="relative">
                      <select 
                        value={table.status}
                        onChange={(e) => updateTableStatus(table.id, e.target.value)}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-full outline-none appearance-none pr-8 cursor-pointer border shadow-sm transition-colors ${getStatusColor(table.status)}`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="CLEANING">CLEANING</option>
                      </select>
                      <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${getStatusColor(table.status).split(' ')[1]}`} />
                    </div>
                  </div>

                  {/* Active Order Banner / Placeholder Space */}
                  {table.status === 'OCCUPIED' && activeOrder ? (
                    <div className="bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100 mb-5">
                      <p className="text-xs text-indigo-900 font-bold mb-1.5 flex items-center">
                        <Coffee className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Order #{activeOrder.id.slice(-5).toUpperCase()}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-1 rounded shadow-sm">
                          {activeOrder.status}
                        </span>
                        <Link href="/dashboard/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                          View details
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[76px] flex items-center justify-center mb-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {table.status === 'AVAILABLE' ? 'Ready for seating' : 'No active order'}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions & Modifiers */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-2">
                    <div className="flex space-x-2">
                      {table.status === 'AVAILABLE' ? (
                        <Link href="/dashboard/orders" className="text-xs font-extrabold text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-indigo-100 hover:shadow-md">
                          Start Order
                        </Link>
                      ) : (
                        <button onClick={() => updateTableStatus(table.id, 'AVAILABLE')} className="text-xs font-extrabold text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg transition-all border border-emerald-100 hover:shadow-md">
                          Mark Available
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setQrModalTable(table)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Generate QR Code">
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(table)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Edit Table Cap/Num">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(table.id, table.orders.length)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete Table">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Table {qrModalTable.number}</h3>
                <p className="text-slate-500 text-sm font-medium">Scan to order instantly</p>
              </div>
              <button onClick={() => setQrModalTable(null)} className="p-2 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 pt-4 flex flex-col items-center">
              <div className="p-6 bg-white rounded-[2rem] border-4 border-slate-50 shadow-inner mb-6">
                <QRCodeCanvas 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${restaurantSlug}?table=${encodeURIComponent(qrModalTable.number)}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Public URL</p>
                <p className="text-xs font-mono text-slate-600 break-all text-center leading-relaxed">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${restaurantSlug}?table=${encodeURIComponent(qrModalTable.number)}`}
                </p>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                <Printer className="w-4 h-4" /> Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-extrabold text-slate-800">{editingTable ? 'Edit Table Info' : 'Add New Table'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingTable(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Table Number / Label</label>
                <input required name="number" defaultValue={editingTable?.number} placeholder="e.g. T4 or Patio 1" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Seating Capacity</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required min="1" type="number" name="capacity" defaultValue={editingTable?.capacity} placeholder="2" className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
              </div>

              {editingTable && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Override Status</label>
                  <select name="status" defaultValue={editingTable.status} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm">
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="CLEANING">CLEANING</option>
                  </select>
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                  {isSubmitting ? 'Saving...' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
