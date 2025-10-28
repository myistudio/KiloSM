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
  const seoKeys = ['SEO_WEEKLY_JODI_TITLE', 'SEO_WEEKLY_JODI_DESCRIPTION', 'SEO_WEEKLY_JODI_KEYWORDS']
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

    const title = map.get('SEO_WEEKLY_JODI_TITLE') || 'Weekly Jodi - Satta Matka'
    const description = map.get('SEO_WEEKLY_JODI_DESCRIPTION') || 'Weekly jodi entries and results. Admin-managed sections for satta matka enthusiasts.'
    const keywordsRaw = map.get('SEO_WEEKLY_JODI_KEYWORDS') || ''
    const keywords = (() => {
      try {
        const parsed = JSON.parse(keywordsRaw)
        if (Array.isArray(parsed)) return parsed
      } catch {}
      return keywordsRaw ? keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean) : ['satta', 'satta matka', 'sattamatka', 'weekly jodi', 'jodi']
    })()

    return buildMetadata({
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/weekly-jodi',
      },
      twitter: { title, description },
    })
  } catch {
    return buildMetadata({
      title: 'Weekly Jodi - Satta Matka',
      description: 'Weekly jodi entries and results. Admin-managed sections for satta matka enthusiasts.',
      keywords: ['satta', 'satta matka', 'sattamatka', 'weekly jodi', 'jodi'],
      openGraph: {
        title: 'Weekly Jodi - Satta Matka',
        description: 'Weekly jodi entries and results.',
        url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/weekly-jodi',
      },
      twitter: {
        title: 'Weekly Jodi - Satta Matka',
        description: 'Admin-managed weekly jodi entries and results.',
      },
    })
  }
}

export default async function WeeklyJodiPage() {
  const keys = Array.from({ length: 12 }, (_, i) => `WEEKLY_JODI_${i + 1}`)

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
    name: 'Weekly Jodi',
    url: `${siteUrl}/weekly-jodi`,
    description: 'Weekly jodi entries and results. Admin-managed sections for satta matka enthusiasts.',
    keywords: ['satta', 'satta matka', 'sattamatka', 'weekly jodi', 'jodi'],
  }

  try {
    const seoSchemaBlock = await prisma.contentBlock.findFirst({
      where: {
        section: { type: SectionType.USER_CONTENT },
        key: 'SEO_WEEKLY_JODI_SCHEMA',
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
            <CardTitle className="text-2xl text-white">Weekly Jodi</CardTitle>
            <CardDescription>Admin-managed entries shown below. Add content blocks in the User Content section with keys WEEKLY_JODI_1 to WEEKLY_JODI_12.</CardDescription>
          </div>
          <Button variant="ghost" className="text-slate-400" asChild>
            <Link href="/" prefetch={false}>← Back to Home</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Grid of Jodi sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
        {keys.map((key, idx) => {
          const block = blocksMap.get(key)
          const title = block?.title || `Section ${idx + 1}`
          const content = block?.content || 'Admin can add content in the User Content section using the key ' + key + '.'
          return (
            <Card key={key} className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-center text-white">{title}</CardTitle>
                <CardDescription className="text-center">{key.replace('WEEKLY_JODI_', 'Weekly Jodi ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-slate-200 text-center whitespace-pre-line">{content}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SchemaScripts schemas={[schema]} />
    </>
  )
}