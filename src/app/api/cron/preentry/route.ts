import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getISTDateOnly(): Date {
  // Create a Date representing current day in IST with time set to 00:00
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = fmt.formatToParts(now)
  const y = Number(parts.find(p => p.type === 'year')?.value)
  const m = Number(parts.find(p => p.type === 'month')?.value)
  const d = Number(parts.find(p => p.type === 'day')?.value)
  // Construct a Date in local timezone then adjust to IST date boundaries
  const date = new Date(Date.UTC(y, m - 1, d))
  return date
}

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

export const dynamic = 'force-dynamic'
export const revalidate = 0

// This endpoint can be triggered by a cron scheduler every minute.
// It ensures a blank MarketResult exists for each active market 15 minutes before its openTime (IST).
export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, openTime: true },
    })

    const nowMin = getISTMinutesNow()
    const todayIST = getISTDateOnly()

    let created = 0

    for (const m of markets) {
      const openMin = toMinutes(m.openTime)
      const shouldCreate = nowMin >= (openMin - 15) && nowMin < openMin
      if (!shouldCreate) continue

      // Upsert blank entry with unique (marketId, date)
      await prisma.marketResult.upsert({
        where: {
          marketId_date: {
            marketId: m.id,
            date: todayIST,
          },
        },
        update: {},
        create: {
          marketId: m.id,
          date: todayIST,
          status: 'SINGLE',
          isPublished: false,
          color: 'BLACK',
        },
      })
      created++
    }

    return NextResponse.json({ ok: true, created })
  } catch (error) {
    console.error('Error running pre-entry cron:', error)
    return NextResponse.json({ error: 'Failed to run pre-entry cron' }, { status: 500 })
  }
}