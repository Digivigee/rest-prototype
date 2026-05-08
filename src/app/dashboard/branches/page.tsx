import { getBranches, createBranch, deleteBranch } from './actions'
import { MapPin, Plus, Trash2, Building2, ExternalLink } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function BranchesPage() {
  const branches = await getBranches()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Branch Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Create and manage your restaurant locations.</p>
        </div>
        
        <form action={async (fd) => {
          'use server'
          await createBranch({
            name: fd.get('name') as string,
            location: fd.get('location') as string
          })
        }} className="flex items-center gap-3">
          <input name="name" placeholder="Branch Name" required className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors" />
          <input name="location" placeholder="Location (optional)" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors" />
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No branches added yet</h3>
            <p className="text-slate-500 text-sm">Add your first location to get started with multi-branch management.</p>
          </div>
        ) : (
          branches.map((branch) => (
            <div key={branch.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <form action={async () => {
                  'use server'
                  await deleteBranch(branch.id)
                }}>
                  <button className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </form>
              </div>

              <h3 className="text-xl font-black text-slate-900">{branch.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                <MapPin className="w-4 h-4" />
                {branch.location || 'No location set'}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ID: {branch.id.slice(-8)}
                </span>
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-black">
                  View Data <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
