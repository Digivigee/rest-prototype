'use client'

import { useState } from 'react'
import { createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, createCategory, updateCategory, deleteCategory, uploadMenuItemImage, saveRecipe } from './actions'
import { Plus, Search, Edit2, Trash2, Filter, UtensilsCrossed, CheckCircle, XCircle, Upload, Loader2, BookOpen } from 'lucide-react'
import { formatCurrency } from '@/lib/config'
import { useToast } from '@/lib/ToastContext'

type MenuItem = any;
type Category = any;

export default function MenuClient({ initialItems, categories, inventoryItems = [] }: { initialItems: MenuItem[], categories: Category[], inventoryItems?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [recipeMenuItem, setRecipeMenuItem] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const { showToast } = useToast()

  const filteredItems = initialItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCat === 'ALL' || item.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setImageUrl(item.imageUrl || '')
    setIsModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadMenuItemImage(formData)
      setImageUrl(url)
      showToast('Image uploaded', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuItem(id)
        showToast('Item deleted successfully', 'success')
      } catch (e: any) {
        showToast(e.message, 'error')
      }
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleAvailability(id, current)
      showToast('Availability updated', 'success')
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const data = Object.fromEntries(formData.entries())
      
      const isAvailable = !!formData.get('isAvailable')
      const price = parseFloat(formData.get('price') as string)
      const costPrice = parseFloat(formData.get('costPrice') as string) || 0
      if (isNaN(price)) throw new Error("Invalid price")

      const finalData = {
        ...data,
        price,
        costPrice,
        isAvailable,
        imageUrl,
        quantityInGrams: data.quantityInGrams ? parseInt(data.quantityInGrams as string) : null,
        prepTime: data.prepTime ? parseInt(data.prepTime as string) : null
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, finalData)
        showToast('Item updated successfully', 'success')
      } else {
        await createMenuItem(finalData)
        showToast('Item created successfully', 'success')
      }
      setIsModalOpen(false)
      setEditingItem(null)
    } catch(err: any) {
      showToast("Error: " + err.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, filter and categorize your restaurant offerings.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsCatModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors flex items-center shadow-sm">
            Categories
          </button>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search dishes or descriptions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select 
              value={selectedCat} 
              onChange={(e) => setSelectedCat(e.target.value)}
              className="border border-slate-200 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white shadow-sm w-full sm:w-auto"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {filteredItems.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <UtensilsCrossed className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No items found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prep Time</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <div className="w-12 h-12 rounded-lg bg-cover bg-center mr-4 border border-slate-100 shadow-sm" style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mr-4 text-slate-400">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-sm flex items-center">
                            {item.name}
                            {item.quantityInGrams && (
                              <span className="ml-2 text-[10px] font-extrabold uppercase tracking-tight bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                {item.quantityInGrams}g
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[250px]">{item.description || 'No description provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-600">{item.category.name}</td>
                    <td className="py-4 pr-6 text-sm font-black text-emerald-600">{formatCurrency(item.price)}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{item.prepTime ? `${item.prepTime} min` : '-'}</td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => handleToggle(item.id, item.isAvailable)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${item.isAvailable ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                        title="Click to toggle availability"
                      >
                        {item.isAvailable ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setRecipeMenuItem(item); setIsRecipeModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Recipe/Ingredients">
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-extrabold text-slate-800">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name <span className="text-rose-500">*</span></label>
                <input required name="name" defaultValue={editingItem?.name} placeholder="e.g. Garlic Bread" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea name="description" rows={2} defaultValue={editingItem?.description} placeholder="Brief description of the dish..." className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Selling Price (₹) <span className="text-rose-500">*</span></label>
                  <input required min="0" step="0.01" type="number" name="price" defaultValue={editingItem?.price} placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input min="0" step="0.01" type="number" name="costPrice" defaultValue={editingItem?.costPrice} placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity (Grams)</label>
                  <input type="number" min="1" name="quantityInGrams" defaultValue={editingItem?.quantityInGrams} placeholder="e.g. 250" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prep Time (mins)</label>
                  <input type="number" min="0" name="prepTime" defaultValue={editingItem?.prepTime} placeholder="15" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category <span className="text-rose-500">*</span></label>
                <select required name="categoryId" defaultValue={editingItem?.categoryId} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm">
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Item Image</label>
                <div className={`relative group border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all ${isUploading ? 'opacity-50' : 'hover:border-indigo-400 hover:bg-slate-50/50'}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center py-2">
                       <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                       <span className="text-[10px] font-black text-indigo-600 uppercase">Uploading...</span>
                    </div>
                  ) : imageUrl ? (
                    <div className="relative group/img flex flex-col items-center">
                       <img src={imageUrl} alt="Item" className="h-20 w-20 object-cover rounded-lg mb-2" />
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Image Ready</span>
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                          <Upload className="w-5 h-5 text-white" />
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                       <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                       <p className="text-[10px] font-black text-slate-500 uppercase">Upload Image</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center pt-2">
                <input type="hidden" name="isAvailable" value="false" />
                <input type="checkbox" id="isAvail" name="isAvailable" value="true" defaultChecked={editingItem ? editingItem.isAvailable : true} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <label htmlFor="isAvail" className="ml-2 block text-sm font-medium text-slate-700">Currently Available for Orders</label>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                  {isSubmitting ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCatModalOpen && (
        <CategoryModal 
          onClose={() => setIsCatModalOpen(false)} 
          categories={categories} 
          showToast={showToast}
        />
      )}

      {isRecipeModalOpen && recipeMenuItem && (
        <RecipeModal
          menuItem={recipeMenuItem}
          inventoryItems={inventoryItems}
          onClose={() => { setIsRecipeModalOpen(false); setRecipeMenuItem(null); }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

function CategoryModal({ onClose, categories, showToast }: { onClose: ()=>void, categories: Category[], showToast: any }) {
  const [submitting, setSubmitting] = useState(false)
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createCategory(fd.get('name') as string);
      (e.target as HTMLFormElement).reset();
      showToast('Category added', 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
    setSubmitting(false);
  }
  
  const handleDel = async (id: string) => {
    try { 
      await deleteCategory(id);
      showToast('Category deleted', 'success');
    } catch(e: any) { showToast(e.message, 'error'); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-base font-extrabold text-slate-800">Manage Categories</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input required name="name" placeholder="New Category Name..." className="flex-1 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm" />
            <button disabled={submitting} type="submit" className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50">
              <Plus className="w-4 h-4"/>
            </button>
          </form>
          
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">No categories found.</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-2">
              {categories.map(c => (
                <li key={c.id} className="py-3 flex justify-between items-center text-sm font-medium text-slate-700 bg-white group rounded-md hover:bg-slate-50 px-2 -mx-2 transition-colors">
                  {c.name}
                  <button onClick={()=>handleDel(c.id)} className="text-rose-400 hover:bg-rose-50 hover:text-rose-600 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100" title="Delete Category">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function RecipeModal({ menuItem, inventoryItems, onClose, showToast }: { menuItem: any, inventoryItems: any[], onClose: ()=>void, showToast: any }) {
  const [submitting, setSubmitting] = useState(false)
  const [recipeItems, setRecipeItems] = useState<Array<{ inventoryItemId: string, quantityUsed: number }>>(() => {
    if (menuItem.recipe && menuItem.recipe.items) {
      return menuItem.recipe.items.map((i: any) => ({
        inventoryItemId: i.inventoryItemId,
        quantityUsed: i.quantityUsed
      }))
    }
    return []
  })

  const handleSaveRecipe = async () => {
    setSubmitting(true)
    try {
      await saveRecipe(menuItem.id, recipeItems)
      showToast('Recipe updated successfully', 'success')
      onClose()
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const addIngredient = () => {
    setRecipeItems([...recipeItems, { inventoryItemId: '', quantityUsed: 0 }])
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setRecipeItems(newItems)
  }

  const removeIngredient = (index: number) => {
    const newItems = [...recipeItems]
    newItems.splice(index, 1)
    setRecipeItems(newItems)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-0">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Recipe for {menuItem.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ingredients deducted per order</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {recipeItems.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No ingredients added yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add ingredients to enable automatic stock deduction.</p>
              <button onClick={addIngredient} className="px-4 py-2 bg-white text-indigo-600 text-sm font-bold border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-50">
                + Add First Ingredient
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recipeItems.map((item, idx) => (
                <div key={idx} className="flex items-end gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ingredient</label>
                    <select
                      value={item.inventoryItemId}
                      onChange={(e) => updateIngredient(idx, 'inventoryItemId', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      <option value="">Select ingredient</option>
                      {inventoryItems.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity Used</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantityUsed || ''}
                      onChange={(e) => updateIngredient(idx, 'quantityUsed', parseFloat(e.target.value))}
                      placeholder="e.g. 250"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>
                  <button onClick={() => removeIngredient(idx)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition-colors mb-px">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <div className="pt-2">
                <button onClick={addIngredient} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Add Another Ingredient
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            Cancel
          </button>
          <button onClick={handleSaveRecipe} disabled={submitting} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
            {submitting ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  )
}
