'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerRestaurant } from './actions'
import { Utensils, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    restaurantName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await registerRestaurant(formData)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-2xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome Aboard!</h1>
          <p className="text-slate-500 font-medium">Your restaurant has been created. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-xl relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="md:col-span-2 bg-indigo-600 p-10 text-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                  <Utensils className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black lowercase tracking-tight">SpiceHub</h1>
                <p className="text-indigo-100 text-sm mt-4 font-medium leading-relaxed">
                  Join 500+ premium restaurants streamlining their operations with our platform.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-indigo-200 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> 30-Day Free Trial
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-indigo-200 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> No Credit Card Required
                </div>
              </div>
            </div>

            <div className="md:col-span-3 p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Create Restaurant</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Restaurant Name</label>
                    <input
                      type="text"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 transition-colors font-medium"
                      placeholder="e.g. SpiceHub Downtown"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Owner Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 transition-colors font-medium"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 transition-colors font-medium"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
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
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup <ArrowRight className="w-5 h-5" /></>}
                </button>

                <p className="text-center text-slate-400 text-xs font-medium pt-2">
                  Already have an account? <a href="/login" className="text-indigo-600 font-bold hover:underline">Sign In</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
