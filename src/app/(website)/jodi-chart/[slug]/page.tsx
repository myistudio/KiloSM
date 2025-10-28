import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import { SchemaScripts, buildMetadataFromTemplate, fillPlaceholdersDeep } from '@/lib/seo'
import LiveChartSSE from '@/components/LiveChartSSE'

type JodiChartPageProps = {
  params: { slug: string }
}

type MarketData = {
  id: string
  name: string
  displayName: string
  openTime: string
  closeTime: string
  operatingDays: string[]
  redDates: string[]
  results: {
    date: Date
    openResult: string | null
    closeResult: string | null
  }[]
}

const parseMarketSlug = (slug: string): string => {
  return slug.replace(/-jodi-chart$/i, '').toLowerCase().trim()
}

const formatResult = (open?: string | null, close?: string | null): { openPatti?: string; jodi?: string; closePatti?: string } => {
  if (!open || !close) return {}
  
  const openParts = String(open).split('-')
  const closeParts = String(close).split('-')
  
  if (openParts.length < 2) return {}
  
  const openPatti = openParts[0]
  const openDigit = openParts[1]
  
  if (closeParts.length === 3) {
    // Close has format xxx-jj-xxx
    const jodi = closeParts[1]
    const closePatti = closeParts[2]
    return { openPatti, jodi, closePatti }
  }
  
  if (closeParts.length >= 2) {
    // Close has format xxx-x
    const closePatti = closeParts[0]
    const closeDigit = closeParts[1]
    const jodi = `${openDigit}${closeDigit}`
    return { openPatti, jodi, closePatti }
  }
  
  return {}
}

const to12h = (hhmm: string): string => {
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const mm = String(m).padStart(2, '0')
  const hh = String(h).padStart(2, '0')
  return `${hh}:${mm} ${ampm}`
}

// Monday-based week start using UTC date (dates normalized to UTC midnight)
function getWeekStartUTC(date: Date): Date {
  const day = date.getUTCDay() // 0=Sun..6=Sat
  const offset = (day + 6) % 7 // Mon=0..Sun=6
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - offset)
  return d
}

function dayNameFromUTCDay(dayIdx: number): string {
  switch (dayIdx) {
    case 0: return 'SUNDAY'
    case 1: return 'MONDAY'
    case 2: return 'TUESDAY'
    case 3: return 'WEDNESDAY'
    case 4: return 'THURSDAY'
    case 5: return 'FRIDAY'
    case 6: return 'SATURDAY'
    default: return 'MONDAY'
  }
}

