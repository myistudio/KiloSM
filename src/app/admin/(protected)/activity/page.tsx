import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-server'

async function getActivityStats() {
  // Compute start of day in IST and convert to UTC boundary for database timestamps
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
  const [y, m, d] = fmt.format(now).split('-')
  const istMidnight = new Date(`${y}-${m}-${d}T00:00:00.000+05:30`)

  const [totalLogs, logsToday, recentActivity] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.count({
      where: { createdAt: { gte: istMidnight } },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        market: { select: { name: true, displayName: true } },
      },
    }),
  ])

  return { totalLogs, logsToday, recentActivity }
}

export default async function ActivityLogsPage() {
  await getCurrentUser()
  const stats = await getActivityStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">System activity history and audit trail</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">All-time entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Logs Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.logsToday}</div>
            <p className="text-xs text-muted-foreground">Since midnight</p>
          </CardContent>
        </Card>
        {/* Placeholder cards for future filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">Fetched records</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions performed in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity found.</p>
          )}
          {stats.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">
                    {activity.action}
                    {activity.market && (
                      <span className="text-xs text-muted-foreground"> — {(activity.market.displayName || activity.market.name)}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user?.name || 'Unknown'} • <span suppressHydrationWarning>{new Date(activity.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  </p>
                </div>
              </div>
              <Badge variant="outline">#{activity.id}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}