const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  const user = await prisma.user.findUnique({ where: { email: 'admin@spicehub.com' } })
  if (!user) {
    console.log('User not found')
  } else {
    console.log('User found:', user.email)
    const isValid = await bcrypt.compare('password123', user.hashedPassword)
    console.log('Password valid:', isValid)
  }
  await prisma.$disconnect()
}

main()
