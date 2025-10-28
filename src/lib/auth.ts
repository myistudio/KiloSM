import { NextAuthOptions, User, Session } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole, AccountStatus } from '../generated/prisma'

declare module 'next-auth' {
  interface User {
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[auth] Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.warn('[auth] User not found')
            return null
          }

          if (user.status !== AccountStatus.ACTIVE) {
            console.warn('[auth] User status not ACTIVE:', user.status)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.warn('[auth] Invalid password')
            return null
          }

          // Update last login timestamp (non-blocking)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          }).catch(() => {})

          console.info('[auth] Login successful')

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          }
        } catch (error) {
          console.error('[auth] Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    signOut: '/admin/logout',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Utility functions for checking authentication and authorization
export async function getServerSession() {
  // This will be implemented when we set up the API route
  return null
}

export function isAdmin(user: { role?: UserRole } | null | undefined): boolean {
  return user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN
}

export function isSuperAdmin(user: { role?: UserRole } | null | undefined): boolean {
  return user?.role === UserRole.SUPER_ADMIN
}

export function requireAuth(user: { role?: UserRole } | null | undefined) {
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function requireAdmin(user: { role?: UserRole } | null | undefined) {
  if (!isAdmin(user)) {
    throw new Error('Admin access required')
  }
  return user
}

export function requireSuperAdmin(user: { role?: UserRole } | null | undefined) {
  if (!isSuperAdmin(user)) {
    throw new Error('Super admin access required')
  }
  return user
}