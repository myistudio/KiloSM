import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { ResultEntryForm } from '@/components/admin/results/ResultEntryForm'
import { BulkResultEntry } from '@/components/admin/results/BulkResultEntry'
import { ResultsTable } from '@/components/admin/results/ResultsTable'
import { getCurrentUser } from '@/lib/auth-server'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as RangeCalendar } from '@/components/ui/calendar'
import { HistoryRangePicker } from '@/components/admin/results/HistoryRangePicker'
import { ResultsManager } from '@/components/admin/results/ResultsManager'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

function formatDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function getResultsStats() {
  // Real data implementation
  // Totals
  const totalMarkets = await prisma.market.count()

  const hdrs = await headers()
  const cookie = hdrs.get('cookie') || ''
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3001'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`)

  // Fetch today and pending results via admin API (same logic as tables) and include session cookie
  const [todayResp, pendingResp] = await Promise.all([
    fetch(`${origin}/api/admin/results?filter=today`, { cache: 'no-store', headers: { cookie } }),
    fetch(`${origin}/api/admin/results?filter=pending`, { cache: 'no-store', headers: { cookie } }),
  ])

  const todayJson = todayResp && todayResp.ok ? await todayResp.json() : { results: [] }
  const pendingJson = pendingResp && pendingResp.ok ? await pendingResp.json() : { results: [] }

  const todayResults = Array.isArray(todayJson.results) ? todayJson.results.length : 0
  const pendingResults = Array.isArray(pendingJson.results) ? pendingJson.results.length : 0

  // Compute next result (IST)
  const fmtDay = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' })
  const dayEnum = fmtDay.format(new Date()).toUpperCase()

  const activeToday = await prisma.market.findMany({
    where: { isActive: true, operatingDays: { has: dayEnum as any } },
    select: { name: true, displayName: true, resultTime: true, closeTime: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  })

  const fmtTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' })
  const nowStr = fmtTime.format(new Date())
  const [h, m] = nowStr.split(':').map((s) => parseInt(s, 10))
  const nowMin = h * 60 + m
  const toMin = (hhmm?: string | null) => {
    if (!hhmm) return Number.POSITIVE_INFINITY
    const [hh, mm] = hhmm.split(':').map((s) => parseInt(s, 10))
    return hh * 60 + mm
  }

  let nextMarket = ''
  let nextResultTime = ''

  const upcoming = activeToday
    .map((m) => ({ m, rm: toMin(m.resultTime), cm: toMin(m.closeTime) }))
    .filter((x) => x.rm > nowMin || x.cm > nowMin)
    .sort((a, b) => (Math.min(a.rm, a.cm) - Math.min(b.rm, b.cm)))

  if (upcoming.length > 0) {
    const pick = upcoming[0]
    nextMarket = (pick.m.displayName || pick.m.name || '').toUpperCase()
    const timeStr = pick.m.resultTime || pick.m.closeTime || ''
    nextResultTime = timeStr
  } else if (activeToday.length > 0) {
    const pick = activeToday[0]
    nextMarket = (pick.displayName || pick.name || '').toUpperCase()
    nextResultTime = pick.resultTime || pick.closeTime || ''
  }

  return {
    todayResults,
    pendingResults,
    totalMarkets,
    nextResultTime,
    nextMarket,
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Redesigned Results Manager */}
      <ResultsManager />
    </div>
  )
}

// Remove inline client component at the bottom of the file