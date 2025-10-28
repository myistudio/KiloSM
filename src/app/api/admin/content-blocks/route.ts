import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { ContentBlockType, SectionType } from '@/generated/prisma'

// List content blocks, optionally filtered by sectionType
export async function GET(req: Request) {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const sectionTypeParam = searchParams.get('sectionType') as keyof typeof SectionType | null

  try {
    if (sectionTypeParam) {
      const section = await prisma.section.findUnique({
        where: { type: SectionType[sectionTypeParam] },
      })

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
      const section = await prisma.section.findUnique({
        where: { type: SectionType[sectionType] },
      })
      if (!section) {
        return NextResponse.json({ error: `Section ${sectionType} not found` }, { status: 404 })
      }
      resolvedSectionId = section.id
    }

    if (!resolvedSectionId) {
      return NextResponse.json({ error: 'sectionId or sectionType is required' }, { status: 400 })
    }

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
        metadata: metadata ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      create: {
        sectionId: resolvedSectionId,
        key,
        title: title ?? null,
        content,
        type: ContentBlockType[type],
        metadata: metadata ?? null,
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