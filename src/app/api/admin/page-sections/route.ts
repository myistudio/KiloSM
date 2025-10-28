import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

// List page-section assignments; optionally filter by pageId
export async function GET(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get('pageId') || undefined

    const where: any = {}
    if (pageId) where.pageId = pageId

    const assignments = await prisma.pageSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        pageId: true,
        sectionId: true,
        sortOrder: true,
        isEnabled: true,
        customTitle: true,
        customDescription: true,
        localSettings: true,
        section: {
          select: {
            id: true,
            type: true,
            name: true,
            title: true,
            isEnabled: true,
          },
        },
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching page sections:', error)
    return NextResponse.json({ error: 'Failed to fetch page sections' }, { status: 500 })
  }
}

// Create or update (upsert) a page-section assignment by (pageId, sectionId)
export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json().catch(() => ({}))
    const { pageId, sectionId, sortOrder, isEnabled, customTitle, customDescription, localSettings } = body || {}

    if (!pageId || !sectionId) {
      return NextResponse.json({ error: 'pageId and sectionId are required' }, { status: 400 })
    }

    const saved = await prisma.pageSection.upsert({
      where: { pageId_sectionId: { pageId, sectionId } },
      update: {
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isEnabled: typeof isEnabled === 'boolean' ? isEnabled : undefined,
        customTitle: typeof customTitle === 'string' ? customTitle : undefined,
        customDescription: typeof customDescription === 'string' ? customDescription : undefined,
        localSettings: localSettings ?? undefined,
      },
      create: {
        pageId,
        sectionId,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isEnabled: typeof isEnabled === 'boolean' ? isEnabled : true,
        customTitle: typeof customTitle === 'string' ? customTitle : null,
        customDescription: typeof customDescription === 'string' ? customDescription : null,
        localSettings: localSettings ?? undefined,
      },
      select: {
        id: true,
        pageId: true,
        sectionId: true,
        sortOrder: true,
        isEnabled: true,
        customTitle: true,
        customDescription: true,
        localSettings: true,
      },
    })

    return NextResponse.json({ assignment: saved })
  } catch (error) {
    console.error('Error saving page section:', error)
    return NextResponse.json({ error: 'Failed to save page section' }, { status: 500 })
  }
}

// Bulk update assignments
export async function PATCH(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json().catch(() => ({}))
    const updates = Array.isArray(body?.updates) ? body.updates : []
    if (!updates.length) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    await Promise.all(
      updates.map((u: any) => {
        if (!u?.id) return Promise.resolve()
        const data: any = {}
        if (typeof u.sortOrder === 'number') data.sortOrder = u.sortOrder
        if (typeof u.isEnabled === 'boolean') data.isEnabled = !!u.isEnabled
        if (typeof u.customTitle === 'string') data.customTitle = u.customTitle
        if (typeof u.customDescription === 'string') data.customDescription = u.customDescription
        if (u.localSettings && typeof u.localSettings === 'object') data.localSettings = u.localSettings
        if (Object.keys(data).length === 0) return Promise.resolve()
        return prisma.pageSection.update({ where: { id: u.id }, data })
      })
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating page sections:', error)
    return NextResponse.json({ error: 'Failed to update page sections' }, { status: 500 })
  }
}

// Delete assignment by id or by (pageId + sectionId)
export async function DELETE(req: Request) {
  await requireAdmin()
  try {
    const contentType = req.headers.get('content-type') || ''
    let id: string | undefined
    let pageId: string | undefined
    let sectionId: string | undefined

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      id = body.id
      pageId = body.pageId
      sectionId = body.sectionId
    } else {
      const { searchParams } = new URL(req.url)
      id = searchParams.get('id') || undefined
      pageId = searchParams.get('pageId') || undefined
      sectionId = searchParams.get('sectionId') || undefined
    }

    if (id) {
      const deleted = await prisma.pageSection.delete({ where: { id } })
      return NextResponse.json({ assignment: deleted })
    }

    if (pageId && sectionId) {
      const existing = await prisma.pageSection.findUnique({
        where: { pageId_sectionId: { pageId, sectionId } },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
      }
      const deleted = await prisma.pageSection.delete({ where: { id: existing.id } })
      return NextResponse.json({ assignment: deleted })
    }

    return NextResponse.json({ error: 'id or pageId+sectionId required' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting page section:', error)
    return NextResponse.json({ error: 'Failed to delete page section' }, { status: 500 })
  }
}