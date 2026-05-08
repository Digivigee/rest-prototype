'use client'

import { useState } from 'react'
import { updateBranding, uploadBrandingLogo } from './actions'
import { Palette, Image as ImageIcon, Check, Zap, Lock, Info, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function BrandingClient({ initialData }: { initialData: any }) {
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || '')
  const [themeColor, setThemeColor] = useState(initialData.themeColor || '#4f46e5')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isPro = initialData.planType === 'PRO'

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const newUrl = await uploadBrandingLogo(formData)
      setLogoUrl(newUrl)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    try {
      await updateBranding({ 
        themeColor: isPro ? themeColor : undefined // Only save color if PRO
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant Logo</span>
                <div className="mt-1.5 relative group">
                  <div className={`w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${isUploading ? 'opacity-50' : 'hover:border-indigo-400 hover:bg-slate-50/50'}`}>
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    ) : logoUrl ? (
                      <div className="relative group/img">
                        <img src={logoUrl} alt="Logo" className="max-h-20 object-contain rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                           <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">Click to upload logo</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 ml-1">Use a square PNG or SVG with transparent background for best results.</p>
              </label>
            </div>

            <form onSubmit={handleSave} className="space-y-8 pt-4">
              <label className="block opacity-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Theme Color</span>
                  {!isPro && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      <Lock className="w-2.5 h-2.5" /> PRO Only
                    </span>
                  )}
                </div>
                <div className={`flex gap-3 items-center ${!isPro ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <input 
                    type="color" 
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-16 h-16 rounded-2xl border-none outline-none cursor-pointer bg-transparent"
                  />
                  <div className="flex-1 relative group">
                    <Palette className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#4f46e5"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-mono outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </label>

              {!isPro && (
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Zap className="w-4 h-4 fill-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 tracking-tight">Unlock Brand Customization</h4>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">Upgrade to PRO to apply your own theme color across the platform.</p>
                    <Link href="/dashboard/billing" className="text-xs font-black text-indigo-600 hover:underline mt-2 inline-block">Upgrade Now →</Link>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSaving}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  success ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isSaving ? 'Saving Changes...' : success ? (
                  <>
                    <Check className="w-4 h-4" /> Branding Saved
                  </>
                ) : (
                  'Save Branding'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden h-full flex flex-col justify-between shadow-2xl shadow-slate-200">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Palette className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: isPro ? themeColor : '#4f46e5' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                ) : (
                  <Zap className="w-6 h-6 fill-white text-white" />
                )}
              </div>
              <h3 className="font-black text-xl">Preview</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded-full opacity-20" style={{ backgroundColor: isPro ? themeColor : '#4f46e5' }} />
                <div className="h-10 w-full rounded-2xl bg-white/5 border border-white/10" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                   <div className="h-3 w-12 rounded-full bg-white/10" />
                   <div className="h-6 w-8 rounded-lg" style={{ backgroundColor: isPro ? themeColor : '#4f46e5' }} />
                </div>
                <div className="h-24 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                   <div className="h-3 w-12 rounded-full bg-white/10" />
                   <div className="h-6 w-8 rounded-lg" style={{ backgroundColor: isPro ? themeColor : '#4f46e5' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 border border-white/10">
            <Info className="w-5 h-5 text-indigo-300 shrink-0" />
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              Theme changes are applied globally to your sidebar, buttons, and dashboard indicators instantly after saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