async function getMarketData(marketSlug: string): Promise<MarketData | null> {
  try {
    const norm = (s: string) => s.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')
    const target = norm(marketSlug)

    // Find matching active market by normalized name/displayName
    const candidates = await prisma.market.findMany({
      where: { isActive: true },
      select: { id: true, name: true, displayName: true, openTime: true, closeTime: true, operatingDays: true },
    })
    const matched = candidates.find((m) => norm(m.name) === target || norm(m.displayName) === target)

    // Attempt direct DB fetch if matched, otherwise fallback to public API
    if (matched) {
      const market = await prisma.market.findUnique({
        where: { id: matched.id },
        include: {
          results: {
            where: {
              isPublished: true,
              OR: [
                { openResult: { not: null } },
                { closeResult: { not: null } },
              ],
            },
            orderBy: { date: 'desc' },
            // removed take limit to include all results
          },
        },
      })

      if (!market) return null

      // Fetch RED entries from activity log (demo-seeded or admin-marked)
      const redLogs = await prisma.activityLog.findMany({
        where: {
          marketId: market.id,
          action: 'DEMO_SEED_RESULT',
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
      const redDates = redLogs
        .map((log) => {
          const d = (log.details as any)?.date
          const color = (log.details as any)?.color
          return typeof d === 'string' && color === 'RED' ? d : null
        })
        .filter(Boolean) as string[]

      return {
        id: market.id,
        name: market.name,
        displayName: market.displayName,
        openTime: market.openTime,
        closeTime: market.closeTime,
        operatingDays: market.operatingDays as unknown as string[],
        redDates,
        results: market.results.map((r) => ({
          date: r.date,
          openResult: r.openResult,
          closeResult: r.closeResult,
        })),
      }
    }

    // Fallback: resolve via public API using slug tolerant of separators/casing
    const apiSlug = marketSlug.trim().replace(/_/g, '-').replace(/\s+/g, '-')

    const mRes = await fetch(`/api/markets/${encodeURIComponent(apiSlug)}`, { cache: 'no-store' })
    if (!mRes.ok) return null
    const mJson = await mRes.json().catch(() => null)
    const marketBasic = mJson?.market
    if (!marketBasic?.id) return null

    const hRes = await fetch(`/api/markets/${encodeURIComponent(apiSlug)}/history?limit=365`, { cache: 'no-store' })
    const hJson = hRes.ok ? await hRes.json().catch(() => ({ results: [] })) : { results: [] }
    const historyResults = Array.isArray(hJson?.results) ? hJson.results : []

    // Fetch RED entries from activity log (demo-seeded or admin-marked)
    const redLogs = await prisma.activityLog.findMany({
      where: {
        marketId: marketBasic.id,
        action: 'DEMO_SEED_RESULT',
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    const redDates = redLogs
      .map((log) => {
        const d = (log.details as any)?.date
        const color = (log.details as any)?.color
        return typeof d === 'string' && color === 'RED' ? d : null
      })
      .filter(Boolean) as string[]

    return {
      id: marketBasic.id,
      name: marketBasic.name,
      displayName: marketBasic.displayName,
      openTime: marketBasic.openTime,
      closeTime: marketBasic.closeTime,
      operatingDays: (marketBasic.operatingDays || []) as string[],
      redDates,
      results: historyResults.map((r: any) => ({
        date: new Date(r.date),
        openResult: r.openResult ?? null,
        closeResult: r.closeResult ?? null,
      })),
    }
  } catch (error) {
    console.error('Error fetching market data:', error)
    return null
  }
}

export default async function JodiChartPage({ params }: JodiChartPageProps) {
  const marketSlug = parseMarketSlug(params.slug)
  const market = await getMarketData(marketSlug)
  
  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Jodi Chart</h1>
              <p className="text-slate-400">Market not found or inactive.</p>
            </div>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Market not found or inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Please check the URL or select a market from the home page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // RED set for coloring
  const redSet = new Set(market.redDates)
  const daysOrder = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
  const dayColumns = [...market.operatingDays].sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
  const dayColumnsAbbr = dayColumns.map(d => d.slice(0,3))

  // Build weekly grid: rows = weeks, columns = operating days
  type Cell = { text: string; red: boolean }
  const weeksMap = new Map<string, Map<string, Cell>>()
  for (const result of market.results) {
    const { openPatti, jodi, closePatti } = formatResult(result.openResult, result.closeResult)
    if (!openPatti || !jodi || !closePatti) continue
    const cellText = jodi
    const dateIso = result.date.toISOString()
    const red = redSet.has(dateIso)
    const weekKey = getWeekStartUTC(result.date).toISOString()
    const dowName = dayNameFromUTCDay(result.date.getUTCDay())
    if (!dayColumns.includes(dowName)) continue
    if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, new Map<string, Cell>())
    weeksMap.get(weekKey)!.set(dowName, { text: cellText, red })
  }
  const weekKeys = Array.from(weeksMap.keys()).sort((a, b) => (a < b ? 1 : -1)) // latest first

  // Calculate jodi statistics
  const jodiMap: Record<string, number> = {}
  const recentJodis: Array<{ date: string; jodi: string }> = []
  
  market.results.forEach(result => {
    const { jodi } = formatResult(result.openResult, result.closeResult)
    if (jodi) {
      jodiMap[jodi] = (jodiMap[jodi] || 0) + 1
      if (recentJodis.length < 20) {
        recentJodis.push({
          date: result.date.toLocaleDateString('en-IN'),
          jodi
        })
      }
    }
  })
  
  // Top jodis
  const topJodis = Object.entries(jodiMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  
  // Double digit jodi counts (00, 11, 22, ..., 99)
  const doubleCounts = Array.from({ length: 10 }, (_, d) => jodiMap[`${d}${d}`] || 0)
  
  // All jodis 00-99 with their counts
  const allJodis = Array.from({ length: 100 }, (_, i) => {
    const jodi = String(i).padStart(2, '0')
    return { jodi, count: jodiMap[jodi] || 0 }
  })
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{market.displayName} Jodi Chart</h1>
            <p className="text-slate-400">
              Market Timing: {to12h(market.openTime)} - {to12h(market.closeTime)}
            </p>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="flex gap-3 mb-8">
          <Link href={`/${market.name.toLowerCase()}-panel-chart`}>
            <Button variant="outline" className="bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50">
              Panel Chart
            </Button>
          </Link>
          <Link href={`/${market.name.toLowerCase()}`}>
            <Button variant="outline" className="bg-purple-900/30 border-purple-700/60 text-purple-200 hover:bg-purple-900/50">
              Market Details
            </Button>
          </Link>
        </div>

        {/* Weekly Jodi Table */}
        <Card className="bg-slate-800/50 border-slate-700 mb-[5px]">
          <CardHeader className="p-[5px]">
            <CardTitle className="text-white text-base sm:text-lg">{market.displayName} Jodi Chart</CardTitle>
          </CardHeader>
          <CardContent className="p-[5px]">
            <div className="overflow-x-auto">
              <table className="table-fixed w-full text-base sm:text-lg">
                <thead>
                  <tr>
                    {dayColumns.map((day) => (
                      <th key={day} className="px-1 py-0.5 text-slate-300 text-center font-semibold text-sm sm:text-base">
                        {day.slice(0,3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekKeys.length === 0 ? (
                    <tr>
                      <td className="px-1 py-0.5 text-slate-400 text-center" colSpan={dayColumns.length}>No weekly data available</td>
                    </tr>
                  ) : (
                    weekKeys.map((wk) => {
                      const row = weeksMap.get(wk)!
                      return (
                        <tr key={wk}>
                          {dayColumns.map((day) => {
                            const cell = row.get(day)
                            return (
                              <td key={day} className="px-1 py-0.5 text-center" data-cell-id={`${wk}:${day}`}>
                                {cell ? (
                                  <div className={`inline-flex w-full items-center justify-center border rounded-sm px-1.5 py-0.5 ${cell.red ? 'border-red-500 text-red-500 bg-red-900/20' : 'border-slate-600 text-white bg-slate-700/30'}`}>
                                    <span data-cell-role="jodi-value" className="font-mono font-bold leading-none text-base sm:text-lg">{cell.text}</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex w-full items-center justify-center border border-slate-700 rounded-sm px-1.5 py-0.5 text-slate-500">
                                    <span data-cell-role="jodi-value">-</span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <LiveChartSSE slug={market.name.toLowerCase()} chart="jodi" />
          </CardContent>
        </Card>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Double Jodi Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-pink-400">Double Jodi Chart (00, 11, 22...)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {doubleCounts.map((count, idx) => (
                  <div key={idx} className="bg-slate-700/40 p-2 rounded text-center">
                    <div className="font-mono text-sm text-white">{idx}{idx}</div>
                    <div className="text-pink-400 text-xs font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complete Jodi Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Complete Jodi Chart (00-99)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-1 max-h-96 overflow-y-auto">
                {allJodis.map(({ jodi, count }) => (
                  <div
                    key={jodi}
                    className={`p-1 rounded text-center text-xs ${
                      count > 0 ? 'bg-slate-700/60 text-white' : 'bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <div className="font-mono">{jodi}</div>
                    <div className="text-[10px] text-cyan-400">{count || '-'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        

        
        {/* Back to Home (Bottom) */}
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: JodiChartPageProps) {
  const marketSlug = parseMarketSlug(params.slug)
  const market = await getMarketData(marketSlug)

  // Load SEO template and site defaults
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['SEO_JODI_TEMPLATE', 'SITE_TITLE', 'SITE_TAGLINE'] } },
    select: { key: true, value: true },
  })
  const settings: Record<string, any> = {}
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  const ctx = {
    site: { title: settings.SITE_TITLE || 'Satta Matka', tagline: settings.SITE_TAGLINE || '', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
    market: market ? { name: market.name, displayName: market.displayName, openTime: market.openTime, closeTime: market.closeTime } : undefined,
  }
  
  if (!market) {
    // If template exists, still render metadata using context without market
    if (settings.SEO_JODI_TEMPLATE) {
      return buildMetadataFromTemplate(settings.SEO_JODI_TEMPLATE, ctx)
    }
    return { title: 'Jodi Chart Not Found', description: 'The requested jodi chart could not be found.' }
  }
  
  if (settings.SEO_JODI_TEMPLATE) {
    return buildMetadataFromTemplate(settings.SEO_JODI_TEMPLATE, ctx)
  }
  // Fallback
  return {
    title: `${market.displayName} Jodi Chart - Historical Results & Analysis`,
    description: `Complete jodi chart for ${market.displayName} market with historical results, frequency analysis, and statistics. Market timing: ${to12h(market.openTime)} - ${to12h(market.closeTime)}.`,
    keywords: [
      `${market.displayName} jodi chart`,
      `${market.name} jodi`,
      'satta matka jodi',
      'jodi chart analysis',
      'matka jodi frequency'
    ]
  }
}