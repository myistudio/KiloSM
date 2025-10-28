import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|admin|_next|maintenance|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}

// Middleware checks maintenance mode using the public system settings API.
export async function middleware(req: NextRequest) {
  try {
    const url = req.nextUrl.clone()
    // Allow access to maintenance page itself
    if (url.pathname.startsWith('/maintenance')) {
      return NextResponse.next()
    }

    // Fetch maintenance flag from public settings API
    const origin = `${url.protocol}//${url.host}`
    const res = await fetch(`${origin}/api/system-settings?keys=MAINTENANCE_MODE`, {
      headers: { 'accept': 'application/json' },
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json().catch(() => ({ settings: {} }))
      const enabled = !!data?.settings?.MAINTENANCE_MODE
      if (enabled) {
        const maintenanceUrl = req.nextUrl.clone()
        maintenanceUrl.pathname = '/maintenance'
        maintenanceUrl.search = ''
        return NextResponse.redirect(maintenanceUrl, { status: 307 })
      }
    }
  } catch (e) {
    // On error, allow request to proceed
    console.error('Middleware maintenance check error:', e)
  }

  return NextResponse.next()
}