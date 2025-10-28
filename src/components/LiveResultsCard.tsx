"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SmallLiveStatus from '@/components/SmallLiveStatus'
import { BarChart3 } from 'lucide-react'

export default function LiveResultsCard() {
  const [results, setResults] = useState<Array<{ market: string; open?: string; close?: string; result?: string; status?: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [lrSettings, setLrSettings] = useState<{ headingColor?: string; textColor?: string; backgroundColor?: string; headerBgColor?: string; accentHeight?: number; accentSticky?: boolean } | null>(null)

  const to12h = (hhmm?: string): string | undefined => {
    if (!hhmm) return undefined
    const [hStr, mStr] = hhmm.split(':')
    let h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    const mm = String(m).padStart(2, '0')
    const hh = String(h).padStart(2, '0')
    return `${hh}:${mm} ${ampm}`
  }

  const accentHeight = Math.max(20, Math.min(40, Number((lrSettings as any)?.accentHeight) || 24))
  const accentSticky = (lrSettings as any)?.accentSticky !== false

  useEffect(() => {
    let timer: any
    const load = async () => {
      try {
        setError('')
        setIsLoading(true)
        const res = await fetch('/api/markets/live', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load live markets (${res.status})`)
        const json = await res.json()
        const items = (json?.markets ?? []).map((m: any) => ({
          market: m.displayName || m.name,
          result: m.latestResult?.closeResult || m.latestResult?.openResult || '-',
          status: m.status === 'live' ? 'live' : 'loading',
          open: m.openTime,
          close: m.closeTime,
        }))
        setResults(items)
      } catch (e: any) {
        console.error('Error loading live markets:', e)
        setError(e?.message || 'Failed to load live markets')
      } finally {
        setIsLoading(false)
      }
    }
    load()
    timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/sections/LIVE_RESULTS', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        setLrSettings(json?.section?.settings || null)
      } catch {}
    }
    loadSettings()
  }, [])

  return (
    <Card
      className={`relative overflow-hidden ${lrSettings?.backgroundColor ? '' : 'bg-slate-900/60 border border-slate-800/60'}`}
      style={lrSettings?.backgroundColor ? { backgroundColor: lrSettings.backgroundColor } : undefined}
    >
      <div
        className={`${accentSticky ? 'sticky top-0 z-10' : 'absolute top-0'} left-0 right-0`}
        style={{ height: accentHeight, background: lrSettings?.headerBgColor || 'linear-gradient(90deg, rgba(77,77,77,0.5), rgba(99,99,99,0.5))' }}
      >
        <div className="h-full flex items-center justify-end pr-3 border-b border-slate-700/40 backdrop-blur-sm">
          <SmallLiveStatus size="sm" inline />
        </div>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400" style={{ color: lrSettings?.headingColor || undefined }}>
          <BarChart3 className="h-5 w-5" />
          Live Results
        </CardTitle>
        <CardDescription className="text-slate-300" style={{ color: lrSettings?.textColor || undefined }}>
          Markets currently live
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}
        {isLoading && !results.length ? (
          <div className="text-sm text-slate-400">Loading live markets…</div>
        ) : (
          <div className="space-y-3">
            {results.length === 0 && (
              <div className="text-sm text-slate-400">No live markets right now.</div>
            )}
            {results.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.market}</div>
                  <div className="text-xs text-slate-400">
                    Open: {to12h(item.open)} • Close: {to12h(item.close)}
                  </div>
                </div>
                <div className="text-right">
                  {item.status === 'loading' ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-green-400">{item.result}</div>
                  )}
                  <div className="text-xs text-slate-400">{item.status === 'live' ? 'Live' : 'Loading…'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}