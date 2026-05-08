import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Multi-Tenant SaaS database...')

  const hashedDefaultPassword = await bcrypt.hash('password123', 10)

  // 1. Roles (Global)
  const roleNames = ['Owner', 'Admin', 'Manager', 'Waiter', 'Kitchen', 'Cashier']
  const roleMap: Record<string, string> = {}
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    })
    roleMap[name] = role.id
  }

  // 2. Create Restaurants
  const spiceHub = await prisma.restaurant.upsert({
    where: { slug: 'spicehub-downtown' },
    update: { name: 'SpiceHub Downtown' },
    create: {
      name: 'SpiceHub Downtown',
      slug: 'spicehub-downtown',
      planType: 'PRO',
      ownerId: 'owner_spicehub'
    }
  })

  const quickBite = await prisma.restaurant.upsert({
    where: { slug: 'quickbite-express' },
    update: { name: 'QuickBite Express' },
    create: {
      name: 'QuickBite Express',
      slug: 'quickbite-express',
      planType: 'BASIC',
      ownerId: 'owner_quickbite'
    }
  })

  // 3. Seed SpiceHub Downtown
  console.log(`Seeding data for ${spiceHub.name}...`)
  
  const adminEmail = 'admin@spicehub.com'
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { restaurantId: spiceHub.id, roleId: roleMap['Admin'] },
    create: {
      name: 'Ahmed Raza',
      email: adminEmail,
      hashedPassword: hashedDefaultPassword,
      userType: 'OWNER',
      roleId: roleMap['Admin'],
      restaurantId: spiceHub.id
    }
  })

  const tableData = [
    { number: 'T1', capacity: 4, status: 'AVAILABLE' },
    { number: 'T2', capacity: 2, status: 'OCCUPIED' },
  ]
  for (const t of tableData) {
    const existing = await prisma.table.findFirst({
      where: { number: t.number, restaurantId: spiceHub.id, branchId: null }
    })
    if (!existing) {
      await prisma.table.create({
        data: { ...t, restaurantId: spiceHub.id }
      })
    }
  }

  const categoryName = 'Starters'
  let starters = await prisma.menuCategory.findFirst({
    where: { name: categoryName, restaurantId: spiceHub.id, branchId: null }
  })
  if (!starters) {
    starters = await prisma.menuCategory.create({
      data: { name: categoryName, restaurantId: spiceHub.id }
    })
  }

  const itemName = 'Paneer Tikka'
  const existingItem = await prisma.menuItem.findFirst({
    where: { name: itemName, restaurantId: spiceHub.id, branchId: null }
  })
  if (!existingItem) {
    await prisma.menuItem.create({
      data: {
        name: itemName,
        price: 280,
        categoryId: starters.id,
        restaurantId: spiceHub.id,
        quantityInGrams: 200
      }
    })
  }

  // Staff for SpiceHub
  const rahulEmail = 'rahul@spicehub.com'
  const rahul = await prisma.user.upsert({
    where: { email: rahulEmail },
    update: { restaurantId: spiceHub.id },
    create: {
      name: 'Rahul Sharma',
      email: rahulEmail,
      hashedPassword: hashedDefaultPassword,
      userType: 'STAFF',
      roleId: roleMap['Waiter'],
      restaurantId: spiceHub.id
    }
  })

  // Inventory for SpiceHub
  let rice = await prisma.inventoryItem.findFirst({
    where: { name: 'Rice', restaurantId: spiceHub.id, branchId: null }
  })
  if (!rice) {
    rice = await prisma.inventoryItem.create({
      data: {
        name: 'Rice',
        unit: 'GRAM',
        currentStock: 1000,
        minStockLevel: 500,
        restaurantId: spiceHub.id
      }
    })
  } else {
    await prisma.inventoryItem.update({
      where: { id: rice.id },
      data: { currentStock: 1000 }
    })
  }

  // Recipe for Veg Pulav
  let pulav = await prisma.menuItem.findFirst({
    where: { name: 'Veg Pulav', restaurantId: spiceHub.id }
  })
  if (!pulav) {
    pulav = await prisma.menuItem.create({
      data: {
        name: 'Veg Pulav',
        price: 180,
        categoryId: starters.id, // Reusing starters for demo simplicity
        restaurantId: spiceHub.id
      }
    })
  }

  const recipe = await prisma.recipe.upsert({
    where: { menuItemId: pulav.id },
    update: {},
    create: {
      menuItemId: pulav.id,
      restaurantId: spiceHub.id
    }
  })

  await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } })
  await prisma.recipeItem.create({
    data: {
      recipeId: recipe.id,
      inventoryItemId: rice.id,
      quantityUsed: 250,
      restaurantId: spiceHub.id
    }
  })

  await prisma.staffProfile.upsert({
    where: { userId: rahul.id },
    update: { baseSalary: 18000 },
    create: {
      userId: rahul.id,
      restaurantId: spiceHub.id,
      salaryType: 'MONTHLY',
      baseSalary: 18000
    }
  })

  // 5. Seed Super Admin
  const superEmail = 'super@spicehub.com'
  await prisma.user.upsert({
    where: { email: superEmail },
    update: { userType: 'SUPER_ADMIN' },
    create: {
      name: 'Super Admin',
      email: superEmail,
      hashedPassword: await bcrypt.hash('superadmin123', 10),
      userType: 'SUPER_ADMIN',
      roleId: roleMap['Admin'],
      restaurantId: null
    }
  })

  console.log('Multi-Tenant database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
