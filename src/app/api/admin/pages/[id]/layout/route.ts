import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

// Fetch page layout: returns sections placed on the page with their sortOrder and visibility
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  try {
    const pageId = params.id
    if (!pageId) return NextResponse.json({ error: 'page id is required' }, { status: 400 })

    const placements = await prisma.pageSection.findMany({
      where: { pageId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        sortOrder: true,
        isEnabled: true,
        customTitle: true,
        customDescription: true,
        localSettings: true,
        section: { select: { type: true, name: true } },
      },
    })

    const items = placements.map(p => ({
      key: p.section.type as string,
      sortOrder: p.sortOrder,
      isEnabled: p.isEnabled,
      customTitle: p.customTitle ?? undefined,
      customDescription: p.customDescription ?? undefined,
      localSettings: p.localSettings ?? undefined,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching page layout:', error)
    return NextResponse.json({ error: 'Failed to fetch layout' }, { status: 500 })
  }
}

// Persist page layout: assigns sections to a page with sortOrder
// Payload: { items: Array<{ key: string; sortOrder?: number; isEnabled?: boolean; customTitle?: string; customDescription?: string; localSettings?: any }> }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  try {
    const pageId = params.id
    const body = await req.json().catch(() => ({}))
    const items: Array<any> = Array.isArray(body?.items) ? body.items : []

    if (!pageId) return NextResponse.json({ error: 'page id is required' }, { status: 400 })
    if (!items.length) return NextResponse.json({ error: 'items are required' }, { status: 400 })

    const page = await prisma.page.findUnique({ where: { id: pageId } })
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    // Map SectionType keys to existing Section rows
    const sectionTypes = [...new Set(items.map(i => String(i.key)))]
    const sections = await prisma.section.findMany({ where: { type: { in: sectionTypes as any } } })
    const sectionMap = new Map(sections.map(s => [s.type, s]))

    const results: any[] = []
    let sortBase = 0

    for (const item of items) {
      const type = String(item.key)
      const section = sectionMap.get(type as any)
      if (!section) {
        results.push({ key: type, error: 'Section type not found' })
        continue
      }

      const data = {
        pageId,
        sectionId: section.id,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : sortBase++,
        isEnabled: typeof item.isEnabled === 'boolean' ? !!item.isEnabled : true,
        customTitle: typeof item.customTitle === 'string' ? item.customTitle : undefined,
        customDescription: typeof item.customDescription === 'string' ? item.customDescription : undefined,
        localSettings: item.localSettings ? item.localSettings : undefined,
      }

      const saved = await prisma.pageSection.upsert({
        where: { pageId_sectionId: { pageId, sectionId: section.id } },
        update: data,
        create: data,
        select: { id: true, sortOrder: true, isEnabled: true, sectionId: true },
      })
      results.push({ key: type, placement: saved })
    }

    return NextResponse.json({ placements: results })
  } catch (error) {
    console.error('Error saving page layout:', error)
    return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 })
  }
}