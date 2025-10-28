import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      },
    })

    return NextResponse.json({ markets })
  } catch (error) {
    console.error('Error fetching public markets:', error)
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
  }
}