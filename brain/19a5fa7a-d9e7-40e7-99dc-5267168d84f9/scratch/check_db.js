const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })
  console.log(JSON.stringify(order, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
