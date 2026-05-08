const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const staffId = "cmolvklkw000dmyb8h5t0t4u3"
  console.log("Updating salary for staff:", staffId)
  
  const updated = await prisma.staffProfile.update({
    where: { id: staffId },
    data: {
      baseSalary: 30000,
      salaryType: 'MONTHLY'
    }
  })
  console.log("Updated staff profile:", JSON.stringify(updated, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
