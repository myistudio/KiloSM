import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WeeklyJodiManager } from '@/components/admin/content/WeeklyJodiManager'
import { getCurrentUser } from '@/lib/auth-server'

export default async function AdminWeeklyJodiPage() {
  // Ensure user is fetched (protected layout enforces admin)
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Jodi</h1>
          <p className="text-muted-foreground">Manage 12 admin content blocks shown on the Weekly Jodi page</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Jodi Manager</CardTitle>
          <CardDescription>Update titles and content for keys WEEKLY_JODI_1..12 in the User Content section</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyJodiManager />
        </CardContent>
      </Card>
    </div>
  )
}