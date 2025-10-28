import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { redis } from '@/lib/redis'

function getTodayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function todayDayEnum(): string {
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
  return days[new Date().getDay()]
}

// Add helpers to compute IST time window visibility
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10))
  return h * 60 + m
}

function getISTMinutesNow(): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const str = formatter.format(now)
  return toMinutes(str)
}

export async function GET(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'history'
    const marketId = searchParams.get('marketId') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}

    if (marketId) where.marketId = marketId

    // Date range or specific day for non-pending filters
    if (from || to) {
      const range: any = {}
      if (from) range.gte = new Date(from)
      if (to) range.lte = new Date(to)
      where.date = range
    } else if (filter === 'today') {
      where.date = getTodayDateOnly()
    }

    if (filter === 'pending') {
      const today = getTodayDateOnly()
      const dayEnum = todayDayEnum()

      // Helpers to align with live section logic
      const toMinutesLocal = (hhmm: string): number => {
        const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10))
        return h * 60 + m
      }
      const getISTMinutesNowLocal = (): number => {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
        const str = formatter.format(now)
        return toMinutesLocal(str)
      }

      // Fetch active markets operating today with their latest result
      const markets = await prisma.market.findMany({
        where: {
          isActive: true,
          operatingDays: { has: dayEnum as any },
        },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          displayName: true,
          openTime: true,
          closeTime: true,
          resultTime: true,
          results: {
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            select: {
              id: true,
              date: true,
              openResult: true,
              closeResult: true,
            },
          },
        },
      })

      const nowMin = getISTMinutesNowLocal()
      const liveMarketIds = new Set<string>()

      markets.forEach((m) => {
        if (!m.resultTime) return
        const openMin = toMinutesLocal(m.openTime)
        const closeMin = toMinutesLocal(m.closeTime)
        const resultMin = toMinutesLocal(m.resultTime)
        const latest = Array.isArray(m.results) && m.results.length > 0 ? m.results[0] : null
        const hasOpen = !!latest?.openResult
        const hasClose = !!latest?.closeResult
        const pastRemoval = nowMin > (closeMin + 15) && hasOpen && hasClose
        const visible = nowMin >= (resultMin - 15) && !pastRemoval
        if (visible) liveMarketIds.add(m.id)
      })

      // Unpublished results for today, restricted to live markets
      const todaysUnpublished = await prisma.marketResult.findMany({
        where: {
          date: today,
          isPublished: false,
          ...(marketId ? { marketId } : {}),
          ...(liveMarketIds.size ? { marketId: { in: Array.from(liveMarketIds) } } : {}),
        },
        include: {
          market: {
            select: { id: true, name: true, displayName: true, openTime: true, closeTime: true },
          },
        },
      })

      const haveResultIds = new Set(todaysUnpublished.map(r => r.marketId))

      // Create stub entries ONLY for markets currently visible in live section
      const stubs = markets
        .filter(m => liveMarketIds.has(m.id) && !haveResultIds.has(m.id))
        .map(m => ({
          id: `stub-${m.id}`,
          marketId: m.id,
          marketName: m.displayName || m.name,
          date: today,
          openResult: null,
          closeResult: null,
          status: 'NO_RESULT',
          isPublished: false,
          createdAt: today,
          openTime: m.openTime,
          closeTime: m.closeTime,
        }))

      const mappedUnpublished = todaysUnpublished.map((r) => ({
        id: r.id,
        marketId: r.marketId,
        marketName: r.market?.displayName || r.market?.name || '',
        date: r.date,
        openResult: r.openResult ?? null,
        closeResult: r.closeResult ?? null,
        status: r.status,
        isPublished: r.isPublished,
        createdAt: r.createdAt,
        openTime: r.market?.openTime,
        closeTime: r.market?.closeTime,
      }))

      const response = [...stubs, ...mappedUnpublished]
        .sort((a, b) => (a.marketName || '').localeCompare(b.marketName || ''))

      return NextResponse.json({ results: response })
    }

    // Non-pending filters: today/history
    const results = await prisma.marketResult.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        market: {
          select: {
            id: true,
            name: true,
            displayName: true,
            openTime: true,
            closeTime: true,
          },
        },
      },
    })

    const response = results.map((r) => ({
      id: r.id,
      marketId: r.marketId,
      marketName: r.market?.displayName || r.market?.name || '',
      date: r.date,
      openResult: r.openResult ?? null,
      closeResult: r.closeResult ?? null,
      status: r.status,
      isPublished: r.isPublished,
      createdAt: r.createdAt,
      openTime: r.market?.openTime,
      closeTime: r.market?.closeTime,
    }))

    return NextResponse.json({ results: response })
  } catch (error) {
    console.error('Error fetching admin results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}

// Create or upsert a market result (by marketId + date)
export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()
    const { marketId, date, openResult, closeResult, status, isPublished, color } = body as {
      marketId: string
      date: string | Date
      openResult?: string | null
      closeResult?: string | null
      status?: string
      isPublished?: boolean
      color?: 'RED' | 'BLACK'
    }

    if (!marketId || !date) {
      return NextResponse.json({ error: 'marketId and date are required' }, { status: 400 })
    }

    // Normalize to date-only (UTC midnight)
    const d = new Date(date)
    const dateOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

    // Infer status if not provided
    const inferredStatus = status ?? 'SINGLE'

    // Load auto and window settings
    const settingsRows = await prisma.appSetting.findMany({
      where: { key: { in: ['RESULTS_AUTO_MODE_ENABLED', 'RESULTS_AUTO_PUBLISH_ON_COMPLETE', 'LIVE_PRE_WINDOW_MINUTES', 'LIVE_POST_WINDOW_MINUTES'] } },
    })
    const settingsMap: Record<string, any> = {}
    for (const s of settingsRows) {
      try { settingsMap[s.key] = JSON.parse(s.value) } catch { settingsMap[s.key] = s.value }
    }
    const autoMode = Boolean(settingsMap.RESULTS_AUTO_MODE_ENABLED)
    const autoPublishOnComplete = Boolean(settingsMap.RESULTS_AUTO_PUBLISH_ON_COMPLETE)
    const preMin = Number.isFinite(Number(settingsMap.LIVE_PRE_WINDOW_MINUTES)) ? Number(settingsMap.LIVE_PRE_WINDOW_MINUTES) : 15
    const postMin = Number.isFinite(Number(settingsMap.LIVE_POST_WINDOW_MINUTES)) ? Number(settingsMap.LIVE_POST_WINDOW_MINUTES) : 15

    // Fetch market timings
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { openTime: true, closeTime: true },
    })

    // Determine publish flag: publish immediately when any entry exists
    let publishFlag = typeof isPublished === 'boolean' ? isPublished : false
    const hasBoth = !!(openResult && closeResult)
    const hasAny = !!(openResult || closeResult)

    // Always publish when an entry is made; fall back to auto settings otherwise
    if (hasAny) {
      publishFlag = true
    } else if (autoMode && market) {
      const nowMin = getISTMinutesNow()
      const openMin = toMinutes(market.openTime)
      const closeMin = toMinutes(market.closeTime)
      const visibleOpen = nowMin >= (openMin - preMin) && nowMin <= (openMin + postMin)
      const visibleClose = nowMin >= (closeMin - preMin) && nowMin <= (closeMin + postMin)
      const withinWindow = visibleOpen || visibleClose

      if (withinWindow) publishFlag = true
      else if (autoPublishOnComplete && hasBoth) publishFlag = true
    } else if (autoMode && autoPublishOnComplete && hasBoth) {
      publishFlag = true
    }

    if (inferredStatus === 'NO_RESULT') publishFlag = false

    const saved = await prisma.marketResult.upsert({
      where: {
        marketId_date: { marketId, date: dateOnly },
      },
      update: {
        openResult: openResult ?? undefined,
        closeResult: closeResult ?? undefined,
        status: inferredStatus as any,
        isPublished: publishFlag,
        color: color ?? undefined,
      },
      create: {
        marketId,
        date: dateOnly,
        openResult: openResult ?? null,
        closeResult: closeResult ?? null,
        status: inferredStatus as any,
        isPublished: publishFlag,
        color: color ?? null,
      },
    })

    // Notify live results stream via Redis version bump
    try { await redis.incr('live_markets_version') } catch {}

    return NextResponse.json({ result: saved }, { status: 201 })
  } catch (error) {
    console.error('Error saving market result:', error)
    return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
  }
}

