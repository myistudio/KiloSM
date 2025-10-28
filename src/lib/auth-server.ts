import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getServerSession()
  return session?.user || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    redirect('/admin/login?error=access-denied')
  }
  return user
}

export async function requireSuperAdmin() {
  const user = await requireAuth()
  if (user.role !== 'SUPER_ADMIN') {
    redirect('/admin/login?error=super-admin-required')
  }
  return user
}