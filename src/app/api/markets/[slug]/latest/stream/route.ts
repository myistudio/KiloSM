import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function getTodayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function parseResultParts(r?: string | null): string[] {
  return String(r || '').split('-').filter(Boolean)
}

function deriveLatest(open?: string | null, close?: string | null): { openPatti?: string; jodi?: string; closePatti?: string } {
  const o = parseResultParts(open)
  const c = parseResultParts(close)
  const openPatti = o.length >= 1 ? o[0] : undefined
  let jodi: string | undefined
  const cm = String(close || '').match(/^(\d{3})-(\d{2})-(\d{3})$/)
  if (cm) {
    jodi = cm[2]
  } else if (o.length >= 2 && c.length >= 2) {
    const openDigit = o[1]
    const closeDigit = c[1]
    jodi = `${openDigit}${closeDigit}`
  }
  const closePatti = c.length >= 3 ? c[2] : (c.length >= 1 ? c[0] : undefined)
  return { openPatti, jodi, closePatti }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await context.params
  const slug = (rawSlug || '').toLowerCase()

  const headers = new Headers()
  headers.set('Content-Type', 'text/event-stream')
  headers.set('Cache-Control', 'no-store, no-transform')
  headers.set('Connection', 'keep-alive')
  headers.set('X-Accel-Buffering', 'no')

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  let keepAlive: any
  let poller: any
  let lastSentUpdatedAt: string | null = null

  async function sendEvent(data: any) {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    } catch (e) {
      // writer may be closed
    }
  }

  async function pollLatest() {
    try {
      const market = await prisma.market.findFirst({
        where: {
          isActive: true,
          OR: [
            { name: { equals: slug, mode: 'insensitive' } },
            { displayName: { equals: slug, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, displayName: true, openTime: true, closeTime: true },
      })

      if (!market) {
        await sendEvent({ error: 'Market not found' })
        return
      }

      const today = getTodayDateOnly()
      const latest = await prisma.marketResult.findFirst({
        where: { marketId: market.id, date: today },
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          id: true,
          date: true,
          openResult: true,
          closeResult: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const derived = latest ? deriveLatest(latest.openResult, latest.closeResult) : {}
      const payload = {
        market,
        today: latest
          ? {
              id: latest.id,
              date: latest.date,
              openResult: latest.openResult ?? null,
              closeResult: latest.closeResult ?? null,
              openPatti: derived.openPatti ?? null,
              jodi: derived.jodi ?? null,
              closePatti: derived.closePatti ?? null,
              isPublished: latest.isPublished,
              createdAt: latest.createdAt,
              updatedAt: latest.updatedAt,
            }
          : null,
      }

      const updatedAtStr = latest?.updatedAt ? new Date(latest.updatedAt).toISOString() : null

      // Send an initial event immediately on first connection
      if (lastSentUpdatedAt === null) {
        await sendEvent(payload)
        lastSentUpdatedAt = updatedAtStr
        return
      }

      if (updatedAtStr !== lastSentUpdatedAt) {
        lastSentUpdatedAt = updatedAtStr
        await sendEvent(payload)
      }
    } catch (err) {
      await sendEvent({ error: 'Failed to fetch latest result' })
    }
  }

  // Send initial event then start polling
  pollLatest()

  keepAlive = setInterval(async () => {
    try { await writer.write(encoder.encode(`:heartbeat\n\n`)) } catch {}
  }, 25000)

  poller = setInterval(pollLatest, 3000)

  const abort = () => {
    if (keepAlive) clearInterval(keepAlive)
    if (poller) clearInterval(poller)
    try { writer.close() } catch {}
  }

  const signal = (req as any)?.signal as AbortSignal | undefined
  if (signal) {
    signal.addEventListener('abort', abort)
  }

  return new Response(readable, { headers })
}