const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const restaurantId = "cmolvga7y0001myb8z95gsjhg"
  const now = new Date()
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

  console.log("Testing groupBy...")
  try {
    const res = await prisma.order.groupBy({
      by: ['userId'],
      where: { 
        restaurantId,
        userId: { not: null },
        createdAt: { gte: thirtyDaysAgo },
        status: 'SERVED'
      },
      _count: { id: true }
    })
    console.log("Result:", JSON.stringify(res, null, 2))
  } catch (e) {
    console.error("GroupBy Failed!")
    console.error(e)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
