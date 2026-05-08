import { getPublicRestaurant } from './actions'
import MenuClient from './MenuClient'
import { notFound } from 'next/navigation'

export default async function PublicMenuPage({ params }: { params: { slug: string } }) {
  const restaurant = await getPublicRestaurant(params.slug)

  if (!restaurant) {
    notFound()
  }

  if (restaurant.status === 'BLOCKED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Service Unavailable</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            This restaurant is currently not accepting online orders. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Branding Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-primary: ${restaurant.themeColor || '#4f46e5'};
          --brand-primary-hover: ${restaurant.themeColor || '#4f46e5'}dd;
        }
      `}} />

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {restaurant.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name} className="w-6 h-6 object-contain" />
              ) : (
                <span className="font-black text-xl">{restaurant.name[0]}</span>
              )}
            </div>
            <h1 className="font-black text-lg tracking-tight text-slate-900">{restaurant.name}</h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Open Now</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <MenuClient restaurant={restaurant} />
      </main>
    </div>
  )
}
