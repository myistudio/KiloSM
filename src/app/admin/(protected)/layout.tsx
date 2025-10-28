import { AdminLayout } from '@/components/admin/AdminLayout'
import { requireAdmin } from '@/lib/auth-server'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will throw and redirect if not authenticated
  await requireAdmin()

  return <AdminLayout>{children}</AdminLayout>
}