"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketTimingsCard() {
  const [markets, setMarkets] = useState<Array<{
    name: string
    open: string
    close: string
    result: string
    isHighlighted?: boolean
    highlightMessage?: string | null
    highlightActionText?: string | null
    highlightActionUrl?: string | null
  }>>([])
  const [error, setError] = useState<string>('')
  const [mtSettings, setMtSettings] = useState<{ headingColor?: string; textColor?: string; backgroundColor?: string; headerBgColor?: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        const res = await fetch('/api/markets', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load markets (${res.status})`)
        const json = await res.json()
        const items = (json?.markets ?? []).map((m: any) => ({
          name: m.displayName || m.name,
          open: m.openTime,
          close: m.closeTime,
          result: m.resultTime,
          isHighlighted: !!m.isHighlighted,
          highlightMessage: m.highlightMessage ?? null,
          highlightActionText: m.highlightActionText ?? null,
          highlightActionUrl: m.highlightActionUrl ?? null,
        }))
        setMarkets(items)
      } catch (e: any) {
        console.error('Error loading markets:', e)
        setError(e?.message || 'Failed to load markets')
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/sections/MARKET_TIMETABLE', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        setMtSettings(json?.section?.settings || null)
      } catch {}
    }
    loadSettings()
  }, [])

  return (
    <Card className={mtSettings?.backgroundColor ? '' : 'bg-slate-800/50'} style={mtSettings?.backgroundColor ? { backgroundColor: mtSettings.backgroundColor } : undefined}>
      <CardHeader style={mtSettings?.headerBgColor ? { background: mtSettings.headerBgColor } : undefined}>
        <CardTitle className="flex items-center gap-2 text-blue-400" style={{ color: mtSettings?.headingColor || undefined }}>
          <Clock className="h-5 w-5" />
          Market Timings
        </CardTitle>
        <CardDescription className="text-slate-300" style={{ color: mtSettings?.textColor || undefined }}>
          Today's schedule for all markets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-400">{error}</div>
        )}
        <div className="space-y-3">
          {markets.length === 0 && (
            <div className="text-sm text-slate-400">No markets available.</div>
          )}
          {markets.map((market, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-slate-700/50 border-slate-700/40"
            >
              <div>
                <div className="font-medium text-white">{market.name}</div>
                <div className="text-sm text-slate-400">
                  Open: {market.open} • Close: {market.close}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-400">Result</div>
                <div className="text-sm text-slate-400">{market.result}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}