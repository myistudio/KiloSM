import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Public system settings API: exposes selected keys for client/middleware consumption.
// Usage: GET /api/system-settings?keys=MAINTENANCE_MODE,SITE_TITLE,SITE_TAGLINE
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const keysParam = searchParams.get('keys')
    // Limit default exposure to only MAINTENANCE_MODE if no keys provided
    const requestedKeys = (keysParam?.split(',').map((k) => k.trim()).filter(Boolean) || ['MAINTENANCE_MODE'])

    const rows = await prisma.appSetting.findMany({
      where: { key: { in: requestedKeys } },
      select: { key: true, value: true },
    })

    const settings: Record<string, any> = {}
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    }

    // Ensure all requested keys are present (fallbacks if missing)
    for (const k of requestedKeys) {
      if (!(k in settings)) {
        settings[k] = null
      }
    }

    return NextResponse.json({ settings }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error('Error fetching public system settings:', error)
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
  }
}