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
      },
    })
    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}