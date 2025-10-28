import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-server'

async function getDashboardStats() {
  const [
    totalMarkets,
    activeMarkets,
    totalResults,
    todayResults,
    totalSections,
    activeSections,
    totalUsers,
    recentActivity
  ] = await Promise.all([
    prisma.market.count(),
    prisma.market.count({ where: { isActive: true } }),
    prisma.marketResult.count(),
    prisma.marketResult.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.section.count(),
    prisma.section.count({ where: { isEnabled: true } }),
    prisma.user.count(),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        market: { select: { name: true } }
      }
    })
  ])

  return {
    totalMarkets,
    activeMarkets,
    totalResults,
    todayResults,
    totalSections,
    activeSections,
    totalUsers,
    recentActivity
  }
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Markets',
      value: stats.totalMarkets,
      description: `${stats.activeMarkets} active`,
      icon: BarChart3,
      trend: '+2 this month',
    },
    {
      title: 'Today\'s Results',
      value: stats.todayResults,
      description: 'Results entered today',
      icon: CheckCircle,
      trend: 'Updated 2h ago',
    },
    {
      title: 'Active Sections',
      value: stats.activeSections,
      description: `${stats.totalSections} total sections`,
      icon: Activity,
      trend: `${stats.activeSections}/${stats.totalSections} enabled`,
    },
    {
      title: 'System Users',
      value: stats.totalUsers,
      description: 'Registered users',
      icon: Users,
      trend: '+1 this week',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your Satta Matka website today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions performed in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user?.name || 'Unknown'} • {activity.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Market
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Enter Results
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Update Content
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Market Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Market Status Overview</CardTitle>
          <CardDescription>
            Current status of all markets and recent results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Next Result Time:</span>
              </div>
              <Badge variant="secondary">14:30 (Kalyan)</Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-muted-foreground">Active Markets</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">8</div>
                <div className="text-sm text-muted-foreground">Results Today</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-sm text-muted-foreground">Pending Results</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}