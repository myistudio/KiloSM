import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

// List all app settings
export async function GET() {
  await requireAdmin()
  try {
    const rows = await prisma.appSetting.findMany({
      orderBy: { key: 'asc' },
      select: { id: true, key: true, value: true, updatedAt: true },
    })

    const settings: Record<string, any> = {}
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
  }
}

// Upsert settings. Accepts either an array of { key, value } or an object map.
export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()

    let entries: Array<{ key: string; value: any }> = []
    if (Array.isArray(body)) {
      entries = body
    } else if (body && typeof body === 'object') {
      entries = Object.keys(body).map((k) => ({ key: k, value: body[k] }))
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Validate keys
    for (const e of entries) {
      if (!e.key || typeof e.key !== 'string') {
        return NextResponse.json({ error: 'Each entry must have a string key' }, { status: 400 })
      }
    }

    const results = []
    for (const e of entries) {
      const saved = await prisma.appSetting.upsert({
        where: { key: e.key },
        update: { value: JSON.stringify(e.value) },
        create: { key: e.key, value: JSON.stringify(e.value) },
        select: { id: true, key: true, value: true, updatedAt: true },
      })
      results.push(saved)
    }

    return NextResponse.json({ updated: results })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 })
  }
}