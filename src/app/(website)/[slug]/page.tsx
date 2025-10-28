'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Clock } from 'lucide-react'
import React from 'react'

function toSlug(name: string) {
  return name.trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-')
}

export default function MarketDescriptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        const res = await fetch(`/api/markets/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            setError('Market not found or inactive')
            return
          }
          throw new Error(`Failed to load market (${res.status})`)
        }
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        console.error('Error loading market:', e)
        setError(e?.message || 'Failed to load market')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  // Redirect if inactive or missing
  useEffect(() => {
    if (data && !data.market?.isActive) {
      router.replace('/')
    }
  }, [data, router])

  if (loading) {
    return <div className="p-6 text-slate-200">Loading market...</div>
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>
  }

  const market = data?.market
  const latest = data?.latestResult

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
            {market?.displayName || market?.name}
          </CardTitle>
          <CardDescription className="text-slate-300">
            Market timings and latest result
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 py-4 space-y-3">
          <div className="flex items-center gap-3 text-slate-200">
            <Clock className="h-4 w-4" />
            <span>Open: {market?.openTime}</span>
            <span>Close: {market?.closeTime}</span>
            <span>Result: {market?.resultTime}</span>
          </div>
          <div className="bg-slate-800/60 rounded-md p-4 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="font-medium text-white">Latest Result</div>
              {latest ? (
                <div className="font-mono text-lg font-bold text-cyan-400">
                  {(latest.closeResult || latest.openResult || '-') as string}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No result yet</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-md px-2 py-0.5 text-[11px] bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50 hover:border-teal-700">Jodi Chart</Button>
              <Button variant="outline" size="sm" className="rounded-md px-2 py-0.5 text-[11px] bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-700">Panel Chart</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}