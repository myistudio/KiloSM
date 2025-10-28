import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SchemaScripts, buildMetadataFromTemplate, fillPlaceholdersDeep } from '@/lib/seo'
import LiveChartSSE from '@/components/LiveChartSSE'

type PanelChartPageProps = {
  params: { slug: string }
}

type MarketData = {
  id: string
  name: string
  displayName: string
  openTime: string
  closeTime: string
  results: {
    date: Date
    openResult: string | null
    closeResult: string | null
  }[]
  operatingDays?: string[]
  redDates?: string[]
}

const parseMarketSlug = (slug: string): string => {
  return slug.replace(/-panel-chart$/, '').toLowerCase()
}

const parsePanel = (res?: string | null): string | null => {
  if (!res) return null
  const parts = String(res).split('-')
  if (parts.length >= 1) return parts[0]
  return null
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

// Helpers to compute week and day names
function getWeekStartUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Monday as start
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function dayNameFromUTCDay(dayIdx: number): string {
  return ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][dayIdx]
}

// Parse open/close into patti and jodi
function formatResult(open?: string | null, close?: string | null): { openPatti?: string; jodi?: string; closePatti?: string } {
  const parseParts = (r?: string | null) => String(r || '').split('-').filter(Boolean)
  const o = parseParts(open)
  const c = parseParts(close)
  const openPatti = o.length >= 1 ? o[0] : undefined
  let jodi: string | undefined
  // Case 1: Close has explicit jodi: xxx-jj-xxx
  const cm = String(close || '').match(/^(\d{3})-(\d{2})-(\d{3})$/)
  if (cm) {
    jodi = cm[2]
  } else if (o.length >= 2 && c.length >= 2) {
    // Case 2: Derive jodi from open/close digits: xxx-x and xxx-x
    const openDigit = o[1]
    const closeDigit = c[1]
    jodi = `${openDigit}${closeDigit}`
  }
  const closePatti = c.length >= 3 ? c[2] : (c.length >= 1 ? c[0] : undefined)
  return { openPatti, jodi, closePatti }
}

async function getMarketData(marketSlug: string): Promise<MarketData | null> {
  try {
    const market = await prisma.market.findFirst({
      where: {
        name: { equals: marketSlug, mode: 'insensitive' },
        isActive: true
      },
      include: {
        results: {
          where: {
            isPublished: true,
            OR: [
              { openResult: { not: null } },
              { closeResult: { not: null } }
            ]
          },
          orderBy: { date: 'desc' },
          take: 100
        }
      }
    })
    
    if (!market) return null

    // Fetch RED entries from activity log similar to jodi chart
    const redLogs = await prisma.activityLog.findMany({
      where: { marketId: market.id, action: 'DEMO_SEED_RESULT' },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    const redDates = redLogs
      .map((log) => {
        const raw = (log.details as any)?.date
        const color = (log.details as any)?.color
        if (color !== 'RED' || typeof raw !== 'string') return null
        // Try to normalize to ISO YYYY-MM-DD
        let iso: string | null = null
        // Case 1: ISO-like input
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          const d = new Date(raw)
          if (!isNaN(d.getTime())) iso = d.toISOString().slice(0, 10)
        } else {
          // Case 2: DD/MM/YYYY
          const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
          if (m) {
            const [_, dd, mm, yyyy] = m
            const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)))
            if (!isNaN(d.getTime())) iso = d.toISOString().slice(0, 10)
          }
        }
        return iso
      })
      .filter((s): s is string => Boolean(s))
      .filter(Boolean) as string[]
    
    return {
      id: market.id,
      name: market.name,
      displayName: market.displayName,
      openTime: market.openTime,
      closeTime: market.closeTime,
      results: market.results.map(r => ({
        date: r.date,
        openResult: r.openResult,
        closeResult: r.closeResult
      })),
      operatingDays: (market as any).operatingDays,
      redDates,
    }
  } catch (error) {
    console.error('Error fetching market data:', error)
    return null
  }
}

