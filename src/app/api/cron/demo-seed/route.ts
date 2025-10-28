import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getDateOnly(daysAgo = 0): Date {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  // subtract daysAgo
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d
}

function randDigit(): string {
  return String(Math.floor(Math.random() * 10))
}

function randTriple(): string {
  return `${randDigit()}${randDigit()}${randDigit()}`
}

function sumDigitsMod10(triple: string): string {
  const s = triple.split('').reduce((acc, d) => acc + Number(d), 0)
  return String(s % 10)
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Demo seed endpoint: seeds 3 weeks (21 days) of results for all active markets
// Security: Enabled only in non-production environments
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const daysParam = Number(url.searchParams.get('days') || 21)
    const daysToSeed = Math.min(Math.max(daysParam, 1), 60) // cap to 60 days max

    const markets = await prisma.market.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    })

    const seeded: Array<{ marketId: string; date: Date; status: 'SINGLE' | 'DOUBLE' }> = []

    for (let i = 0; i < daysToSeed; i++) {
      const dateOnly = getDateOnly(i)

      for (const m of markets) {
        // Generate open result
        const openTriple = randTriple()
        const openSingle = sumDigitsMod10(openTriple)
        const openResult = `${openTriple}-${openSingle}`

        // Generate close result
        const closeTriple = randTriple()
        const closeSingle = sumDigitsMod10(closeTriple)
        const jodi = `${openSingle}${closeSingle}`

        // 30% probability of DOUBLE format for demo variety
        const isDouble = Math.random() < 0.3
        const closeResult = isDouble
          ? `${closeTriple}-${jodi}-${randTriple()}`
          : `${closeTriple}-${closeSingle}`

        const status: 'SINGLE' | 'DOUBLE' = isDouble ? 'DOUBLE' : 'SINGLE'

        await prisma.marketResult.upsert({
          where: {
            marketId_date: {
              marketId: m.id,
              date: dateOnly,
            },
          },
          update: {
            openResult,
            closeResult,
            status,
            isPublished: true,
          },
          create: {
            marketId: m.id,
            date: dateOnly,
            openResult,
            closeResult,
            status,
            isPublished: true,
          },
        })

        // Log demo seeding activity, including a random RED flag for some entries
        const isRed = Math.random() < 0.25 // ~25% marked as RED entries
        await prisma.activityLog.create({
          data: {
            marketId: m.id,
            action: 'DEMO_SEED_RESULT',
            details: {
              date: dateOnly.toISOString(),
              status,
              openResult,
              closeResult,
              color: isRed ? 'RED' : 'BLACK',
            } as any,
          },
        })

        seeded.push({ marketId: m.id, date: dateOnly, status })
      }
    }

    return NextResponse.json({ success: true, marketsSeeded: markets.length, entriesCreatedOrUpdated: seeded.length })
  } catch (error) {
    console.error('Error during demo seed:', error)
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 })
  }
}