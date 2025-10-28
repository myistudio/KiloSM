import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { DayOfWeek, MarketStatus } from '@/generated/prisma'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  await requireAdmin()
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    // Parse XLSX via dynamic import to avoid edge issues
    const XLSX = await import('xlsx')
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })

    const marketsSheet = wb.Sheets['Markets']
    const resultsSheet = wb.Sheets['Results']
    if (!marketsSheet && !resultsSheet) {
      return NextResponse.json({ error: 'Workbook must contain sheets named "Markets" and/or "Results"' }, { status: 400 })
    }

    let marketsImported = 0
    let resultsImported = 0

    if (marketsSheet) {
      const marketsRows = XLSX.utils.sheet_to_json(marketsSheet, { header: 1 }) as any[][]
      // Expect header row
      const [header, ...rows] = marketsRows
      const idx = (k: string) => header.findIndex((h: any) => String(h).trim().toLowerCase() === k)
      const nameIdx = idx('name')
      const displayIdx = idx('displayname')
      const openIdx = idx('opentime')
      const closeIdx = idx('closetime')
      const daysIdx = idx('operatingdays')
      const activeIdx = idx('isactive')
      const sortIdx = idx('sortorder')
      const descIdx = idx('descriptionlink')
      const jodiIdx = idx('jodichartlink')
      const panelIdx = idx('panelchartlink')

      for (const r of rows) {
        const name = String(r[nameIdx] || '').trim()
        const displayName = String(r[displayIdx] || '').trim()
        const openTime = String(r[openIdx] || '').trim()
        const closeTime = String(r[closeIdx] || '').trim()
        const operatingDaysRaw = String(r[daysIdx] || '').trim()
        const isActiveRaw = String(r[activeIdx] || '').trim().toUpperCase()
        const sortOrderRaw = String(r[sortIdx] || '').trim()
        const descriptionLink = String(r[descIdx] || '').trim() || undefined
        const jodiChartLink = String(r[jodiIdx] || '').trim() || undefined
        const panelChartLink = String(r[panelIdx] || '').trim() || undefined

        if (!name || !displayName || !openTime || !closeTime) continue
        const operatingDays = operatingDaysRaw
          ? operatingDaysRaw.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
          : ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
        const isActive = isActiveRaw === 'TRUE' || isActiveRaw === 'YES' || isActiveRaw === '1'
        const sortOrder = Number(sortOrderRaw || '0') || 0

        await prisma.market.upsert({
          where: { name },
          update: {
            displayName,
            openTime,
            closeTime,
            resultTime: closeTime,
            operatingDays: operatingDays.map(d => (DayOfWeek as any)[d] ?? DayOfWeek.MONDAY),
            isActive,
            status: isActive ? MarketStatus.ACTIVE : MarketStatus.INACTIVE,
            sortOrder,
          },
          create: {
            name,
            displayName,
            openTime,
            closeTime,
            resultTime: closeTime,
            operatingDays: operatingDays.map(d => (DayOfWeek as any)[d] ?? DayOfWeek.MONDAY),
            isActive,
            status: isActive ? MarketStatus.ACTIVE : MarketStatus.INACTIVE,
            sortOrder,
          },
        })
        marketsImported++

        // Optionally create chart links under CHARTS section is handled in admin markets POST; skipping here to avoid extra logic
      }
    }

    if (resultsSheet) {
      const resultsRows = XLSX.utils.sheet_to_json(resultsSheet, { header: 1 }) as any[][]
      const [header, ...rows] = resultsRows
      const idx = (k: string) => header.findIndex((h: any) => String(h).trim().toLowerCase() === k)
      const marketNameIdx = idx('marketname')
      const dateIdx = idx('date')
      const openIdx = idx('openresult')
      const closeIdx = idx('closeresult')
      const statusIdx = idx('status')
      const publishedIdx = idx('ispublished')
      const colorIdx = idx('color')
      const isRedIdxCandidate = idx('isred')
      const redIdxCandidate = idx('red')
      const isRedIdx = isRedIdxCandidate >= 0 ? isRedIdxCandidate : redIdxCandidate

      for (const r of rows) {
        const marketName = String(r[marketNameIdx] || '').trim()
        const dateStr = String(r[dateIdx] || '').trim()
        const openResult = String(r[openIdx] || '').trim() || null
        const closeResult = String(r[closeIdx] || '').trim() || null
        const statusRaw = String(r[statusIdx] || '').trim() || 'SINGLE'

        // Determine publish flag: default publish if any entry exists when not provided
        let isPublished: boolean
        if (publishedIdx >= 0) {
          const isPublishedRaw = String(r[publishedIdx] || '').trim().toUpperCase()
          isPublished = isPublishedRaw === 'TRUE' || isPublishedRaw === 'YES' || isPublishedRaw === '1'
        } else {
          isPublished = Boolean(openResult || closeResult)
        }

        // Parse color / red flag if provided
        let color: 'RED' | 'BLACK' | null = null
        if (colorIdx >= 0) {
          const colorRaw = String(r[colorIdx] || '').trim().toUpperCase()
          if (colorRaw === 'RED' || colorRaw === 'BLACK') {
            color = colorRaw as any
          }
        }
        if (!color && isRedIdx >= 0) {
          const isRedRaw = String(r[isRedIdx] || '').trim().toLowerCase()
          const truthy = ['true', '1', 'yes', 'y', 'red'].includes(isRedRaw)
          color = truthy ? 'RED' : 'BLACK'
        }

        if (!marketName || !dateStr) continue
        const market = await prisma.market.findFirst({ where: { OR: [{ name: marketName }, { displayName: marketName }] }, select: { id: true } })
        if (!market) continue

        const d = new Date(dateStr)
        const dateOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

        await prisma.marketResult.upsert({
          where: { marketId_date: { marketId: market.id, date: dateOnly } },
          update: {
            openResult: openResult || undefined,
            closeResult: closeResult || undefined,
            status: statusRaw as any,
            isPublished,
            color: color ?? undefined,
          },
          create: {
            marketId: market.id,
            date: dateOnly,
            openResult: openResult || null,
            closeResult: closeResult || null,
            status: statusRaw as any,
            isPublished,
            color: color ?? null,
          },
        })
        resultsImported++
      }

      // Notify live results stream via Redis version bump
      try { await redis.incr('live_markets_version') } catch {}
    }

    return NextResponse.json({ success: true, summary: { markets: marketsImported, results: resultsImported } })
  } catch (error: any) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to import Excel' }, { status: 500 })
  }
}