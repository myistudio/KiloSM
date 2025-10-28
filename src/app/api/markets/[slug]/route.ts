import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toSlug(name: string) {
  return name.trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-')
}

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: slugRaw } = await context.params
    const slug = slugRaw.trim().toUpperCase()

    const markets = await prisma.market.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayName: true,
        openTime: true,
        closeTime: true,
        resultTime: true,
        operatingDays: true,
        isActive: true,
        sortOrder: true,
      },
    })

    const market = markets.find((m) => slug === toSlug(m.name) || slug === toSlug(m.displayName))
    if (!market) {
      return NextResponse.json({ error: 'Market not found or inactive' }, { status: 404 })
    }

    const latestResult = await prisma.marketResult.findFirst({
      where: { marketId: market.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        date: true,
        openResult: true,
        closeResult: true,
        status: true,
        isPublished: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { market, latestResult },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching market by slug:', error)
    return NextResponse.json({ error: 'Failed to fetch market' }, { status: 500 })
  }
}