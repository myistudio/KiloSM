'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as XLSX from 'xlsx'

export default function BulkImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const downloadDemo = () => {
    // Create two sheets: Markets and Results
    const markets = [
      ['name','displayName','openTime','closeTime','operatingDays','isActive','sortOrder','descriptionLink','jodiChartLink','panelChartLink'],
      ['Kalyan','Kalyan','11:30','17:35','MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY','TRUE','1','/KALYAN','/KALYAN-JODI-CHART','/KALYAN-PANEL-CHART'],
      ['Milan Day','Milan Day','11:30','18:00','MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY','TRUE','2','/MILAN-DAY','/MILAN-DAY-JODI-CHART','/MILAN-DAY-PANEL-CHART']
    ]
    const results = [
      ['marketName','date','openResult','closeResult','status','isPublished'],
      ['Kalyan','2025-10-13','322-7','665-7','SINGLE','TRUE'],
      ['Milan Day','2025-10-13','123-6','','SINGLE','FALSE']
    ]

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet(markets)
    const ws2 = XLSX.utils.aoa_to_sheet(results)
    XLSX.utils.book_append_sheet(wb, ws1, 'Markets')
    XLSX.utils.book_append_sheet(wb, ws2, 'Results')
    XLSX.writeFile(wb, 'bulk-import-demo.xlsx')
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select an .xlsx file')
      return
    }
    setIsLoading(true)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/import/excel', {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }))
      if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`)
      setMessage(`Imported: ${data.summary?.markets || 0} markets, ${data.summary?.results || 0} results`)
    } catch (e: any) {
      setMessage(e?.message || 'Failed to import')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Prepare an Excel with two sheets named "Markets" and "Results" using the headers shown in the demo.
        </AlertDescription>
      </Alert>
      <div className="flex items-center gap-2">
        <Input type="file" accept=".xlsx" onChange={handleFileChange} className="max-w-sm" />
        <Button onClick={handleUpload} disabled={isLoading || !file}>{isLoading ? 'Uploading…' : 'Upload'}</Button>
        <Button variant="outline" onClick={downloadDemo}>Download Demo Excel</Button>
      </div>
      {message && (
        <div className="text-sm text-muted-foreground">{message}</div>
      )}
    </div>
  )
}