import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const profile = await prisma.profile.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, email: true, fullName: true, passwordHash: true },
        })
        if (!profile?.passwordHash) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          profile.passwordHash
        )
        if (!valid) return null

        return { id: profile.id, email: profile.email, name: profile.fullName }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
