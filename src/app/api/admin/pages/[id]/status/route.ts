import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

// Update page enable status
// Payload: { isEnabled: boolean }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  try {
    const pageId = params.id
    const body = await req.json().catch(() => ({}))
    const { isEnabled } = body || {}

    if (!pageId) return NextResponse.json({ error: 'page id is required' }, { status: 400 })
    if (typeof isEnabled !== 'boolean') return NextResponse.json({ error: 'isEnabled must be boolean' }, { status: 400 })

    const page = await prisma.page.update({
      where: { id: pageId },
      data: { isEnabled },
      select: { id: true, slug: true, title: true, isEnabled: true },
    })

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error updating page status:', error)
    return NextResponse.json({ error: 'Failed to update page status' }, { status: 500 })
  }
}