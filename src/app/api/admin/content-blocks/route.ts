import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { ContentBlockType, SectionType, Prisma } from '@/generated/prisma'

// List content blocks, optionally filtered by sectionType
export async function GET(req: Request) {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const sectionTypeParam = searchParams.get('sectionType') as keyof typeof SectionType | null

  try {
    if (sectionTypeParam) {
      let section = await prisma.section.findUnique({ where: { type: SectionType[sectionTypeParam] } })

      // Auto-create USER_CONTENT section if missing to avoid management errors
      if (!section && sectionTypeParam === 'USER_CONTENT') {
        section = await prisma.section.create({
          data: {
            type: SectionType.USER_CONTENT,
            name: 'User Content',
            title: 'User Content Blocks',
            isEnabled: true,
            sortOrder: 999,
          },
        })
      }

      if (!section) {
        return NextResponse.json({ error: `Section ${sectionTypeParam} not found` }, { status: 404 })
      }

      const contentBlocks = await prisma.contentBlock.findMany({
        where: { sectionId: section.id },
        orderBy: { sortOrder: 'asc' },
      })

      return NextResponse.json({ contentBlocks })
    }

    const contentBlocks = await prisma.contentBlock.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ contentBlocks })
  } catch (error) {
    console.error('Error fetching content blocks:', error)
    return NextResponse.json({ error: 'Failed to fetch content blocks' }, { status: 500 })
  }
}

// Create or update a content block (upsert by sectionId + key)
export async function POST(req: Request) {
  await requireAdmin()

  try {
    const body = await req.json()
    const {
      sectionType,
      sectionId,
      key,
      title,
      content,
      type,
      metadata,
      sortOrder,
      isActive,
    } = body as {
      sectionType?: keyof typeof SectionType
      sectionId?: string
      key: string
      title?: string
      content: string
      type: keyof typeof ContentBlockType
      metadata?: Record<string, unknown> | null
      sortOrder?: number
      isActive?: boolean
    }

    if (!key || !content || !type) {
      return NextResponse.json({ error: 'key, content and type are required' }, { status: 400 })
    }

    // Resolve sectionId from sectionType if provided
    let resolvedSectionId = sectionId || null
    if (!resolvedSectionId && sectionType) {
      let section = await prisma.section.findUnique({ where: { type: SectionType[sectionType] } })
      // Auto-create USER_CONTENT when missing to enable admin saves without manual seeding
      if (!section && sectionType === 'USER_CONTENT') {
        section = await prisma.section.create({
          data: {
            type: SectionType.USER_CONTENT,
            name: 'User Content',
            title: 'User Content Blocks',
            isEnabled: true,
            sortOrder: 999,
          },
        })
      }
      if (!section) {
        return NextResponse.json({ error: `Section ${sectionType} not found` }, { status: 404 })
      }
      resolvedSectionId = section.id
    }

    if (!resolvedSectionId) {
      return NextResponse.json({ error: 'sectionId or sectionType is required' }, { status: 400 })
    }

    // Ensure metadata conforms to Prisma JSON input types
    const metaPayload: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined =
      metadata === null ? Prisma.JsonNull : (metadata as unknown as Prisma.InputJsonValue)

    const upserted = await prisma.contentBlock.upsert({
      where: {
        sectionId_key: {
          sectionId: resolvedSectionId,
          key,
        },
      },
      update: {
        title: title ?? null,
        content,
        type: ContentBlockType[type],
        metadata: metaPayload,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      create: {
        sectionId: resolvedSectionId,
        key,
        title: title ?? null,
        content,
        type: ContentBlockType[type],
        metadata: metaPayload,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ contentBlock: upserted }, { status: 201 })
  } catch (error) {
    console.error('Error saving content block:', error)
    return NextResponse.json({ error: 'Failed to save content block' }, { status: 500 })
  }
}

// Delete a content block by id or by (sectionId + key)
export async function DELETE(req: Request) {
  await requireAdmin()

  try {
    const contentType = req.headers.get('content-type') || ''
    let id: string | undefined
    let sectionId: string | undefined
    let key: string | undefined

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      id = body.id
      sectionId = body.sectionId
      key = body.key
    } else {
      const { searchParams } = new URL(req.url)
      id = searchParams.get('id') || undefined
      sectionId = searchParams.get('sectionId') || undefined
      key = searchParams.get('key') || undefined
    }

    if (id) {
      const deleted = await prisma.contentBlock.delete({ where: { id } })
      return NextResponse.json({ contentBlock: deleted }, { status: 200 })
    }

    if (sectionId && key) {
      const existing = await prisma.contentBlock.findUnique({
        where: { sectionId_key: { sectionId, key } },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Content block not found' }, { status: 404 })
      }

      const deleted = await prisma.contentBlock.delete({ where: { id: existing.id } })
      return NextResponse.json({ contentBlock: deleted }, { status: 200 })
    }

    return NextResponse.json({ error: 'id or sectionId+key required' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting content block:', error)
    return NextResponse.json({ error: 'Failed to delete content block' }, { status: 500 })
  }
}