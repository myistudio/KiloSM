import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-server'

export default async function AdminIndexPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/admin/dashboard')
  }
  redirect('/admin/login')
}