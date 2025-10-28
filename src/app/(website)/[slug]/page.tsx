'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Clock } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import FitText from '@/components/FitText'

function toSlug(name: string) {
  return name.trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-')
}

export default function MarketDescriptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // Additional state for charts and admin-managed content
  const [history, setHistory] = useState<any[]>([])
  const [marketContent, setMarketContent] = useState<{ description?: string; official?: string; doDonts?: string }>({})
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

        // Fetch admin-managed content blocks for MARKET_ARTICLES
        const cbRes = await fetch(`/api/sections/MARKET_ARTICLES`, { cache: 'no-store' })
        if (cbRes.ok) {
          const cbJson = await cbRes.json()
          const blocks: Array<{ key: string; content: string }> = cbJson?.section?.contentBlocks || []
          // Admin keys convention: MK_NAME_DESCRIPTION, MK_NAME_OFFICIAL_DETAILS, MK_NAME_DO_DONTS
          const mk = (json?.market?.name || '').trim().toUpperCase().replace(/\s+/g, '-')
          const descKey = `${mk}_DESCRIPTION`
          const offKey = `${mk}_OFFICIAL_DETAILS`
          const ddKey = `${mk}_DO_DONTS`
          setMarketContent({
            description: blocks.find((b) => b.key === descKey)?.content,
            official: blocks.find((b) => b.key === offKey)?.content,
            doDonts: blocks.find((b) => b.key === ddKey)?.content,
          })
        }

        // Fetch recent published results history to power charts
        const hRes = await fetch(`/api/markets/${encodeURIComponent(slug)}/history?limit=180`, { cache: 'no-store' })
        if (hRes.ok) {
          const hJson = await hRes.json()
          setHistory(hJson?.results || [])
        }
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

  // Helpers to compute charts
  const getLastDigit = (s?: string | null): number | null => {
    if (!s) return null
    const m = s.match(/(\d)(?!.*\d)/)
    return m ? Number(m[1]) : null
  }

  const openCounts = Array.from({ length: 10 }, () => 0)
  const closeCounts = Array.from({ length: 10 }, () => 0)
  const jodiMap: Record<string, number> = {}

  for (const r of history) {
    const o = getLastDigit(r?.openResult)
    const c = getLastDigit(r?.closeResult)
    if (typeof o === 'number') openCounts[o]++
    if (typeof c === 'number') closeCounts[c]++
    if (typeof o === 'number' && typeof c === 'number') {
      const j = `${o}${c}`
      jodiMap[j] = (jodiMap[j] || 0) + 1
    }
  }

  const topJodis = Object.entries(jodiMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const maxOpen = Math.max(...openCounts, 1)
  const maxClose = Math.max(...closeCounts, 1)

  // Double-digit jodi distribution (00, 11, ... 99)
  const doubleCounts = Array.from({ length: 10 }, (_, d) => jodiMap[`${d}${d}`] || 0)
  const totalDouble = doubleCounts.reduce((a, b) => a + b, 0) || 0
  const doubleColors = ['#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#eab308','#fb7185','#14b8a6']
  let accDeg = 0
  const gradientSegments: string[] = []
  doubleCounts.forEach((cnt, d) => {
    const deg = totalDouble > 0 ? (cnt / totalDouble) * 360 : 0
    const start = accDeg
    const end = accDeg + deg
    gradientSegments.push(`${doubleColors[d]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`)
    accDeg = end
  })
  const pieStyle: React.CSSProperties = {
    backgroundImage: `conic-gradient(${gradientSegments.join(', ')})`,
  }

  return (
    <div className="max-w-4xl mx-auto px-[5px] py-4 space-y-6">
      {/* Header with name */}
      <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/60 border border-slate-700/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            {market?.displayName || market?.name}
          </CardTitle>
          <CardDescription className="text-slate-300">
            Market timings and latest result
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 py-4 space-y-4">
          {/* Timings & Latest result */}
          <div className="flex flex-wrap items-center gap-3 text-slate-200">
            <Clock className="h-4 w-4" />
            <span className="px-2 py-0.5 rounded bg-slate-700/50">Open: {market?.openTime}</span>
            <span className="px-2 py-0.5 rounded bg-slate-700/50">Close: {market?.closeTime}</span>
            {/* Removed Result time label per requirement */}
          </div>
          <div className="bg-slate-800/60 rounded-md p-4 flex flex-col items-center gap-3 border border-slate-700/60 w-full min-w-0">
            <div className="text-center w-full min-w-0">
              <div className="font-medium text-white">Latest Result</div>
              {latest ? (
                <FitText minPx={12} maxPx={36} className="truncate whitespace-nowrap w-full min-w-0 text-center">
                  <span className="font-mono font-bold text-cyan-400">
                    {(latest.closeResult || latest.openResult || '-') as string}
                  </span>
                </FitText>
              ) : (
                <div className="text-slate-400 text-sm">No result yet</div>
              )}
              {(market?.openTime || market?.closeTime) && (
                <div className="text-[10px] text-slate-400 mt-1">
                  ({to12h(market?.openTime) || market?.openTime} - {to12h(market?.closeTime) || market?.closeTime})
                </div>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <Link href={`/${market?.name?.toLowerCase()}-jodi-chart`} prefetch={false}>
                <Button variant="outline" size="sm" className="rounded-md px-2 py-0.5 text-[11px] bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50 hover:border-teal-700">Jodi Chart</Button>
              </Link>
              <Link href={`/${market?.name?.toLowerCase()}-panel-chart`} prefetch={false}>
                <Button variant="outline" size="sm" className="rounded-md px-2 py-0.5 text-[11px] bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-700">Panel Chart</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Description (major keywords) - admin managed (2nd position) */}
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">About {(market?.displayName || market?.name)}</CardTitle>
          <CardDescription className="text-slate-300">Admin-managed description and major keywords</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300">
            {marketContent.description || 'Admin can add market description and major keywords in MARKET_ARTICLES section using key: MARKETNAME_DESCRIPTION'}
          </div>
        </CardContent>
      </Card>

      {/* Charts Card - keep at 3rd position */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Open digits distribution */}
        <Card className="bg-slate-900/60 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-purple-400">Open Digit Distribution (0-9)</CardTitle>
            <CardDescription className="text-slate-300">Most frequent open digits from chart data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {openCounts.map((cnt, d) => (
              <div key={`open-${d}`} className="flex items-center gap-3">
                <div className="w-8 text-right text-slate-300">{d}</div>
                <div className="flex-1 h-3 bg-slate-800 rounded">
                  <div
                    className="h-3 bg-purple-500 rounded"
                    style={{ width: `${Math.round((cnt / maxOpen) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-slate-400 text-sm">{cnt}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Close digits distribution */}
        <Card className="bg-slate-900/60 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-cyan-400">Close Digit Distribution (0-9)</CardTitle>
            <CardDescription className="text-slate-300">Most frequent close digits from chart data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {closeCounts.map((cnt, d) => (
              <div key={`close-${d}`} className="flex items-center gap-3">
                <div className="w-8 text-right text-slate-300">{d}</div>
                <div className="flex-1 h-3 bg-slate-800 rounded">
                  <div
                    className="h-3 bg-cyan-500 rounded"
                    style={{ width: `${Math.round((cnt / maxClose) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-slate-400 text-sm">{cnt}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Jodis */}
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-amber-400">Top 10 Jodis</CardTitle>
          <CardDescription className="text-slate-300">Computed from open-close singles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {topJodis.length > 0 ? (
              topJodis.map(([j, cnt]) => (
                <div key={`jodi-${j}`} className="bg-slate-800/60 rounded p-2 text-center">
                  <div className="font-mono text-lg font-bold text-amber-400">{j}</div>
                  <div className="text-xs text-slate-400">{cnt} times</div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">Not enough data</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Double Digit Jodi Pie */}
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-pink-400">Double Digit Jodi Share</CardTitle>
          <CardDescription className="text-slate-300">Distribution of jodis like 00, 11, 22, ... 99</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 rounded-full shadow-inner" style={pieStyle}>
              <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-slate-900/80 border border-slate-700/70 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-lg font-bold text-white">{totalDouble}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {doubleCounts.map((cnt, idx) => (
                <div key={`double-${idx}`} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: doubleColors[idx] }} />
                  <div className="text-xs text-slate-300 font-mono">{`${idx}${idx}`}: <span className="text-slate-400">{cnt}</span></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official Details */}
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">{(market?.displayName || market?.name) + ' Official Details'}</CardTitle>
          <CardDescription className="text-slate-300">Admin-managed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300">
            {marketContent.official || 'Admin can add official details using key: MARKETNAME_OFFICIAL_DETAILS in MARKET_ARTICLES section.'}
          </div>
        </CardContent>
      </Card>

      {/* Do and Don’ts */}
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Do and Don’ts</CardTitle>
          <CardDescription className="text-slate-300">Guidelines for players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300">
            {marketContent.doDonts || 'Admin can add do & don’ts using key: MARKETNAME_DO_DONTS in MARKET_ARTICLES section.'}
          </div>
        </CardContent>
      </Card>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `${market?.displayName || market?.name} Market Results and Charts`,
            description: marketContent.description || `Historical results, jodi and panel charts, and timings for ${(market?.displayName || market?.name) || ''} market`,
            keywords: (marketContent.description || '').split(/[\,\s]+/).filter(Boolean).slice(0, 12),
            creator: {
              '@type': 'Organization',
              name: 'Satta Matka',
              // Render placeholder during SSR; replace on mount to avoid hydration mismatch
              url: '',
            },
            distribution: [
              { '@type': 'DataDownload', name: 'Market History', description: 'Recent published results', contentUrl: `/api/markets/${encodeURIComponent(slug)}/history` },
            ],
          }),
        }}
      />
    </div>
  )
}

function to12h(hhmm?: string): string | undefined {
  if (!hhmm) return undefined
  const [hStr, mStr] = hhmm.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const mm = String(m).padStart(2, '0')
  return `${h}:${mm} ${ampm}`
}