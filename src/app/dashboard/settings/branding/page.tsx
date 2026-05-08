import { getBrandingData } from './actions'
import BrandingClient from './BrandingClient'
import { Palette, Lock } from 'lucide-react'

export default async function BrandingPage() {
  const branding = await getBrandingData()
  if (!branding) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Custom Branding</h1>
        <p className="text-slate-500 mt-1 font-medium">Personalize your restaurant's digital presence.</p>
      </div>

      <BrandingClient initialData={branding} />
    </div>
  )
}
