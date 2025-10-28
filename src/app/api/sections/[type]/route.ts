import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SectionType } from '@/generated/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest, context: { params: Promise<{ type: string }> }) {
  try {
    const { type: typeRaw } = await context.params
    const rawType = typeRaw.trim().toUpperCase()
    const key = rawType as keyof typeof SectionType
    const sectionType = SectionType[key]

    if (!sectionType) {
      return NextResponse.json({ error: 'Invalid section type' }, { status: 400 })
    }

    const section = await prisma.section.findUnique({
      where: { type: sectionType },
      include: {
        contentBlocks: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            type: true,
            key: true,
            title: true,
            content: true,
            metadata: true,
            sortOrder: true,
            isActive: true,
          },
        },
      },
    })

    // If section missing/disabled, provide a safe default payload for special public sections
    if (!section || !section.isEnabled) {
      // LATEST_RESULTS section renders purely from public API and does not require content blocks
      if (sectionType === SectionType.LATEST_RESULTS) {
        const payload = {
          id: 'virtual-LATEST_RESULTS',
          type: sectionType,
          name: 'Latest Results',
          title: 'Latest Results',
          isEnabled: true,
          sortOrder: 50,
          settings: {},
          contentBlocks: [],
        }
        return NextResponse.json(
          { section: payload },
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          },
        )
      }
      // MARKET_TIMETABLE section is used for styling MarketTimingsCard and schedule renderer; provide defaults
      if (sectionType === SectionType.MARKET_TIMETABLE) {
        const payload = {
          id: 'virtual-MARKET_TIMETABLE',
          type: sectionType,
          name: 'Market Timetable',
          title: 'Market Timetable',
          isEnabled: true,
          sortOrder: 55,
          settings: {
            headingColor: '#60a5fa', // Tailwind blue-400
            textColor: '#cbd5e1', // Tailwind slate-300
            backgroundColor: '',
            headerBgColor: '',
            showTopBar: true,
          },
          contentBlocks: [],
        }
        return NextResponse.json(
          { section: payload },
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          },
        )
      }
      // Generic public sections: provide sane defaults to avoid 404s site-wide
      if ([
        'LIVE_RESULTS',
        'NOTICE_BOARD',
        'INFO_MARQUEE',
        'ASTROLOGY_LUCK',
        'KEYWORD_SEO',
        'ONLINE_PLAY',
        'MARKET_ARTICLES',
        'LINK_SECTION_1',
        'LINK_SECTION_2',
        'USER_CONTENT',
        'CHARTS',
        'QA_SECTION',
        'STARLINE_GAMES',
        'BAZAR_36',
        'BAZAR_48',
        'FAQ',
        'DISCLAIMER',
      ].includes(String(sectionType))) {
        const readableTitle = (() => {
          switch (String(sectionType)) {
            case 'LIVE_RESULTS': return 'Live Results'
            case 'NOTICE_BOARD': return 'Notice Board'
            case 'INFO_MARQUEE': return 'Information Marquee'
            case 'ASTROLOGY_LUCK': return "Today's Lucky Numbers"
            case 'KEYWORD_SEO': return 'SEO Keywords'
            case 'ONLINE_PLAY': return 'Play Online'
            case 'MARKET_ARTICLES': return 'Market Articles'
            case 'LINK_SECTION_1': return 'Quick Links'
            case 'LINK_SECTION_2': return 'More Links'
            case 'USER_CONTENT': return 'User Content'
            case 'CHARTS': return 'Charts'
            case 'QA_SECTION': return 'Q&A Section'
            case 'STARLINE_GAMES': return 'Starline Games'
            case 'BAZAR_36': return 'Bazar 36'
            case 'BAZAR_48': return 'Bazar 48'
            case 'FAQ': return 'FAQ'
            case 'DISCLAIMER': return 'Disclaimer'
            default: return rawType.replace(/_/g, ' ')
          }
        })()
        const payload = {
          id: `virtual-${rawType}`,
          type: sectionType,
          name: readableTitle,
          title: readableTitle,
          isEnabled: true,
          sortOrder: 60,
          settings: { showTopBar: true },
          contentBlocks: [],
        }
        return NextResponse.json(
          { section: payload },
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          },
        )
      }
      return NextResponse.json({ error: 'Section not found or disabled' }, { status: 404 })
    }

    // Only expose safe, necessary fields publicly
    const payload = {
      id: section.id,
      type: section.type,
      name: section.name,
      title: section.title,
      isEnabled: section.isEnabled,
      sortOrder: section.sortOrder,
      settings: section.settings ?? {},
      contentBlocks: section.contentBlocks,
    }

    return NextResponse.json(
      { section: payload },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 })
  }
}