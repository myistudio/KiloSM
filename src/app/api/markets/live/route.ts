import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const str = formatter.format(now) // e.g. "13:45"
  return toMinutes(str)
}

function getISTMinutesFrom(date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const str = formatter.format(date)
  return toMinutes(str)
}

function getISTDateOnly(): Date {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = fmt.formatToParts(now)
  const y = Number(parts.find(p => p.type === 'year')?.value)
  const m = Number(parts.find(p => p.type === 'month')?.value)
  const d = Number(parts.find(p => p.type === 'day')?.value)
  return new Date(Date.UTC(y, m - 1, d))
}

function getISTDayEnum(): string {
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' })
  const wk = fmt.format(new Date()).toUpperCase()
  // Ensure it matches the DayOfWeek enum in the database
  // Intl may return e.g. "THURSDAY" etc.
  return wk
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const todayIST = getISTDateOnly()
    const dayEnum = getISTDayEnum()

    const markets = await prisma.market.findMany({
      where: { isActive: true, operatingDays: { has: dayEnum as any } },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        openTime: true,
        closeTime: true,
        resultTime: true,
        sortOrder: true,
        isActive: true,
        results: {
          where: { date: todayIST },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            id: true,
            date: true,
            openResult: true,
            closeResult: true,
            status: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    const nowMin = getISTMinutesNow()

    // Load configurable visibility settings with sensible defaults
    const cfgRows = await prisma.appSetting.findMany({
      where: { key: { in: ['LIVE_PRE_WINDOW_MINUTES', 'LIVE_POST_WINDOW_MINUTES'] } },
      select: { key: true, value: true },
    })
    const cfg: Record<string, any> = {}
    for (const r of cfgRows) {
      try { cfg[r.key] = JSON.parse(r.value) } catch { cfg[r.key] = r.value }
    }
    const preMin = Number.isFinite(Number(cfg['LIVE_PRE_WINDOW_MINUTES'])) ? Number(cfg['LIVE_PRE_WINDOW_MINUTES']) : 15
    const postMin = Number.isFinite(Number(cfg['LIVE_POST_WINDOW_MINUTES'])) ? Number(cfg['LIVE_POST_WINDOW_MINUTES']) : 15

    const live = markets
      .map((m) => {
        const openMin = toMinutes(m.openTime)
        const closeMin = toMinutes(m.closeTime)
        const latest = Array.isArray(m.results) && m.results.length > 0 ? m.results[0] : null

        // Two visibility windows based on the workflow:
        // - Open window: show from preMin before openTime until postMin after openTime
        // - Close window: show from preMin before closeTime until postMin after closeTime
        const visibleOpen = nowMin >= (openMin - preMin) && nowMin <= (openMin + postMin)
        const visibleClose = nowMin >= (closeMin - preMin) && nowMin <= (closeMin + postMin)
        let visible = visibleOpen || visibleClose

        const hasOpen = !!latest?.openResult
        const hasClose = !!latest?.closeResult
        const status = (hasOpen || hasClose) ? 'live' : 'loading'

        // Additional rule: once the final (close) result is entered, hide market after postMin minutes from entry time
        if (hasClose && latest?.updatedAt) {
          const finalMin = getISTMinutesFrom(latest.updatedAt as Date)
          if (nowMin > (finalMin + postMin)) {
            visible = false
          }
        }

        if (!visible) return null

        return {
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          openTime: m.openTime,
          closeTime: m.closeTime,
          resultTime: m.resultTime,
          status,
          latestResult: latest ? {
            id: latest.id,
            date: latest.date,
            openResult: latest.openResult ?? null,
            closeResult: latest.closeResult ?? null,
            format: latest.status,
            isPublished: latest.isPublished,
            createdAt: latest.createdAt,
            updatedAt: latest.updatedAt,
          } : null,
        }
      })
      .filter(Boolean)

    return NextResponse.json(
      { markets: live },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching live markets:', error)
    return NextResponse.json({ error: 'Failed to fetch live markets' }, { status: 500 })
  }
}