// Update a market result by id
export async function PATCH(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()
    const { id, openResult, closeResult, status, isPublished, date, color } = body as {
      id: string
      openResult?: string | null
      closeResult?: string | null
      status?: string
      isPublished?: boolean
      date?: string | Date
      color?: 'RED' | 'BLACK'
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Fetch existing to compute final values
    const existing = await prisma.marketResult.findUnique({
      where: { id },
      select: { openResult: true, closeResult: true, status: true, isPublished: true, date: true, marketId: true, market: { select: { openTime: true, closeTime: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'result not found' }, { status: 404 })
    }

    const newOpen = openResult !== undefined ? openResult : existing.openResult
    const newClose = closeResult !== undefined ? closeResult : existing.closeResult
    const newStatus = status ?? (existing.status as any)

    // Load auto and window settings
    const settingsRows = await prisma.appSetting.findMany({
      where: { key: { in: ['RESULTS_AUTO_MODE_ENABLED', 'RESULTS_AUTO_PUBLISH_ON_COMPLETE', 'LIVE_PRE_WINDOW_MINUTES', 'LIVE_POST_WINDOW_MINUTES'] } },
    })
    const settingsMap: Record<string, any> = {}
    for (const s of settingsRows) {
      try { settingsMap[s.key] = JSON.parse(s.value) } catch { settingsMap[s.key] = s.value }
    }
    const autoMode = Boolean(settingsMap.RESULTS_AUTO_MODE_ENABLED)
    const autoPublishOnComplete = Boolean(settingsMap.RESULTS_AUTO_PUBLISH_ON_COMPLETE)
    const preMin = Number.isFinite(Number(settingsMap.LIVE_PRE_WINDOW_MINUTES)) ? Number(settingsMap.LIVE_PRE_WINDOW_MINUTES) : 15
    const postMin = Number.isFinite(Number(settingsMap.LIVE_POST_WINDOW_MINUTES)) ? Number(settingsMap.LIVE_POST_WINDOW_MINUTES) : 15

    let finalIsPublished: boolean | undefined = typeof isPublished === 'boolean' ? isPublished : undefined
    if (finalIsPublished === undefined) {
      const hasBoth = !!(newOpen && newClose)
      const hasAny = !!(newOpen || newClose)

      // Publish immediately when any entry exists
      if (hasAny) {
        finalIsPublished = true
      } else if (autoMode && existing.market) {
        const nowMin = getISTMinutesNow()
        const openMin = toMinutes(existing.market.openTime)
        const closeMin = toMinutes(existing.market.closeTime)
        const visibleOpen = nowMin >= (openMin - preMin) && nowMin <= (openMin + postMin)
        const visibleClose = nowMin >= (closeMin - preMin) && nowMin <= (closeMin + postMin)
        const withinWindow = visibleOpen || visibleClose

        if (withinWindow) finalIsPublished = true
        else if (autoPublishOnComplete && hasBoth) finalIsPublished = true
      } else if (autoMode && autoPublishOnComplete && hasBoth) {
        finalIsPublished = true
      }

      if (newStatus === 'NO_RESULT') finalIsPublished = false
    }

    const data: any = {
      openResult: openResult ?? undefined,
      closeResult: closeResult ?? undefined,
      status: status ? (status as any) : undefined,
      isPublished: finalIsPublished !== undefined ? finalIsPublished : undefined,
      color: color ?? undefined,
    }

    if (date) {
      const d = new Date(date)
      data.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    }

    const updated = await prisma.marketResult.update({
      where: { id },
      data,
    })

    // Notify live results stream via Redis version bump
    try { await redis.incr('live_markets_version') } catch {}

    return NextResponse.json({ result: updated })
  } catch (error) {
    console.error('Error updating market result:', error)
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 })
  }
}

// Delete a market result by id
export async function DELETE(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    await prisma.marketResult.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting market result:', error)
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 })
  }
}