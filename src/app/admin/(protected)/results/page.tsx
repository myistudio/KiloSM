import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { ResultEntryForm } from '@/components/admin/results/ResultEntryForm'
import { BulkResultEntry } from '@/components/admin/results/BulkResultEntry'
import { ResultsTable } from '@/components/admin/results/ResultsTable'
import { getCurrentUser } from '@/lib/auth-server'

async function getResultsStats() {
  // Mock data - will be replaced with actual database queries
  return {
    todayResults: 8,
    pendingResults: 3,
    totalMarkets: 12,
    nextResultTime: '14:30',
    nextMarket: 'KALYAN'
  }
}

export default async function ResultsPage() {
  const user = await getCurrentUser()
  const stats = await getResultsStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Result Management</h1>
          <p className="text-muted-foreground">
            Enter and manage Satta Matka results with validation and auto-calculation
          </p>
        </div>
        <div className="flex gap-2">
          <BulkResultEntry>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Bulk Entry
            </Button>
          </BulkResultEntry>
          <ResultEntryForm>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </ResultEntryForm>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayResults}</div>
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
            <div className="text-2xl font-bold text-orange-600">{stats.pendingResults}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting entry
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.nextResultTime}</div>
            <p className="text-xs text-muted-foreground">
              {stats.nextMarket}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarkets}</div>
            <p className="text-xs text-muted-foreground">
              Active markets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Result Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Next Result Due</p>
              <p className="text-sm text-blue-700">
                {stats.nextMarket} result should be entered by {stats.nextResultTime}
              </p>
            </div>
            <Button size="sm" className="ml-auto">
              Enter Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Management Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Results</TabsTrigger>
          <TabsTrigger value="pending">Pending Results</TabsTrigger>
          <TabsTrigger value="history">Result History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Results</CardTitle>
              <CardDescription>
                <span suppressHydrationWarning>
                  Results entered for {new Date().toLocaleDateString()}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable filter="today" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Results</CardTitle>
              <CardDescription>
                Markets awaiting result entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable filter="pending" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Result History</CardTitle>
              <CardDescription>
                Historical results and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable filter="history" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}