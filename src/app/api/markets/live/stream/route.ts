import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Server-Sent Events stream that emits a signal when live markets change.
// Uses a Redis "version" key for lightweight real-time notifications.
export async function GET(req: Request) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  let closed = false
  const send = (data: any, event?: string) => {
    const payload = `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`
    return writer.write(encoder.encode(payload))
  }

  // Initial event to prompt client refresh
  await send({ type: 'init', ts: Date.now() })

  let lastVersion: string | null = null

  const check = async () => {
    try {
      const v = await redis.get<string>('live_markets_version')
      if (v !== lastVersion) {
        lastVersion = v ?? null
        await send({ type: 'version', version: v ?? '0', ts: Date.now() })
      }
    } catch (e) {
      // ignore transient errors
    }
  }

  // Start polling Redis for version changes
  const intervalId = setInterval(check, 1500)
  // Heartbeat to keep connection alive
  const heartbeatId = setInterval(() => {
    send({ type: 'ping', ts: Date.now() }, 'ping')
  }, 25000)

  // Abort/cleanup on client disconnect
  const cleanup = () => {
    if (closed) return
    closed = true
    clearInterval(intervalId)
    clearInterval(heartbeatId)
    writer.close().catch(() => {})
  }

  // Listen for request abort signals
  try {
    ;(req as any).signal?.addEventListener?.('abort', cleanup)
  } catch {}

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      // Helpful for some proxies/CDNs to disable buffering
      'X-Accel-Buffering': 'no',
    },
  })
}