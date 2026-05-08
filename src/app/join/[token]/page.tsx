'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getInviteByToken, joinRestaurant } from '../actions'
import { UserPlus, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function JoinPage() {
  const { token } = useParams()
  const [invite, setInvite] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await getInviteByToken(token as string)
        setInvite(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadInvite()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)
    setError('')

    try {
      await joinRestaurant(token as string, formData)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-2xl border border-rose-100">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Invalid Invite</h1>
          <p className="text-slate-500 font-medium mb-8">{error}</p>
          <button onClick={() => router.push('/login')} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl">
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-2xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Successfully Joined!</h1>
          <p className="text-slate-500 font-medium">You are now part of {invite.restaurant.name}. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-10 text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Join {invite.restaurant.name}</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Invited for: {invite.email}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Your Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 transition-colors font-medium"
                  placeholder="Rahul Sharma"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Create Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 transition-colors font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={joining}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Team <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
