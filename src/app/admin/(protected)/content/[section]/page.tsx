import { prisma } from '@/lib/prisma'
import { SectionModule } from '@/components/admin/content/SectionModule'
import type { SectionType } from '@/generated/prisma'

// Validate against the exact SectionType values defined in Prisma schema
const ALLOWED_TYPES = new Set<string>([
  'KEYWORD_SEO',
  'ASTROLOGY_LUCK',
  'ONLINE_PLAY',
  'LIVE_RESULTS',
  'NOTICE_BOARD',
  'MARKET_ARTICLES',
  'LATEST_RESULTS',
  'INFO_MARQUEE',
  'STARLINE_GAMES',
  'BAZAR_36',
  'BAZAR_48',
  'LINK_SECTION_1',
  'LINK_SECTION_2',
  'WEEKLY_TIPS_PATTI',
  'WEEKLY_TIPS_LINE',
  'WEEKLY_TIPS_JODI',
  'FREE_GAME_ZONE',
  'USER_CONTENT',
  'CHARTS',
  'FAQ',
  'MARKET_TIMETABLE',
  'QA_SECTION',
  'DISCLAIMER',
])

function toType(slug: string): string {
  return String(slug || '').toUpperCase().replace(/-/g, '_')
}

export default async function SectionContentPage({ params, searchParams }: { params: { section: string }, searchParams?: Record<string, string> }) {
  const slug = params.section
  const type = toType(slug)
  
  if (!ALLOWED_TYPES.has(type)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Section not found</h1>
        <p className="text-muted-foreground">No section exists for type: {type}</p>
        <p className="text-sm">Return to <a className="underline" href="/admin/content">Content Management</a>.</p>
      </div>
    )
  }

  const enumType = type as SectionType
  const section = await prisma.section.findFirst({ where: { type: { equals: enumType } } })

  if (!section) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Section not found</h1>
        <p className="text-muted-foreground">No section exists for type: {type}</p>
        <p className="text-sm">Return to <a className="underline" href="/admin/content">Content Management</a>.</p>
      </div>
    )
  }

  return <SectionModule section={{ id: section.id, type: section.type, title: section.title, name: section.name }} />
}