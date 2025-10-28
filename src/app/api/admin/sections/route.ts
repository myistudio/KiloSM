import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

export async function GET() {
  await requireAdmin()
  try {
    const sections = await prisma.section.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        name: true,
        title: true,
        isEnabled: true,
        sortOrder: true,
        settings: true,
      },
    })
    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json().catch(() => ({}))
    const updates = Array.isArray(body?.updates) ? body.updates : []

    if (!updates.length) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Validate payload minimally and perform updates
    await Promise.all(
      updates.map((u: any) => {
        if (!u?.id) return Promise.resolve()
        const data: any = {}
        if (typeof u.isEnabled === 'boolean') data.isEnabled = u.isEnabled
        if (typeof u.sortOrder === 'number') data.sortOrder = u.sortOrder
        if (u.settings && typeof u.settings === 'object') data.settings = u.settings
        // New: allow updating title and subheading (name)
        if (typeof u.title === 'string') data.title = u.title
        if (typeof u.name === 'string') data.name = u.name
        if (Object.keys(data).length === 0) return Promise.resolve()
        return prisma.section.update({
          where: { id: u.id },
          data,
        })
      })
    )

    const sections = await prisma.section.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        name: true,
        title: true,
        isEnabled: true,
        sortOrder: true,
        settings: true,
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error updating sections:', error)
    return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 })
  }
}