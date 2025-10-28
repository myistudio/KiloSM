import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public API: Latest published results across all markets
export const dynamic = 'force-dynamic'
export const revalidate = 0
export async function GET() {
  try {
    const latest = await prisma.marketResult.findMany({
      where: { isPublished: true },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
      include: {
        market: {
          select: {
            id: true,
            name: true,
            displayName: true,
            resultTime: true,
          },
        },
      },
    })

    const results = latest.map((r) => ({
      id: r.id,
      marketId: r.marketId,
      marketName: r.market?.name ?? null,
      marketDisplayName: r.market?.displayName ?? null,
      date: r.date,
      openResult: r.openResult ?? null,
      closeResult: r.closeResult ?? null,
      status: r.status,
      isPublished: r.isPublished,
      createdAt: r.createdAt,
      resultTime: r.market?.resultTime ?? null,
    }))

    return NextResponse.json(
    { results },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
  } catch (error) {
    console.error('Error fetching latest results:', error)
    return NextResponse.json({ error: 'Failed to fetch latest results' }, { status: 500 })
  }
}