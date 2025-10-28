import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateFixManager } from '@/components/admin/content/DateFixManager'
import { getCurrentUser } from '@/lib/auth-server'

export default async function AdminDateFixPage() {
  // Ensure user is fetched (protected layout enforces admin)
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Date Fix</h1>
          <p className="text-muted-foreground">Manage 4-digit fix for active markets displayed on the Date Fix page</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Fix Manager</CardTitle>
          <CardDescription>Update 4-digit date fix numbers per market under the User Content section</CardDescription>
        </CardHeader>
        <CardContent>
          <DateFixManager />
        </CardContent>
      </Card>
    </div>
  )
}