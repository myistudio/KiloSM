import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toSlug(name: string) {
  return name.trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-')
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '90', 10) || 90, 1), 365)

    const { slug: slugRaw } = await context.params
    const slug = slugRaw.trim().toUpperCase()

    const markets = await prisma.market.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        isActive: true,
      },
    })

    const market = markets.find((m) => slug === toSlug(m.name) || slug === toSlug(m.displayName))
    if (!market) {
      return NextResponse.json({ error: 'Market not found or inactive' }, { status: 404 })
    }

    const results = await prisma.marketResult.findMany({
      where: { marketId: market.id, isPublished: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        date: true,
        openResult: true,
        closeResult: true,
        status: true,
      },
    })

    return NextResponse.json(
      { marketId: market.id, results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching market history:', error)
    return NextResponse.json({ error: 'Failed to fetch market history' }, { status: 500 })
  }
}