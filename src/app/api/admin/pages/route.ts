import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

// List pages
export async function GET() {
  await requireAdmin()
  try {
    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sections: true } },
      },
    })
    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// Create a page
export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json().catch(() => ({}))
    const { slug, title, description, isEnabled } = body || {}

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
    }

    const page = await prisma.page.create({
      data: {
        slug: String(slug).trim().toLowerCase(),
        title: String(title).trim(),
        description: description ? String(description) : null,
        isEnabled: typeof isEnabled === 'boolean' ? !!isEnabled : true,
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating page:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}

// Bulk update pages
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
        if (typeof u.slug === 'string') data.slug = String(u.slug).trim().toLowerCase()
        if (typeof u.title === 'string') data.title = String(u.title).trim()
        if (typeof u.description === 'string') data.description = u.description
        if (typeof u.isEnabled === 'boolean') data.isEnabled = !!u.isEnabled
        if (Object.keys(data).length === 0) return Promise.resolve()
        return prisma.page.update({ where: { id: u.id }, data })
      })
    )

    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sections: true } },
      },
    })
    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error updating pages:', error)
    return NextResponse.json({ error: 'Failed to update pages' }, { status: 500 })
  }
}

// Delete a page by id
export async function DELETE(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || undefined
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.page.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}