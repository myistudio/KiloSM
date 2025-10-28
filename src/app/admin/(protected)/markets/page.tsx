import { Suspense } from 'react'
import { MarketsTable } from '@/components/admin/markets/MarketsTable'
import { MarketForm } from '@/components/admin/markets/MarketForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export default async function MarketsPage() {
  const user = await getCurrentUser()

  // Real counts from database
  const [totalMarkets, activeMarkets] = await Promise.all([
    prisma.market.count(),
    prisma.market.count({ where: { isActive: true } }),
  ])

  const activePercent = totalMarkets > 0 ? Math.round((activeMarkets / totalMarkets) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Management</h1>
          <p className="text-muted-foreground">
            Manage Satta Matka markets, schedules, and results
          </p>
        </div>
        <MarketForm>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Market
          </Button>
        </MarketForm>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMarkets}</div>
            <p className="text-xs text-muted-foreground">
              Overall markets in system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMarkets}</div>
            <p className="text-xs text-muted-foreground">
              {activePercent}% of total markets
            </p>
          </CardContent>
        </Card>
        {/* Removed Today's Results and Pending Results cards per requirements */}
      </div>

      {/* Markets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Markets</CardTitle>
          <CardDescription>
            Manage market settings, schedules, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading markets...</div>}>
            <MarketsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}