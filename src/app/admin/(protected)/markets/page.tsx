import { Suspense } from 'react'
import { MarketsTable } from '@/components/admin/markets/MarketsTable'
import { MarketForm } from '@/components/admin/markets/MarketForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-server'

async function getMarkets() {
  // This will be implemented with actual database queries
  return []
}

export default async function MarketsPage() {
  const user = await getCurrentUser()

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">10</div>
            <p className="text-xs text-muted-foreground">
              83% of total markets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">8</div>
            <p className="text-xs text-muted-foreground">
              Results entered today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting entry
            </p>
          </CardContent>
        </Card>
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