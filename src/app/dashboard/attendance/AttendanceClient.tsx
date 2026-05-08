'use client'

import { useState } from 'react'
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, 
  ChevronLeft, ChevronRight, Edit2, UserMinus, LogIn, LogOut, QrCode
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { checkIn, checkOut, updateAttendance, markLeave } from './actions'
import { useToast } from '@/lib/ToastContext'
import { CONFIG } from '@/lib/config'

type AttendanceRecord = any
type StaffProfile = any

export default function AttendanceClient({ 
  staffProfiles, 
  initialAttendance, 
  isAdmin 
}: { 
  staffProfiles: StaffProfile[], 
  initialAttendance: AttendanceRecord[],
  isAdmin: boolean
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actingAsId, setActingAsId] = useState<string>(staffProfiles[0]?.id || '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const { showToast } = useToast()

  // Find acting user's profile and today's attendance
  const myProfile = staffProfiles.find(p => p.id === actingAsId)
  const todayStr = new Date().toISOString().split('T')[0]
  const myTodayRecord = initialAttendance.find(a => 
    a.staffId === actingAsId && 
    new Date(a.date).toISOString().split('T')[0] === todayStr
  )

  const filteredAttendance = initialAttendance.filter(a => 
    new Date(a.date).toISOString().split('T')[0] === selectedDate
  )

  const getLocalDateString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const handleCheckIn = async () => {
    if (!myProfile) return
    setIsSubmitting(true)
    try {
      const result = await checkIn(myProfile.id, getLocalDateString())
      if (result.success) {
        showToast('Checked in successfully', 'success')
      } else {
        showToast(result.error || 'Check-in failed', 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!myProfile) return
    setIsSubmitting(true)
    try {
      const result = await checkOut(myProfile.id, getLocalDateString())
      if (result.success) {
        showToast('Checked out successfully', 'success')
      } else {
        showToast(result.error || 'Check-out failed', 'error')
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      ABSENT: 'bg-rose-100 text-rose-700 border-rose-200',
      HALF_DAY: 'bg-amber-100 text-amber-700 border-amber-200',
      LEAVE: 'bg-blue-100 text-blue-700 border-blue-200',
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Self Service Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-black tracking-tight">Daily Attendance</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Act as:</span>
                <select 
                  value={actingAsId} 
                  onChange={(e) => setActingAsId(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm font-bold text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
                >
                  {staffProfiles.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-800">{p.user.name} ({p.user.role.name})</option>
                  ))}
                </select>
                <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg border border-white/10">{myProfile?.shiftType}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowQR(true)}
                className="px-4 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center"
              >
                <QrCode className="w-5 h-5 mr-2" /> Generate QR
              </button>
              {!myTodayRecord?.checkInTime ? (
                <button 
                  onClick={handleCheckIn}
                  disabled={isSubmitting || !myProfile}
                  className="px-6 py-3 bg-white text-indigo-600 font-black rounded-xl hover:bg-indigo-50 transition-all shadow-lg flex items-center disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5 mr-2" /> Check-In
                </button>
              ) : !myTodayRecord?.checkOutTime ? (
                <button 
                  onClick={handleCheckOut}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-all shadow-lg flex items-center disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5 mr-2" /> Check-Out
                </button>
              ) : (
                <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 text-white font-black rounded-xl flex items-center backdrop-blur-sm">
                  <CheckCircle className="w-5 h-5 mr-2" /> Shift Completed
                </div>
              )}
            </div>
          </div>
        </div>
        
        {myTodayRecord && (
          <div className="p-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/50">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-In</p>
              <p className="font-bold text-slate-700">{myTodayRecord.checkInTime ? new Date(myTodayRecord.checkInTime).toLocaleTimeString() : '--:--'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-Out</p>
              <p className="font-bold text-slate-700">{myTodayRecord.checkOutTime ? new Date(myTodayRecord.checkOutTime).toLocaleTimeString() : '--:--'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late</p>
              <p className={`font-bold ${myTodayRecord.lateMinutes > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {myTodayRecord.lateMinutes > 0 ? `${myTodayRecord.lateMinutes} mins` : 'No'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Hours</p>
              <p className="font-bold text-slate-700">{myTodayRecord.totalHours ? `${myTodayRecord.totalHours.toFixed(2)}h` : '--'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin View */}
      {(isAdmin) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
            <div>
              <h3 className="text-lg font-black text-slate-800">Staff Roster</h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">Review and manage attendance for all team members.</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-bold text-slate-700 border-none focus:ring-0 outline-none p-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Late</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffProfiles.map(staff => {
                  const record = filteredAttendance.find(a => a.staffId === staff.id)
                  const isEditing = editingId === record?.id

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs mr-3">
                            {staff.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{staff.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{staff.user.role.name} • {staff.shiftType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record ? getStatusBadge(record.status) : <span className="text-[10px] font-black text-slate-300 uppercase italic">Not Marked</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-600">
                          {record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          <span className="mx-1.5 opacity-30">→</span>
                          {record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record?.lateMinutes > 0 ? (
                          <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {record.lateMinutes}m
                          </span>
                        ) : record?.checkInTime ? (
                          <span className="text-xs font-black text-emerald-500 opacity-50">On Time</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-800">{record?.totalHours ? `${record.totalHours.toFixed(1)}h` : '--'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              if (!record) {
                                // Mark as Leave/Absent if no record
                                markLeave(staff.id, selectedDate, 'ABSENT')
                              } else {
                                // Logic for manual edit could go here
                                showToast('Manual edit coming soon', 'info')
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Quick Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => markLeave(staff.id, selectedDate, 'LEAVE')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Mark Leave"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">Scan to Check-In</h3>
                <button onClick={() => setShowQR(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><XCircle className="w-6 h-6" /></button>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex justify-center">
                <div 
                  className="bg-white p-4 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    handleCheckIn()
                    setShowQR(false)
                  }}
                  title="Click to simulate scan"
                >
                  <QRCodeSVG 
                    value={`${window.location.origin}/dashboard/attendance/scan?staffId=${actingAsId}`} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-600">Point your camera at the QR code</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-1.5 rounded-lg">
                  Valid for: {new Date().toLocaleDateString()}
                </p>
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium italic">
                (Prototype: Click the QR code above to simulate a successful scan)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
