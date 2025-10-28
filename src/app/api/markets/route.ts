import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Disable caching to ensure immediate updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Public API: Active markets for website frontend
export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        openTime: true,
        closeTime: true,
        resultTime: true,
        sortOrder: true,
        // Highlight presentation fields
        isHighlighted: true,
        highlightMessage: true,
        highlightActionText: true,
        highlightActionUrl: true,
        // Include latest published result for each market (one per market)
        results: {
          where: { isPublished: true },
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

    return NextResponse.json(
      { markets },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching public markets:', error)
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
  }
}