import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { DayOfWeek, MarketStatus, SectionType, ContentBlockType } from '@/generated/prisma'
import { redis } from '@/lib/redis'

// List markets
export async function GET() {
  await requireAdmin()
  try {
    const markets = await prisma.market.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        status: true,
        openTime: true,
        closeTime: true,
        resultTime: true,
        operatingDays: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        // Highlight fields
        isHighlighted: true,
        highlightMessage: true,
        highlightActionText: true,
        highlightActionUrl: true,
      },
    })
    return NextResponse.json({ markets })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 })
  }
}

// Create market and associated content block links
export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()
    const {
      name,
      displayName,
      openTime,
      closeTime,
      operatingDays,
      isActive,
      sortOrder,
      descriptionLink,
      jodiChartLink,
      panelChartLink,
      // optional highlight config on create
      isHighlighted,
      highlightMessage,
      highlightActionText,
      highlightActionUrl,
    } = body as {
      name: string
      displayName: string
      openTime: string
      closeTime: string
      operatingDays: (keyof typeof DayOfWeek)[]
      isActive: boolean
      sortOrder: number
      descriptionLink?: string
      jodiChartLink?: string
      panelChartLink?: string
      isHighlighted?: boolean
      highlightMessage?: string
      highlightActionText?: string
      highlightActionUrl?: string
    }

    if (!name || !displayName || !openTime || !closeTime || !operatingDays?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const market = await prisma.market.create({
      data: {
        name,
        displayName,
        status: isActive ? MarketStatus.ACTIVE : MarketStatus.INACTIVE,
        openTime,
        closeTime,
        resultTime: closeTime, // align with current UI (no separate resultTime)
        operatingDays: operatingDays.map((d) => DayOfWeek[d]),
        isActive,
        sortOrder,
        // highlight defaults
        isHighlighted: !!isHighlighted,
        highlightMessage: highlightMessage || null,
        highlightActionText: highlightActionText || null,
        highlightActionUrl: highlightActionUrl || null,
      },
    })

    // Create associated content block links under CHARTS section
    const chartsSection = await prisma.section.findUnique({
      where: { type: SectionType.CHARTS },
    })

    if (chartsSection) {
      const mk = market.name.trim().toUpperCase().replace(/\s+/g, '-')
      const linkBlocks = [
        {
          key: `${mk}_DESCRIPTION_LINK`,
          title: `${market.displayName} Description Link`,
          content: (descriptionLink || `/${mk}`),
        },
        {
          key: `${mk}_JODI_CHART_LINK`,
          title: `${market.displayName} Jodi Chart Link`,
          content: (jodiChartLink || `/${mk}-JODI-CHART`),
        },
        {
          key: `${mk}_PANEL_CHART_LINK`,
          title: `${market.displayName} Panel Chart Link`,
          content: (panelChartLink || `/${mk}-PANEL-CHART`),
        },
      ]

      await Promise.all(
        linkBlocks.map((b, i) =>
          prisma.contentBlock.upsert({
            where: { sectionId_key: { sectionId: chartsSection.id, key: b.key } },
            update: {
              title: b.title,
              content: b.content,
              type: ContentBlockType.LINK,
              sortOrder: i,
              isActive: true,
            },
            create: {
              sectionId: chartsSection.id,
              key: b.key,
              title: b.title,
              content: b.content,
              type: ContentBlockType.LINK,
              sortOrder: i,
              isActive: true,
            },
          })
        )
      )
    }

    // Notify live results stream via Redis version bump (markets changed)
    try { await redis.incr('live_markets_version') } catch {}

    return NextResponse.json({ market }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating market:', error)
    const msg = error?.code === 'P2002' ? 'Market name must be unique' : 'Failed to create market'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Update/toggle market values
export async function PATCH(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()
    const {
      id,
      name,
      displayName,
      openTime,
      closeTime,
      operatingDays,
      isActive,
      sortOrder,
      // highlight updates
      isHighlighted,
      highlightMessage,
      highlightActionText,
      highlightActionUrl,
    } = body as {
      id: string
      name?: string
      displayName?: string
      openTime?: string
      closeTime?: string
      operatingDays?: (keyof typeof DayOfWeek)[]
      isActive?: boolean
      sortOrder?: number
      isHighlighted?: boolean
      highlightMessage?: string
      highlightActionText?: string
      highlightActionUrl?: string
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updated = await prisma.market.update({
      where: { id },
      data: {
        name,
        displayName,
        openTime,
        closeTime,
        resultTime: closeTime ?? undefined,
        operatingDays: operatingDays ? operatingDays.map((d) => DayOfWeek[d]) : undefined,
        isActive,
        status: typeof isActive === 'boolean' ? (isActive ? MarketStatus.ACTIVE : MarketStatus.INACTIVE) : undefined,
        sortOrder,
        // highlight fields
        isHighlighted,
        highlightMessage,
        highlightActionText,
        highlightActionUrl,
      },
    })

    // Notify live results stream via Redis version bump (markets changed)
    try { await redis.incr('live_markets_version') } catch {}

    return NextResponse.json({ market: updated })
  } catch (error) {
    console.error('Error updating market:', error)
    return NextResponse.json({ error: 'Failed to update market' }, { status: 500 })
  }
}

// Delete market
export async function DELETE(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
    }

    await prisma.market.delete({ where: { id } })

    // Notify live results stream via Redis version bump (markets changed)
    try { await redis.incr('live_markets_version') } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting market:', error)
    return NextResponse.json({ error: 'Failed to delete market' }, { status: 500 })
  }
}