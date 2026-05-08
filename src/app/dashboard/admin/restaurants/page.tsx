import { getRestaurantsManagement } from '../actions'
import RestaurantManagementClient from './RestaurantManagementClient'

export default async function RestaurantsManagementPage() {
  const restaurants = await getRestaurantsManagement()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Restaurant Management</h1>
        <p className="text-slate-500 mt-1 font-medium">Control restaurant access, plans, and monitor usage.</p>
      </div>

      <RestaurantManagementClient initialRestaurants={restaurants} />
    </div>
  )
}
