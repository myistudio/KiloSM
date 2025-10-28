import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionManager } from '@/components/admin/content/SectionManager'
import { getCurrentUser } from '@/lib/auth-server'

export default async function SectionsPage() {
  // Ensure user is fetched (protected layout enforces admin)
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sections</h1>
          <p className="text-muted-foreground">
            Manage visibility and order of all website sections
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Management</CardTitle>
          <CardDescription>
            Toggle sections on/off and manage their display order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionManager />
        </CardContent>
      </Card>
    </div>
  )
}