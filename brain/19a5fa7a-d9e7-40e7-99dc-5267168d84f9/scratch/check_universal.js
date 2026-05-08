const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const restaurant = await prisma.restaurant.findFirst({
    where: { name: 'Universal Dining' },
    include: {
      staffProfiles: true,
      orders: { include: { items: true } },
      bills: true,
      attendance: true,
      salaryRecords: true
    }
  })
  console.log(JSON.stringify(restaurant, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
