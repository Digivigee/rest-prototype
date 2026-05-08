const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orderId = "cmolw5zno000mmyb80w7apeml"
  const restaurantId = "cmolvga7y0001myb8z95gsjhg"
  
  console.log("Attempting to create bill...")
  try {
    const bill = await prisma.bill.create({
      data: {
        orderId: orderId,
        restaurantId: restaurantId,
        subtotal: 350,
        tax: 17.5,
        serviceCharge: 35,
        total: 402.5,
        status: 'PAID'
      }
    })
    console.log("Bill created successfully:", bill.id)
  } catch (e) {
    console.error("Bill creation failed!")
    console.error(e)
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
