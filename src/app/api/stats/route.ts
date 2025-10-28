import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getTodayDateOnly(): Date {
  const now = new Date()
  // Create a date-only (UTC midnight) instance for equality filtering
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function GET() {
  try {
    const [activeMarketsCount, usersCount, publishedTodayCount] = await Promise.all([
      prisma.market.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.marketResult.count({ where: { isPublished: true, date: getTodayDateOnly() } }),
    ])

    const successRatio = activeMarketsCount > 0 ? (publishedTodayCount / activeMarketsCount) : 0
    const successRate = Math.round(successRatio * 100)

    return NextResponse.json(
      {
        activeMarkets: activeMarketsCount,
        todaysResults: publishedTodayCount,
        totalUsers: usersCount,
        successRate,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}