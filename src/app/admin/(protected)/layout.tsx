import { AdminLayout } from '@/components/admin/AdminLayout'
import { requireAdmin, getServerSession } from '@/lib/auth-server'
import { SessionProvider } from '@/components/providers/SessionProvider'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will throw and redirect if not authenticated
  await requireAdmin()

  const session = await getServerSession()

  return (
    <SessionProvider session={session}>
      <AdminLayout>{children}</AdminLayout>
    </SessionProvider>
  )
}