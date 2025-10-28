"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function QuickStatsCard() {
  const [stats, setStats] = useState<{ totalMarkets: number; liveNow: number; totalResults: number } | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        const res = await fetch('/api/stats', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load stats (${res.status})`)
        const json = await res.json()
        setStats({
          totalMarkets: json?.totalMarkets ?? 0,
          liveNow: json?.liveNow ?? 0,
          totalResults: json?.totalResults ?? 0,
        })
      } catch (e: any) {
        console.error('Error loading stats:', e)
        setError(e?.message || 'Failed to load stats')
      }
    }
    load()
  }, [])

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Activity className="h-5 w-5" />
          Quick Stats
        </CardTitle>
        <CardDescription>Overview of site activity</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-400">{error}</div>
        )}
        {stats ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
              <div className="text-sm text-slate-400">Total Markets</div>
              <div className="text-xl font-semibold">{stats.totalMarkets}</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
              <div className="text-sm text-slate-400">Live Now</div>
              <div className="text-xl font-semibold">{stats.liveNow}</div>
            </div>
            <div className="p-3 bg-slate-700/50 rounded-lg text-center">
              <div className="text-sm text-slate-400">Total Results</div>
              <div className="text-xl font-semibold">{stats.totalResults}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Loading stats…</div>
        )}
      </CardContent>
    </Card>
  )
}