export default async function PanelChartPage({ params }: PanelChartPageProps) {
  const marketSlug = parseMarketSlug(params.slug)
  const market = await getMarketData(marketSlug)
  
  if (!market) {
    notFound()
  }
  
  // Build weekly map of panels by operating days
  const daysOrder = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
  const operatingDays: string[] = (market.operatingDays || daysOrder)
  const dayColumns = [...operatingDays].sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
  const redSet = new Set(market.redDates || [])
  type Cell = { openPatti?: string; jodi?: string; closePatti?: string; red?: boolean }
  const weeksMap = new Map<string, Map<string, Cell>>()
  for (const result of market.results) {
    const { openPatti, jodi, closePatti } = formatResult(result.openResult, result.closeResult)
    const weekKey = getWeekStartUTC(new Date(result.date)).toISOString()
    const dowName = dayNameFromUTCDay(new Date(result.date).getUTCDay())
    const dateIso = new Date(result.date).toISOString().slice(0, 10)
    if (!dayColumns.includes(dowName)) continue
    if (!weeksMap.has(weekKey)) weeksMap.set(weekKey, new Map<string, Cell>())
    weeksMap.get(weekKey)!.set(dowName, { openPatti, jodi, closePatti, red: redSet.has(dateIso) })
  }
  const weekKeys = Array.from(weeksMap.keys()).sort((a, b) => (a < b ? 1 : -1)) // latest first

  const recentPanels: Array<{ date: string; openPanel: string | null; closePanel: string | null }> = []
  market.results.forEach(result => {
    const openPanel = parsePanel(result.openResult)
    const closePanel = parsePanel(result.closeResult)
    if (openPanel || closePanel) {
      if (recentPanels.length < 30) {
        recentPanels.push({
          date: result.date.toLocaleDateString('en-IN'),
          openPanel,
          closePanel
        })
      }
    }
  })
  
  // Frequency maps
  const openMap: Record<string, number> = {}
  const closeMap: Record<string, number> = {}
  recentPanels.forEach(it => {
    if (it.openPanel) openMap[it.openPanel] = (openMap[it.openPanel] || 0) + 1
    if (it.closePanel) closeMap[it.closePanel] = (closeMap[it.closePanel] || 0) + 1
  })
  
  const topOpen = Object.entries(openMap).sort(([, a], [, b]) => b - a).slice(0, 10)
  const topClose = Object.entries(closeMap).sort(([, a], [, b]) => b - a).slice(0, 10)
  
  // All panel numbers distribution 000-999 (grouped by hundreds)
  const panelBuckets: Array<{ label: string; open: number; close: number }> = []
  for (let h = 0; h < 10; h++) {
    const label = `${h}00-${h}99`
    const open = Object.entries(openMap).filter(([p]) => p?.startsWith(String(h))).reduce((acc, [, c]) => acc + c, 0)
    const close = Object.entries(closeMap).filter(([p]) => p?.startsWith(String(h))).reduce((acc, [, c]) => acc + c, 0)
    panelBuckets.push({ label, open, close })
  }

  // Load panel-specific JSON-LD schemas from settings and fill placeholders
  const schemaRows = await prisma.appSetting.findMany({
    where: { key: { in: ['SEO_PANEL_SCHEMAS'] } },
    select: { key: true, value: true },
  })
  let rawSchemas: any = []
  for (const row of schemaRows) {
    try {
      const parsed = JSON.parse(row.value)
      if (Array.isArray(parsed)) rawSchemas = parsed
    } catch {
      // ignore parse errors; expect array JSON
    }
  }
  const ctxSchemas = {
    site: { url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
    market: { name: market.name, displayName: market.displayName, openTime: market.openTime, closeTime: market.closeTime, openTime12: to12h(market.openTime), closeTime12: to12h(market.closeTime) },
  }
  const schemas = Array.isArray(rawSchemas) ? fillPlaceholdersDeep(rawSchemas, ctxSchemas) : []
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{market.displayName} Panel Chart</h1>
            <p className="text-slate-400">Market Timing: {to12h(market.openTime)} - {to12h(market.closeTime)}</p>
          </div>
        </div>

        {/* Schema Scripts */}
        <SchemaScripts schemas={schemas} />
        
        {/* Weekly Panel Table */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="p-0">
            <CardTitle className="text-white text-base sm:text-lg">Weekly Panel Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="table-fixed w-full text-[10px] sm:text-xs md:text-sm lg:text-base border border-slate-700 border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-slate-300 text-left border border-slate-700">Week</th>
                  {daysOrder.map((d) => (
                    <th key={d} className="px-2 py-2 text-slate-300 text-center border border-slate-700">{d.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekKeys.length === 0 ? (
                  <tr>
                    <td className="px-2 py-2 text-slate-400" colSpan={8}>No weekly data available</td>
                  </tr>
                ) : (
                  weekKeys.map((wk) => {
                    const row = weeksMap.get(wk)!
                    const weekStart = new Date(wk)
                    // Determine last operating day date for this week
                    const lastDayName = dayColumns[dayColumns.length - 1]
                    const lastDayOffset = daysOrder.indexOf(lastDayName) - daysOrder.indexOf('MONDAY')
                    const weekEnd = new Date(weekStart)
                    weekEnd.setUTCDate(weekStart.getUTCDate() + (lastDayOffset >= 0 ? lastDayOffset : 6))
                    return (
                      <tr key={wk} className="align-top">
                        <td className="px-2 py-2 text-slate-300 border border-slate-700">
                          <div className="text-slate-200 font-medium text-[7px] sm:text-[8px]">
                            {weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })} - {weekEnd.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </div>
                        </td>
                        {daysOrder.map((day) => {
                          const cell = row.get(day)
                          const open = cell?.openPatti
                          const jodi = cell?.jodi
                          const close = cell?.closePatti
                          const red = cell?.red
                          return (
                            <td key={`daycell-${day}`} className="px-0.5 sm:px-2 py-1 sm:py-2 align-top border border-slate-700" data-cell-id={`${wk}:${day}`}>
                              <div className="grid grid-cols-5 gap-0 sm:gap-2 divide-x divide-slate-700">
                                {/* Open Patti vertically */}
                                <div className="flex flex-col items-center justify-center h-full px-0 py-0">
                                  {open ? (
                                    <div className="flex flex-col items-center font-mono text-white py-1 w-fit mx-auto text-center">
                                      {open.split('').map((d, i) => (
                                        <span key={i} data-cell-role="open-patti" className="text-center leading-tight text-[8px] sm:text-[10px] md:text-xs lg:text-sm">{d}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span data-cell-role="open-patti" className="text-slate-500">-</span>
                                  )}
                                </div>
                                {/* Middle Jodi big */}
                                <div className="col-span-3 flex items-center justify-center h-full px-1 sm:px-2 py-0">
                                  <span data-cell-role="jodi-value" className={`px-[1px] font-mono font-bold text-[12px] sm:text-lg md:text-xl lg:text-2xl ${red ? 'text-red-500' : 'text-white'}`}>{jodi ? jodi.replace(/\D/g, '').padStart(2, '0').slice(-2) : '-'}</span>
                                </div>
                                {/* Close Patti vertically */}
                                <div className="flex flex-col items-center justify-center h-full px-0 py-0">
                                  {close ? (
                                    <div className="flex flex-col items-center font-mono text-white py-1 w-fit mx-auto text-center">
                                      {close.split('').map((d, i) => (
                                        <span key={i} data-cell-role="close-patti" className="text-center leading-tight text-[8px] sm:text-[10px] md:text-xs lg:text-sm">{d}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span data-cell-role="close-patti" className="text-slate-500">-</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            <LiveChartSSE slug={market.name.toLowerCase()} chart="panel" />
          </CardContent>
        </Card>
        {/* Quick Links */}
        <div className="flex gap-3 mb-8">
          <Link href={`/${market.name.toLowerCase()}-jodi-chart`}>
            <Button variant="outline" className="bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50">
              Jodi Chart
            </Button>
          </Link>
          <Link href={`/${market.name.toLowerCase()}`}>
            <Button variant="outline" className="bg-purple-900/30 border-purple-700/60 text-purple-200 hover:bg-purple-900/50">
              Market Details
            </Button>
          </Link>
        </div>
        
        {/* Back to Home (moved above disclaimer) */}
        <div className="mt-6">
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

export async function generateMetadata({ params }: PanelChartPageProps) {
  const marketSlug = parseMarketSlug(params.slug)
  const market = await getMarketData(marketSlug)

  // Load SEO template and site defaults
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['SEO_PANEL_TEMPLATE', 'SITE_TITLE', 'SITE_TAGLINE'] } },
    select: { key: true, value: true },
  })
  const settings: Record<string, any> = {}
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  const ctx = {
    site: { title: settings.SITE_TITLE || 'Satta Matka', tagline: settings.SITE_TAGLINE || '', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
    market: market ? { name: market.name, displayName: market.displayName, openTime: market.openTime, closeTime: market.closeTime, openTime12: to12h(market.openTime), closeTime12: to12h(market.closeTime) } : undefined,
  }

  if (settings.SEO_PANEL_TEMPLATE) {
    return buildMetadataFromTemplate(settings.SEO_PANEL_TEMPLATE, ctx)
  }

  if (!market) {
    return {
      title: 'Panel Chart Not Found',
      description: 'The requested panel chart could not be found.'
    }
  }
  
  return {
    title: `${market.displayName} Panel Chart - Historical Results & Analysis`,
    description: `Complete panel chart for ${market.displayName} market with historical results, frequency analysis, and statistics. Market timing: ${to12h(market.openTime)} - ${to12h(market.closeTime)}.`,
    keywords: [
      `${market.displayName} panel chart`,
      `${market.name} panel`,
      'satta matka panel',
      'panel chart analysis',
      'matka panel frequency'
    ]
  }
}