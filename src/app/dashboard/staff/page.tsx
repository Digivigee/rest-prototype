'use client'

import { useState, useEffect } from 'react'
import { canAccess, ROLE_META, ROLE_PERMISSIONS, Role } from '@/lib/roles'
import AccessDenied from '@/components/ui/AccessDenied'
import { Users, Shield, ChefHat, CreditCard, LayoutDashboard, User, UserPlus, X, Link as LinkIcon, Check, Copy, CheckCircle2, Zap } from 'lucide-react'
import { getStaff, getBillingStatus, deleteStaff, updateStaffProfile } from './actions'
import { createInvite } from './invite-actions'
import Link from 'next/link'

const roleIcons: Record<Role, React.ReactNode> = {
  ADMIN: <Shield className="w-5 h-5" />,
  MANAGER: <LayoutDashboard className="w-5 h-5" />,
  WAITER: <User className="w-5 h-5" />,
  KITCHEN: <ChefHat className="w-5 h-5" />,
  CASHIER: <CreditCard className="w-5 h-5" />,
  OWNER: <Shield className="w-5 h-5" />,
  SUPER_ADMIN: <Shield className="w-5 h-5" />,
}

const roleColorBorders: Record<Role, string> = {
  ADMIN: 'border-purple-200 bg-purple-50/30',
  MANAGER: 'border-indigo-200 bg-indigo-50/30',
  WAITER: 'border-blue-200 bg-blue-50/30',
  KITCHEN: 'border-orange-200 bg-orange-50/30',
  CASHIER: 'border-emerald-200 bg-emerald-50/30',
  OWNER: 'border-rose-200 bg-rose-50/30',
  SUPER_ADMIN: 'border-slate-300 bg-slate-50/30',
}

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingInfo, setBillingInfo] = useState<any>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [roles, setRoles] = useState<any[]>([])
  const [isCopying, setIsCopying] = useState(false)

  // In a real app, we'd get the user role from the session. 
  const currentUserRole = 'ADMIN' 

  const loadData = async () => {
    try {
      const [staffData, rolesData, billingData] = await Promise.all([
        getStaff(),
        fetch('/api/roles').then(res => res.json()),
        getBillingStatus()
      ])
      setStaff(staffData)
      setRoles(rolesData)
      setBillingInfo(billingData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createInvite(inviteEmail, inviteRole)
      setInviteLink(res.joinLink)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return
    try {
      await deleteStaff(id)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateStaffProfile(editingStaff.id, {
        name: editingStaff.name,
        salaryType: editingStaff.staffProfile.salaryType,
        baseSalary: Number(editingStaff.staffProfile.baseSalary),
        isActive: editingStaff.staffProfile.isActive
      })
      setIsEditModalOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setIsCopying(true)
    setTimeout(() => setIsCopying(false), 2000)
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const groupedByRole = (Object.keys(ROLE_META) as Role[]).map(r => ({
    role: r,
    members: staff.filter(s => s.role === r),
  })).filter(g => g.members.length > 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-indigo-500" /> Staff Management
            {billingInfo && (
              <span className={`ml-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                billingInfo.usage.staff >= billingInfo.limits.maxStaff 
                  ? 'bg-rose-50 text-rose-600 border-rose-100' 
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {billingInfo.usage.staff} / {billingInfo.limits.maxStaff} {billingInfo.planType} Limit
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage your restaurant team and permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" /> Invite Staff
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600">
              <h3 className="text-lg font-black text-white">Invite Team Member</h3>
              <button onClick={() => { setIsInviteModalOpen(false); setInviteLink(''); }} className="text-indigo-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {!inviteLink ? (
                <form onSubmit={handleInvite} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assign Role</label>
                    <select 
                      required
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="">Select a role...</option>
                      {roles.filter(r => r.name !== 'Admin').map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                    Generate Invite Link <LinkIcon className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-700">Invite link generated!</p>
                  </div>
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-600 outline-none" />
                    <button onClick={copyToClipboard} className={`p-3 rounded-xl transition-all ${isCopying ? 'bg-emerald-600 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                      {isCopying ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <button onClick={() => { setIsInviteModalOpen(false); setInviteLink(''); }} className="w-full border border-slate-200 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600">
              <h3 className="text-lg font-black text-white">Edit Staff Member</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-indigo-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateStaff} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input 
                  value={editingStaff.name} 
                  onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Salary Type</label>
                  <select 
                    value={editingStaff.staffProfile.salaryType} 
                    onChange={(e) => setEditingStaff({...editingStaff, staffProfile: {...editingStaff.staffProfile, salaryType: e.target.value}})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="PER_DAY">Per Day</option>
                    <option value="PER_HOUR">Per Hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Base Salary</label>
                  <input 
                    type="number"
                    value={editingStaff.staffProfile.baseSalary || 0} 
                    onChange={(e) => setEditingStaff({...editingStaff, staffProfile: {...editingStaff.staffProfile, baseSalary: e.target.value}})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                <input 
                  type="checkbox"
                  checked={editingStaff.staffProfile.isActive}
                  onChange={(e) => setEditingStaff({...editingStaff, staffProfile: {...editingStaff.staffProfile, isActive: e.target.checked}})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-700">Active Employment</span>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Role permission overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(Object.keys(ROLE_META) as Role[]).map(r => {
          const meta = ROLE_META[r]
          return (
            <div key={r} className={`bg-white rounded-2xl border p-4 ${roleColorBorders[r]}`}>
              <div className={`w-10 h-10 rounded-xl ${meta.color} text-white flex items-center justify-center mb-3`}>
                {roleIcons[r]}
              </div>
              <h3 className="font-black text-slate-800 text-sm mb-1">{meta.label}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">{meta.description}</p>
              <p className="text-xs font-black text-slate-400">{ROLE_PERMISSIONS[r].length} module{ROLE_PERMISSIONS[r].length !== 1 ? 's' : ''}</p>
            </div>
          )
        })}
      </div>

      {/* Staff list grouped by role */}
      <div className="space-y-6">
        {groupedByRole.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No staff members found. Invite your team to get started!</p>
          </div>
        ) : groupedByRole.map(({ role: r, members }) => {
          const meta = ROLE_META[r]
          return (
            <div key={r} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${roleColorBorders[r]}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${meta.color} text-white flex items-center justify-center`}>
                    {roleIcons[r]}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-sm">{meta.label}</h2>
                    <p className="text-xs text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-50 text-left">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name / Status</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Type</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {members.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${meta.color} text-white text-xs font-black flex items-center justify-center shadow-sm`}>
                              {s.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-sm block">{s.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-bold">{s.email}</span>
                                {s.staffProfile?.isActive ? (
                                  <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-black uppercase tracking-tighter">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full" /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" /> Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-600">
                            {s.staffProfile?.joiningDate ? new Date(s.staffProfile.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">
                            {s.staffProfile?.salaryType || 'NOT SET'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingStaff(s); setIsEditModalOpen(true); }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteStaff(s.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}