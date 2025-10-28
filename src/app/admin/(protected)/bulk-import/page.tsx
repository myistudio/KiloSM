import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth-server'
import BulkImportClient from '@/components/admin/bulk-import/BulkImportClient'

export default async function BulkImportPage() {
  await getCurrentUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Import</h1>
        <p className="text-muted-foreground">Upload Excel to import Markets and Results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>Supported format: .xlsx. Use the demo template below.</CardDescription>
        </CardHeader>
        <CardContent>
          <BulkImportClient />
        </CardContent>
      </Card>
    </div>
  )
}