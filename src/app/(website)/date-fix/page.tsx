import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { SectionType } from '@/generated/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buildMetadata, SchemaScripts } from '@/lib/seo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  // Fetch SEO overrides from USER_CONTENT blocks
  const seoKeys = ['SEO_DATE_FIX_TITLE', 'SEO_DATE_FIX_DESCRIPTION', 'SEO_DATE_FIX_KEYWORDS']
  try {
    const section = await prisma.section.findUnique({
      where: { type: SectionType.USER_CONTENT },
      include: {
        contentBlocks: {
          where: { key: { in: seoKeys }, isActive: true },
          select: { key: true, content: true },
        },
      },
    })
    const map = new Map<string, string>()
    section?.contentBlocks?.forEach((b) => map.set(b.key, b.content || ''))

    const title = map.get('SEO_DATE_FIX_TITLE') || 'Date Fix - Satta Matka'
    const description = map.get('SEO_DATE_FIX_DESCRIPTION') || 'Admin-managed 4-digit date fix numbers for all active markets, ordered by result time.'
    const keywordsRaw = map.get('SEO_DATE_FIX_KEYWORDS') || ''
    const keywords = (() => {
      try {
        const parsed = JSON.parse(keywordsRaw)
        if (Array.isArray(parsed)) return parsed
      } catch {}
      return keywordsRaw ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean) : ['satta', 'satta matka', 'sattamatka', 'date fix', 'fix']
    })()

    return buildMetadata({
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/date-fix',
      },
      twitter: { title, description },
    })
  } catch {
    return buildMetadata({
      title: 'Date Fix - Satta Matka',
      description: 'Admin-managed 4-digit date fix numbers for all active markets, ordered by result time.',
      keywords: ['satta', 'satta matka', 'sattamatka', 'date fix', 'fix'],
      openGraph: {
        title: 'Date Fix - Satta Matka',
        description: 'Admin-managed 4-digit date fix numbers for all active markets.',
        url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/date-fix',
      },
      twitter: {
        title: 'Date Fix - Satta Matka',
        description: 'Admin-managed date fix numbers for active markets.',
      },
    })
  }
}

function toMinutes(hhmm?: string | null): number {
  if (!hhmm) return Number.POSITIVE_INFINITY
  const [hStr, mStr] = String(hhmm).split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY
  return h * 60 + m
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export default async function DateFixPage() {
  // Fetch all active markets
  const markets = await prisma.market.findMany({
    where: { isActive: true },
    select: { id: true, name: true, displayName: true, openTime: true, closeTime: true, resultTime: true },
  })

  // Sort by result time (prefer resultTime, then closeTime, then openTime)
  const sortedMarkets = [...markets].sort((a, b) => {
    const aT = Math.min(toMinutes(a.resultTime), toMinutes(a.closeTime), toMinutes(a.openTime))
    const bT = Math.min(toMinutes(b.resultTime), toMinutes(b.closeTime), toMinutes(b.openTime))
    return aT - bT
  })

  // Build keys for admin-managed date fix numbers under USER_CONTENT section
  const keys = sortedMarkets.map((m) => `DATE_FIX_${slugify(m.name)}`)

  const section = await prisma.section.findUnique({
    where: { type: SectionType.USER_CONTENT },
    include: {
      contentBlocks: {
        where: { isActive: true, key: { in: keys } },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, key: true, title: true, content: true },
      },
    },
  })

  const blocksMap = new Map<string, { title?: string | null; content?: string | null }>()
  section?.contentBlocks?.forEach((b) => {
    blocksMap.set(b.key, { title: b.title, content: b.content })
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  // Attempt to load custom schema from content blocks
  let schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Date Fix',
    url: `${siteUrl}/date-fix`,
    description: 'Admin-managed 4-digit date fix numbers for active markets, ordered by result time.',
    keywords: ['satta', 'satta matka', 'sattamatka', 'date fix', 'fix'],
  }

  try {
    const seoSchemaBlock = await prisma.contentBlock.findFirst({
      where: {
        section: { type: SectionType.USER_CONTENT },
        key: 'SEO_DATE_FIX_SCHEMA',
        isActive: true,
      },
      select: { content: true },
    })
    const raw = seoSchemaBlock?.content || ''
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') schema = parsed
    }
  } catch {}

  return (
    <>
      {/* Header Card to match standard theme */}
      <Card className="mb-6 bg-slate-800/60 border-slate-700">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-white">Date Fix</CardTitle>
            <CardDescription>Admin-managed 4-digit date fix numbers for all active markets. Ordered by their result time. Add content blocks in the User Content section using keys DATE_FIX_{'<market-slug>'}.</CardDescription>
          </div>
          <Button variant="ghost" className="text-slate-400" asChild>
            <Link href="/" prefetch={false}>← Back to Home</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Description section */}
      <div className="mb-6">
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">What is Date Fix?</CardTitle>
            <CardDescription>Admins can update a 4-digit date fix number for each market. It is displayed below.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200">To update, go to Admin Panel → User Content, and add or edit a content block with key <span className="font-mono">DATE_FIX_{'<market-slug>'}</span>. The content should be a 4-digit number (e.g., 1234).</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards for markets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
        {sortedMarkets.map((m) => {
          const slug = slugify(m.name)
          const key = `DATE_FIX_${slug}`
          const block = blocksMap.get(key)
          let fix = (block?.content || '').replace(/[^0-9]/g, '')
          if (fix.length !== 4) fix = '— — — —'
          const openClose = [m.openTime, m.closeTime].filter(Boolean).join(' - ')
          return (
            <Card key={m.id} className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-center">{m.displayName || m.name}</CardTitle>
                <CardDescription className="text-center">{openClose}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="font-mono text-3xl md:text-4xl font-extrabold tracking-widest text-chart-5">
                    {fix}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SchemaScripts schemas={[schema]} />
    </>
  )
}