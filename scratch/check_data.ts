import { prisma } from '../src/lib/prisma';

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      _count: {
        select: {
          staffProfiles: true,
          menuItems: true,
          orders: true,
        }
      }
    }
  });
  console.log('Restaurants:', JSON.stringify(restaurants, null, 2));

  const users = await prisma.user.findMany({
    include: {
      role: true
    }
  });
  console.log('Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error);
