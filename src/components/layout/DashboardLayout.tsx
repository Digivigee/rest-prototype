import DashboardLayoutClient from './DashboardLayoutClient';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { prisma } from '@/lib/prisma';
import { getRestaurants } from '@/app/dashboard/saas-actions';
import { getBranches } from '@/app/dashboard/branches/actions';
import { getActiveRestaurantId, getActiveBranchId, runWithTenant } from '@/lib/saas';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userType = (session.user as any).userType;
  const userRestaurantId = (session.user as any).restaurantId;

  const restaurants = await getRestaurants();
  const activeId = await getActiveRestaurantId() || userRestaurantId || (restaurants[0]?.id || '');
  
  const restaurant = activeId ? await prisma.restaurant.findUnique({ 
    where: { id: activeId },
    select: { logoUrl: true, themeColor: true } 
  }) : null;

  const branches = activeId ? await getBranches() : [];
  const activeBranchId = await getActiveBranchId();

  return runWithTenant(activeId, activeBranchId, async () => {
    return (
      <DashboardLayoutClient 
        themeColor={restaurant?.themeColor || null}
        sidebarProps={{
          restaurants: userType === 'SUPER_ADMIN' ? restaurants : [],
          activeId,
          branches,
          activeBranchId,
          logoUrl: restaurant?.logoUrl,
          themeColor: restaurant?.themeColor,
          userName: session.user?.name || '',
          userRole: userType === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (session.user as any).role
        }}
        navbarProps={{
          userName: session.user?.name || '',
          userRole: userType === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (session.user as any).role
        }}
      >
        {children}
      </DashboardLayoutClient>
    );
  }, userType);
}
