import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoryRangePicker } from '@/components/admin/results/HistoryRangePicker'
import { getCurrentUser } from '@/lib/auth-server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ResultsHistoryPage() {
  const user = await getCurrentUser()
  // Optionally restrict or show user info, but page is under (protected) layout
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Admin / Results / History</p>
          <h1 className="text-3xl font-bold">Results History</h1>
          <p className="text-muted-foreground">Select a date range and edit past entries</p>
        </div>
        <Link href="/admin/results" className="inline-block">
          <Button variant="outline" size="sm">Back to Results</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Filter by date range or market. Click row actions to edit, publish, or mark no result.</CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryRangePicker />
        </CardContent>
      </Card>
    </div>
  )
}