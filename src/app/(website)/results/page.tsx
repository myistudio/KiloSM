'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  TrendingUp,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import FitText from '@/components/FitText'

// Real-time results component
function RealtimeResults() {
  const [markets, setMarkets] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let es: EventSource | null = null
    let mounted = true

    const refresh = async () => {
      try {
        const res = await fetch('/api/markets/live', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (mounted) {
            setMarkets(Array.isArray(json?.markets) ? json.markets : [])
            setLastUpdate(new Date())
          }
        }
      } catch (e) {
        console.warn('Failed to refresh live markets', e)
      }
    }

    refresh()

    es = new EventSource('/api/markets/live/stream')
    const onMessage = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'version' || data?.type === 'init') {
          refresh()
        }
      } catch {}
    }
    es.addEventListener('message', onMessage)
    es.addEventListener('error', () => {
      if (es && es.readyState === EventSource.CLOSED) {
        es.removeEventListener('message', onMessage)
        es.close()
        es = new EventSource('/api/markets/live/stream')
        es.addEventListener('message', onMessage)
      }
    })

    return () => { mounted = false; es?.removeEventListener('message', onMessage); es?.close() }
  }, [])


  const formatNumber = (m: any) => {
    const openRes = m?.latestResult?.openResult || ''
    const closeRes = m?.latestResult?.closeResult || ''
    const openPanel = (openRes || '').split('-')[0] || 'xxx'
    const closePanel = (closeRes || '').split('-')[0] || 'xxx'
    const jodi = (() => {
      const o = (openRes || '').split('-')[1] || ''
      const c = (closeRes || '').split('-')[1] || ''
      const j = (o && c) ? `${o}${c}` : ''
      return j || 'xx'
    })()
    return `${openPanel}-${jodi}-${closePanel}`
  }

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <TrendingUp className="h-5 w-5" />
              Real-time Results
            </CardTitle>
            <CardDescription className="text-slate-300">
              Live updates from markets currently live
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400" suppressHydrationWarning>
              Last update: {mounted && lastUpdate ? lastUpdate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="space-y-4">
            {markets.length === 0 && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-sm text-slate-300">
                No markets are live right now.
              </div>
            )}
            {markets.map((m) => (
              <div key={m.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <FitText minPx={10} maxPx={20} className="w-full min-w-0">
                      <span className="font-semibold text-white">{m.displayName || m.name}</span>
                    </FitText>
                    <p className="text-xs text-slate-400">({m.openTime} - {m.closeTime})</p>
                  </div>
                  <Badge variant={m.status === 'live' ? 'default' : 'secondary'} className={m.status === 'live' ? 'bg-green-600' : ''}>
                    {m.status === 'live' ? 'Live' : 'Loading'}
                  </Badge>
                </div>

                <div className="text-center py-2">
                -                  <div className="font-mono text-2xl font-bold text-cyan-300">
                -                    {formatNumber(m)}
                -                  </div>
                +                  <FitText minPx={12} maxPx={40} className="w-full min-w-0 text-center">
                +                    <span className="font-mono font-bold text-cyan-300">{formatNumber(m)}</span>
                +                  </FitText>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span suppressHydrationWarning>
                      Updated: {mounted && m.latestResult?.updatedAt ? new Date(m.latestResult.updatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>{m.status === 'live' ? 'Live' : 'Loading'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Page header removed; using shared WebsiteLayout header */}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-8">
        <Card className="mb-6 bg-slate-800/60 border-slate-700">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Live Results
              </CardTitle>
              <CardDescription>Real-time updates</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live Updates
              </Badge>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-slate-400" asChild>
                <Link href="/" prefetch={false}>← Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Results Section */}
        <div className="mb-8">
          <RealtimeResults />
        </div>

        {/* Removed: Tabs and Featured Stats per request */}
      </main>
    </div>
  )
}