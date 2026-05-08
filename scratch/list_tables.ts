import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result: any[] = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`
  console.log('Tables:', result.map(r => r.name).join(', '))
}

main().catch(console.error).finally(() => prisma.$disconnect())
