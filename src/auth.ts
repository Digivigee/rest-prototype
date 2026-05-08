import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('Authorize attempt for:', credentials.email)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true }
        })

        if (!user) {
          console.log('User not found:', credentials.email)
          return null
        }
        console.log('User found, comparing password...')

        if (!user.hashedPassword) {
          console.log('User has no password set')
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          restaurantId: user.restaurantId,
          branchId: user.branchId,
          role: user.role.name.toUpperCase()
        }
      }
    })
  ],
})
