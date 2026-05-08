const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const staff = await prisma.staffProfile.findMany({
    include: { user: true }
  })
  console.log(JSON.stringify(staff, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
