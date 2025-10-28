import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getTodayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function parseResultParts(r?: string | null): string[] {
  return String(r || '').split('-').filter(Boolean)
}

function deriveLatest(open?: string | null, close?: string | null): { openPatti?: string; jodi?: string; closePatti?: string } {
  const o = parseResultParts(open)
  const c = parseResultParts(close)
  const openPatti = o.length >= 1 ? o[0] : undefined
  let jodi: string | undefined
  // Prefer explicit jodi from close format xxx-jj-xxx
  const cm = String(close || '').match(/^(\d{3})-(\d{2})-(\d{3})$/)
  if (cm) {
    jodi = cm[2]
  } else if (o.length >= 2 && c.length >= 2) {
    // Fallback: derive from open/close digits (xxx-x and xxx-x)
    const openDigit = o[1]
    const closeDigit = c[1]
    jodi = `${openDigit}${closeDigit}`
  }
  const closePatti = c.length >= 3 ? c[2] : (c.length >= 1 ? c[0] : undefined)
  return { openPatti, jodi, closePatti }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await context.params
    const slug = (rawSlug || '').toLowerCase()

    const market = await prisma.market.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { equals: slug, mode: 'insensitive' } },
          { displayName: { equals: slug, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        openTime: true,
        closeTime: true,
      },
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    const today = getTodayDateOnly()

    const latest = await prisma.marketResult.findFirst({
      where: { marketId: market.id, date: today },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        date: true,
        openResult: true,
        closeResult: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const derived = latest ? deriveLatest(latest.openResult, latest.closeResult) : {}

    return NextResponse.json(
      {
        market,
        today: latest
          ? {
              id: latest.id,
              date: latest.date,
              openResult: latest.openResult ?? null,
              closeResult: latest.closeResult ?? null,
              openPatti: derived.openPatti ?? null,
              jodi: derived.jodi ?? null,
              closePatti: derived.closePatti ?? null,
              isPublished: latest.isPublished,
              createdAt: latest.createdAt,
              updatedAt: latest.updatedAt,
            }
          : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Error fetching latest market result:', error)
    return NextResponse.json({ error: 'Failed to fetch latest result' }, { status: 500 })
  }
}