'use client'

import { useState, useEffect } from 'react'
import { 
  UserCircle, Calendar, Clock, Banknote, 
  TrendingUp, CheckCircle, AlertCircle, LogIn, LogOut, QrCode
} from 'lucide-react'
import { formatCurrency } from '@/lib/config'

export default function MyDashboardClient({ 
  staffProfiles, 
  allAttendance, 
  allSalaryRecords 
}: { 
  staffProfiles: any[], 
  allAttendance: any[],
  allSalaryRecords: any[]
}) {
  const [actingAsId, setActingAsId] = useState<string>(staffProfiles[0]?.id || '')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null // or loading skeleton
  
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const todayStr = now.toISOString().split('T')[0]

  const myProfile = staffProfiles.find(p => p.id === actingAsId)
  
  const myMonthlyAttendance = allAttendance.filter(a => 
    a.staffId === actingAsId && 
    new Date(a.date).getMonth() + 1 === currentMonth &&
    new Date(a.date).getFullYear() === currentYear
  )

  const todayRecord = myMonthlyAttendance.find(a => 
    new Date(a.date).toISOString().split('T')[0] === todayStr
  )

  const mySalaryRecord = allSalaryRecords.find(r => 
    r.staffId === actingAsId && 
    r.month === currentMonth && 
    r.year === currentYear
  )

  // Monthly stats
  const presentDays = myMonthlyAttendance.filter(a => a.status === 'PRESENT').length
  const halfDays = myMonthlyAttendance.filter(a => a.status === 'HALF_DAY').length
  const totalHours = myMonthlyAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0)

  // Estimated salary if not generated yet
  const calculateEstimate = () => {
    if (mySalaryRecord) return mySalaryRecord.netSalary
    if (!myProfile) return 0

    if (myProfile.salaryType === 'MONTHLY') {
      const base = myProfile.baseSalary || 0
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
      const workDays = daysInMonth - 4
      const perDay = base / workDays
      const deductions = (workDays - (presentDays + halfDays)) * perDay + (halfDays * perDay / 2)
      return Math.max(0, base - deductions)
    } else if (myProfile.salaryType === 'DAILY') {
      return (presentDays * (myProfile.perDaySalary || 0)) + (halfDays * (myProfile.perDaySalary || 0) / 2)
    } else if (myProfile.salaryType === 'HOURLY') {
      return totalHours * (myProfile.perHourSalary || 0)
    }
    return 0
  }

  const estimatedSalary = calculateEstimate()

  return (
    <div className="space-y-8">
      {/* Header with Switch Staff (Demo Mode) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black">
            {myProfile?.user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome back, {myProfile?.user.name}!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              {myProfile?.user.role.name} • {myProfile?.shiftType} SHIFT • Joined {myProfile ? new Date(myProfile.joiningDate).toISOString().split('T')[0] : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all mr-2"
            onClick={() => window.location.href = '/dashboard/attendance'}
          >
            <QrCode className="w-4 h-4" /> Scan QR
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Act as:</span>
          <select 
            value={actingAsId} 
            onChange={(e) => setActingAsId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
          >
            {staffProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.user.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Days</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{presentDays} <span className="text-sm text-slate-400 font-bold">/ {new Date(currentYear, currentMonth, 0).getDate()}</span></p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Hours</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{totalHours.toFixed(1)} <span className="text-sm text-slate-400 font-bold">h</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
            <Banknote className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Salary</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(estimatedSalary)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Status */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Today's Attendance</h3>
            <span className="text-xs font-bold text-slate-400">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            {!todayRecord ? (
              <>
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Not Clocked In Yet</p>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Head over to the Attendance module to start your shift.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">In Shift: {todayRecord.status}</p>
                  <div className="mt-4 grid grid-cols-2 gap-8 text-left">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Time</p>
                      <p className="font-bold text-slate-700 flex items-center"><LogIn className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {todayRecord.checkInTime ? new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out Time</p>
                      <p className="font-bold text-slate-700 flex items-center"><LogOut className="w-3.5 h-3.5 mr-1 text-rose-500" /> {todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly Attendance Log */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">Monthly Log</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">April 2026</span>
          </div>
          <div className="overflow-y-auto max-h-[320px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myMonthlyAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold italic">No records found for this month.</td>
                  </tr>
                ) : myMonthlyAttendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        record.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800">{record.totalHours?.toFixed(1) || '0.0'}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
