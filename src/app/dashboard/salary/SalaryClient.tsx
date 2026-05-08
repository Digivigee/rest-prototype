'use client'

import { useState } from 'react'
import { 
  Banknote, Calendar, ChevronLeft, ChevronRight, 
  Calculator, CheckCircle, AlertCircle, Edit3, Save, X, Printer, Download, MessageSquare
} from 'lucide-react'
import { generateSalaries, updateSalaryStatus, updateSalaryAdjustments } from './actions'
import { useToast } from '@/lib/ToastContext'
import { formatCurrency } from '@/lib/config'

export default function SalaryClient({ 
  staffProfiles, 
  initialRecords 
}: { 
  staffProfiles: any[], 
  initialRecords: any[] 
}) {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempDeductions, setTempDeductions] = useState<number>(0)
  const { showToast } = useToast()

  const handlePrint = () => {
    window.print()
  }

  const filteredRecords = initialRecords.filter(r => r.month === month && r.year === year)

  // Summary Metrics
  const totalPayout = filteredRecords.reduce((sum, r) => sum + r.netSalary, 0)
  const totalStaffCount = staffProfiles.length
  const pendingCount = filteredRecords.filter(r => r.status === 'PENDING').length

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateSalaries(month, year)
      if (result.success) {
        showToast(`Salaries for ${month}/${year} generated successfully`, 'success')
      } else {
        showToast(result.error || 'Failed to generate salaries', 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateSalaryStatus(id, status)
      showToast(`Salary marked as ${status}`, 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const handleSaveAdjustment = async (id: string) => {
    try {
      await updateSalaryAdjustments(id, tempDeductions)
      setEditingId(null)
      showToast('Adjustment saved', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const handleWhatsApp = (record: any) => {
    const phone = record.staff.phone || '919000000000' // Fallback for demo
    const text = `*SpiceHub Salary Slip - ${months[record.month-1]} ${record.year}*\n\n` +
      `Staff: ${record.staff.user.name}\n` +
      `Present Days: ${record.presentDays}\n` +
      `Absent Days: ${record.absentDays}\n` +
      `--------------------------\n` +
      `*Gross Salary: ${formatCurrency(record.grossSalary)}*\n` +
      `Deductions: -${formatCurrency(record.deductions)}\n` +
      `*Net Payable: ${formatCurrency(record.netSalary)}*\n\n` +
      `Thank you for your hard work!`
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
            <Banknote className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payout</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totalPayout)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Staff</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{totalStaffCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Payments</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Banknote className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payroll Management</h2>
              <p className="text-slate-500 font-bold">Calculate and manage monthly staff salaries.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="ml-2 bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center disabled:opacity-50"
            >
              <Calculator className="w-5 h-5 mr-2" />
              {isGenerating ? 'Calculating...' : 'Generate Payroll'}
            </button>

            {filteredRecords.length > 0 && (
              <button 
                onClick={handlePrint}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 font-black rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print Slips
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <h3 className="text-lg font-black text-slate-800">Salary Records for {months[month-1]} {year}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Deductions</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Salary</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    No records found for this period. Click "Generate Payroll" to calculate.
                  </td>
                </tr>
              ) : filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs mr-3">
                        {record.staff.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{record.staff.user.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{record.staff.user.role.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase">{record.staff.salaryType}</td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black flex gap-2">
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">P:{record.presentDays}</span>
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">A:{record.absentDays}</span>
                      <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">H:{record.halfDays}</span>
                      {record.overtimeHours > 0 && <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">OT:{record.overtimeHours.toFixed(1)}h</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(record.grossSalary)}</td>
                  <td className="px-6 py-4 text-right">
                    {editingId === record.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input 
                          type="number" 
                          value={tempDeductions}
                          onChange={(e) => setTempDeductions(parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 border border-indigo-300 rounded text-right text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-rose-500">-{formatCurrency(record.deductions)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-base font-black text-indigo-600">{formatCurrency(record.netSalary)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      record.status === 'PAID' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {editingId === record.id ? (
                        <>
                          <button 
                            onClick={() => handleSaveAdjustment(record.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingId(record.id)
                              setTempDeductions(record.deductions)
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Adjust Deductions"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {record.status === 'PENDING' && (
                            <button 
                              onClick={() => handleStatusUpdate(record.id, 'PAID')}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleWhatsApp(record)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Send via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
