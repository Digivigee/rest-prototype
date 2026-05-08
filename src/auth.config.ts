import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = (user as any).userType
        token.restaurantId = (user as any).restaurantId
        token.branchId = (user as any).branchId
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).userType = token.userType;
        (session.user as any).restaurantId = token.restaurantId;
        (session.user as any).branchId = token.branchId;
        (session.user as any).role = token.role;
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
