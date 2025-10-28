"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Info, BarChart3, LayoutGrid } from 'lucide-react'
import FitText from '@/components/FitText'

// Generic renderer for any SectionType, using public API: /api/sections/[type]
// Supports TEXT, HTML, JSON, LINK and specialized layouts for common sections.
export default function SectionRenderer({
  type,
  title,
  description,
  className,
}: {
  type: string
  title?: string
  description?: string
  className?: string
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [section, setSection] = useState<any>(null)
  // Extra data sources for dynamic sections
  const [liveMarkets, setLiveMarkets] = useState<any[]>([])
  const [latestResults, setLatestResults] = useState<any[]>([])
  const [chartsMarkets, setChartsMarkets] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

const [animTick, setAnimTick] = useState(0)

useEffect(() => {
  const id = setInterval(() => setAnimTick((t) => t + 1), 1200)
  return () => clearInterval(id)
}, [])

  const refreshLiveMarkets = async () => {
    try {
      const res = await fetch('/api/markets/live', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setLiveMarkets(Array.isArray(json?.markets) ? json.markets : [])
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.warn('Extra section load failed', e)
    }
  }

  const refreshLatestResults = async () => {
    try {
      const res = await fetch('/api/markets', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setLatestResults(Array.isArray(json?.markets) ? json.markets : [])
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.warn('Extra section load failed', e)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const t = String(type).toUpperCase()
        const res = await fetch(`/api/sections/${encodeURIComponent(t)}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load section ${t} (${res.status})`)
        const json = await res.json()
        if (!active) return
        setSection(json.section)
      } catch (e: any) {
        console.error('SectionRenderer error:', e)
        if (!active) return
        setError(e?.message || 'Failed to load section')
      } finally {
        if (!active) return
        setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [type])

  useEffect(() => {
    let active = true
    const t = String(type).toUpperCase()

    const loadExtra = async () => {
      try {
        if (t === 'LIVE_RESULTS') {
          await refreshLiveMarkets()
        } else if (t === 'LATEST_RESULTS') {
          await refreshLatestResults()
        } else if (t === 'MARKET_TIMETABLE') {
          await refreshLatestResults()
        } else if (t === 'CHARTS') {
          // Fallback source for Market Detail / Jodi / Panel links
          const res = await fetch('/api/markets', { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            if (active) setChartsMarkets(Array.isArray(json?.markets) ? json.markets : [])
          }
        }
      } catch (e) {
        console.warn('Extra section load failed', e)
      }
    }
    loadExtra()

    // Live updates via SSE using Redis-driven signals
    let es: EventSource | null = null
    let pollId: any = null
    if (t === 'LIVE_RESULTS') {
      es = new EventSource('/api/markets/live/stream')
      const onMessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data)
          if (data?.type === 'version' || data?.type === 'init') {
            refreshLiveMarkets()
          }
        } catch {}
      }
      es.addEventListener('message', onMessage)
      es.addEventListener('error', () => {
        // Reconnect on closed state to avoid lingering aborted connections in dev
        if (es && es.readyState === EventSource.CLOSED) {
          es.removeEventListener('message', onMessage)
          es.close()
          es = new EventSource('/api/markets/live/stream')
          es.addEventListener('message', onMessage)
        }
      })

      // Fallback polling to ensure near real-time updates even if SSE is disrupted
      pollId = setInterval(() => {
        refreshLiveMarkets().catch(() => {})
      }, 10000)

      return () => { active = false; es?.removeEventListener('message', onMessage); es?.close(); if (pollId) clearInterval(pollId) }
    }

    if (t === 'LATEST_RESULTS') {
      es = new EventSource('/api/markets/live/stream')
      const onMessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data)
          if (data?.type === 'version' || data?.type === 'init') {
            refreshLatestResults()
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

      // Fallback polling to ensure near real-time updates even if SSE is disrupted
      pollId = setInterval(() => {
        refreshLatestResults().catch(() => {})
      }, 15000)

      return () => { active = false; es?.removeEventListener('message', onMessage); es?.close(); if (pollId) clearInterval(pollId) }
    }

    return () => { active = false }
  }, [type])

  const sectionTitle = section?.title ?? title ?? type
  const sectionDesc = section?.name ?? description ?? ''
  const defaultTopBar = true
  const showTopBar = typeof section?.settings?.showTopBar === 'boolean' ? section.settings.showTopBar : defaultTopBar

  // Specialized renderers
  const renderContent = () => {
    const t = String(type).toUpperCase()
    const blocks = section?.contentBlocks ?? []

    // Helpers to format combined result and HH:mm -> h:mm AM/PM
    const formatCombined = (open?: string | null, close?: string | null): string | undefined => {
      if (!open || !close) return undefined
      const openParts = String(open).split('-')
      const closeParts = String(close).split('-')
      if (openParts.length < 2 || closeParts.length < 2) return undefined
      const openPatti = openParts[0]
      const openDigit = openParts[1]
      // Case 1: close has full parts like "Patti-Jodi-Patti"
      if (closeParts.length >= 3) {
        const jodi = closeParts[1]
        const closePatti = closeParts[2]
        return `${openPatti}-${jodi}-${closePatti}`
      }
      // Case 2: close has two parts like "Patti-Digit"
      const closePatti = closeParts[0]
      const closeDigit = closeParts[1]
      const jodi = `${openDigit}${closeDigit}`
      return `${openPatti}-${jodi}-${closePatti}`
    }

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

    // LIVE_RESULTS: render from public API
    if (t === 'LIVE_RESULTS') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] text-slate-400" suppressHydrationWarning>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
            </div>
          </div>
          {liveMarkets.length === 0 && <div className="text-sm text-slate-400">No live markets right now.</div>}
          {liveMarkets.map((m: any) => {
            const openRes = m.latestResult?.openResult ?? null
            const closeRes = m.latestResult?.closeResult ?? null
            const combined = formatCombined(openRes, closeRes)
            const result = combined ?? (closeRes || openRes || '—')
            const openT = to12h(m.openTime)
            const closeT = to12h(m.closeTime)
            const slug = m.name
            const isHl = !!m.isHighlighted
            const hlMsg = m.highlightMessage
            const hlText = m.highlightActionText
            const hlUrl = m.highlightActionUrl
            return (
              <div key={m.id} className={`grid grid-cols-[80px_1fr_80px] items-center gap-2 px-[5px] py-2 rounded-md border ${isHl ? 'bg-amber-300/20 border-amber-400/40' : 'bg-slate-800/60 border-slate-800/60'}`}>
                <Link href={`/${slug}-jodi-chart`} prefetch={false} className="block justify-self-start self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-md px-2 py-0.5 text-[11px] bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50 hover:border-teal-700"
                  >
                    Jodi
                  </Button>
                </Link>
                <div className="text-center col-start-2 min-w-0 break-words overflow-hidden">
                  <FitText minPx={10} maxPx={18} className="w-full min-w-0">
                    <span className="font-medium text-white">{m.displayName || m.name}</span>
                  </FitText>
                  <div className="font-mono text-xl md:text-2xl font-bold text-cyan-400">{result}</div>
                  {(to12h(m.openTime) || to12h(m.closeTime)) && (
                    <div className="text-[10px] text-slate-400 mt-1">({to12h(m.openTime) || m.openTime} - {to12h(m.closeTime) || m.closeTime})</div>
                  )}
                  {isHl && hlMsg && (
                    <div className="text-[11px] mt-1 text-amber-200">{hlMsg}</div>
                  )}
                  {isHl && hlUrl && (
                    <div className="mt-2">
                      <Link href={hlUrl} prefetch={false} target="_blank">
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                          {hlText || 'Details'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <Link href={`/${slug}-panel-chart`} prefetch={false} className="block justify-self-end self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-md px-2 py-0.5 text-[11px] bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-700"
                  >
                    Panel
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )
    }

    // LATEST_RESULTS: render from public API
    if (t === 'LATEST_RESULTS') {
      return (
        <div className="space-y-3">
          {latestResults.length === 0 && <div className="text-sm text-slate-400">No latest results.</div>}
          {latestResults.map((r: any) => {
            const latest = Array.isArray(r.results) && r.results.length > 0 ? r.results[0] : null
            const combined = formatCombined(latest?.openResult ?? null, latest?.closeResult ?? null)
            const result = combined ?? (latest?.closeResult || latest?.openResult || '—')
            const marketSlug = (r.name || r.marketName || 'market').toLowerCase().replace(/\s+/g, '-')
            const open12 = to12h(r.openTime)
            const close12 = to12h(r.closeTime)
            const isHl = !!r.isHighlighted
            const hlMsg = r.highlightMessage
            const hlText = r.highlightActionText
            const hlUrl = r.highlightActionUrl
            return (
              <div key={r.id || marketSlug} className={`grid grid-cols-[80px_1fr_80px] items-center gap-2 px-[5px] py-2 rounded-md border ${isHl ? 'bg-amber-300/20 border-amber-400/40' : 'bg-slate-800/60 border-slate-800/60'}`}>
                <Link href={`/${marketSlug}-jodi-chart`} prefetch={false} className="block justify-self-start self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-md px-2 py-0.5 text-[11px] bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50 hover:border-teal-700"
                  >
                    Jodi
                  </Button>
                </Link>
                <div className="text-center col-start-2 min-w-0 break-words overflow-hidden">
                  <FitText minPx={10} maxPx={18} className="w-full min-w-0">
                    <span className="font-medium text-white">{r.displayName || r.name || r.marketDisplayName || r.marketName}</span>
                  </FitText>
                  <FitText minPx={12} maxPx={40} className="w-full min-w-0">
                    <span className="font-mono font-extrabold text-cyan-300">{result}</span>
                  </FitText>
                  {(open12 || close12 || r.openTime || r.closeTime) && (
                    <div className="text-[10px] text-slate-400 mt-1">({open12 || r.openTime} - {close12 || r.closeTime})</div>
                  )}
                  {isHl && hlMsg && (
                    <div className="text-[11px] mt-1 text-amber-200">{hlMsg}</div>
                  )}
                  {isHl && hlUrl && (
                    <div className="mt-2">
                      <Link href={hlUrl} prefetch={false} target="_blank">
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                          {hlText || 'Details'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <Link href={`/${marketSlug}-panel-chart`} prefetch={false} className="block justify-self-end self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-md px-2 py-0.5 text-[11px] bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-700"
                  >
                    Panel
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )
    }

    // MARKET_TIMETABLE: render schedule from markets API or parse JSON blocks
    if (t === 'MARKET_TIMETABLE') {
      const items = latestResults.map((m: any) => ({
        id: m.id,
        name: m.displayName || m.name,
        open: to12h(m.openTime) || m.openTime,
        close: to12h(m.closeTime) || m.closeTime,
        isHighlighted: !!m.isHighlighted,
        highlightMessage: m.highlightMessage,
        highlightActionText: m.highlightActionText,
        highlightActionUrl: m.highlightActionUrl,
      }))

      // Fallback: parse section blocks if API empty
      if (items.length === 0 && Array.isArray(section?.contentBlocks)) {
        section.contentBlocks.forEach((b: any) => {
          if (b.type === 'JSON') {
            try {
              const arr = JSON.parse(b.content)
              if (Array.isArray(arr)) {
                arr.forEach((it: any, idx: number) => {
                  items.push({
                    id: idx,
                    name: it.name,
                    open: it.open,
                    close: it.close,
                    isHighlighted: false,
                    highlightMessage: undefined,
                    highlightActionText: undefined,
                    highlightActionUrl: undefined,
                  })
                })
              }
            } catch {}
          } else if (b.type === 'TEXT') {
            const match = String(b.content).match(/\[(.*)\]/)
            if (match) {
              try {
                const arr = JSON.parse(match[0])
                if (Array.isArray(arr)) {
                  arr.forEach((it: any, idx: number) => {
                    items.push({
                    id: idx,
                    name: it.name,
                    open: it.open,
                    close: it.close,
                    isHighlighted: false,
                    highlightMessage: undefined,
                    highlightActionText: undefined,
                    highlightActionUrl: undefined,
                  })
                  })
                }
              } catch {}
            }
          }
        })
      }

      return (
        <div className="space-y-3">
          {items.length === 0 && <div className="text-sm text-slate-400">No schedule available.</div>}
          {items.map((it: any) => (
            <div key={it.id} className="w-full grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2 p-3 rounded-lg border bg-slate-700/50 border-slate-700/40">
              <div className="min-w-0 break-words break-all whitespace-normal">
                <div className="font-medium text-white">{it.name || '—'}</div>
                <div className="text-sm text-slate-300">Open: {it.open || '—'} • Close: {it.close || '—'}</div>
              </div>
              <div className="min-w-0 break-words break-all text-left sm:text-right">
                {/* Optional result line could be added here if needed */}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (!blocks?.length) {
      return <div className="text-sm text-slate-300">No content available.</div>
    }

    // FAQ: parse JSON { q, a } or render TEXT blocks as list
    if (t === 'FAQ') {
      return (
        <div className="space-y-3">
          {blocks.map((b: any) => {
            let qa: { q?: string; a?: string } | null = null
            if (b.type === 'JSON') {
              try { qa = JSON.parse(b.content) } catch {}
            }
            const question = qa?.q || b.title || b.key
            const answer = qa?.a || (b.type === 'TEXT' ? b.content : '')
            return (
              <div key={b.id} className="p-3 bg-slate-700/40 rounded-md">
                <div className="font-medium text-white">{question}</div>
                {answer && <div className="text-sm text-slate-300 mt-1">{answer}</div>}
              </div>
            )
          })}
        </div>
      )
    }

    // QA_SECTION: similar to FAQ
    if (t === 'QA_SECTION') {
      return (
        <div className="space-y-3">
          {blocks.map((b: any) => {
            let qa: { q?: string; a?: string } | null = null
            if (b.type === 'JSON') {
              try { qa = JSON.parse(b.content) } catch {}
            }
            const question = qa?.q || b.title || b.key
            const answer = qa?.a || (b.type === 'TEXT' ? b.content : '')
            return (
              <div key={b.id} className="p-3 bg-slate-700/40 rounded-md">
                <div className="font-medium text-white">{question}</div>
                {answer && <div className="text-sm text-slate-300 mt-1">{answer}</div>}
              </div>
            )
          })}
        </div>
      )
    }

    // KEYWORD_SEO: render keywords as badges (comma or newline separated)
    if (t === 'KEYWORD_SEO') {
      const keywords: string[] = []
      blocks.forEach((b: any) => {
        const parts = String(b.content)
          .split(/[\,\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
        keywords.push(...parts)
      })
      return (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <Badge key={`${kw}-${i}`} variant="secondary" className="text-xs">
              {kw}
            </Badge>
          ))}
        </div>
      )
    }

    // ASTROLOGY_LUCK: parse numeric chips from TEXT/JSON
    if (t === 'ASTROLOGY_LUCK') {
      const openNums: string[] = []
      const closeNums: string[] = []
      const jodiGuesses: string[] = []
      const panelGuesses: string[] = []
      
      const collectNumsFromText = (text: string): string[] => {
        return String(text)
          .split(/[\s,•\n]+/)
          .map((s) => s.trim())
          .filter((s) => /^\d+$/.test(s))
      }
      
      const extractLabel = (text: string, label: string): string[] => {
        const re = new RegExp(`${label}\\s*:\\s*([^\n]+)`, 'i')
        const m = text.match(re)
        if (m) return collectNumsFromText(m[1])
        return []
      }
      
      blocks.forEach((b: any) => {
        if (b.type === 'JSON') {
          try {
            const data = JSON.parse(b.content)
            if (Array.isArray(data)) {
              openNums.push(...data.map((x: any) => String(x)))
            } else if (data && typeof data === 'object') {
              if (Array.isArray(data.open)) openNums.push(...data.open.map((x: any) => String(x)))
              if (Array.isArray(data.close)) closeNums.push(...data.close.map((x: any) => String(x)))
              if (Array.isArray(data.jodi)) jodiGuesses.push(...data.jodi.map((x: any) => String(x)))
              if (Array.isArray(data.panel)) panelGuesses.push(...data.panel.map((x: any) => String(x)))
            }
          } catch {}
        } else {
          const text = String(b.content)
          const o = extractLabel(text, 'open')
          const c = extractLabel(text, 'close')
          const j = extractLabel(text, 'jodi')
          const p = extractLabel(text, 'panel')
          if (o.length || c.length || j.length || p.length) {
            openNums.push(...o)
            closeNums.push(...c)
            jodiGuesses.push(...j)
            panelGuesses.push(...p)
          } else {
            // Fallback: treat all numbers as open
            openNums.push(...collectNumsFromText(text))
          }
        }
      })
      
      const open = openNums
      const close = closeNums.length ? closeNums : openNums
      const jodi = jodiGuesses.length ? jodiGuesses : openNums
      const panel = panelGuesses.length ? panelGuesses : openNums
      
      // Simple, eye-catchy static tags per category (no animations)
      const Tag = ({ value, variant }: { value: string; variant: 'open'|'close'|'jodi'|'panel' }) => {
        const cls = variant === 'open'
          ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
          : variant === 'close'
          ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
          : variant === 'jodi'
          ? 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30'
          : 'bg-pink-500/15 text-pink-200 border-pink-400/30'
        return (
          <span className={`px-3 py-1 rounded-md border shadow-sm backdrop-blur-sm ${cls}`}>
            {value}
          </span>
        )
      }

      return (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Open</div>
            <div className="flex flex-wrap gap-2">
              {open.length === 0 && <div className="text-sm text-slate-400">No numbers.</div>}
              {open.map((n, i) => (
                <Tag key={`open-${n}-${i}`} value={n} variant="open" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Close</div>
            <div className="flex flex-wrap gap-2">
              {close.length === 0 && <div className="text-sm text-slate-400">No numbers.</div>}
              {close.map((n, i) => (
                <Tag key={`close-${n}-${i}`} value={n} variant="close" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Jodi Guessing</div>
            <div className="flex flex-wrap gap-2">
              {jodi.length === 0 && <div className="text-sm text-slate-400">No jodi guesses.</div>}
              {jodi.map((n, i) => (
                <Tag key={`jodi-${n}-${i}`} value={n} variant="jodi" />
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-2">Panel Guessing</div>
            <div className="flex flex-wrap gap-2">
              {panel.length === 0 && <div className="text-sm text-slate-400">No panel guesses.</div>}
              {panel.map((n, i) => (
                <Tag key={`panel-${n}-${i}`} value={n} variant="panel" />
              ))}
            </div>
          </div>
        </div>
      )
    }



  // WEEKLY_TIPS_*: render tips as colored chips
  if (['WEEKLY_TIPS_PATTI', 'WEEKLY_TIPS_LINE', 'WEEKLY_TIPS_JODI'].includes(String(type).toUpperCase())) {
    const tips: string[] = []
    blocks.forEach((b: any) => {
      if (b.type === 'JSON') {
        try {
          const arr = JSON.parse(b.content)
          if (Array.isArray(arr)) tips.push(...arr.map((x) => String(x)))
        } catch {}
      } else {
        const parts = String(b.content)
          .split(/[\s,•]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        tips.push(...parts)
      }
    })
    return (
      <div className="flex flex-wrap gap-2">
        {tips.map((t, i) => (
          <span key={`${t}-${i}`} className="px-3 py-1 rounded-full bg-slate-700/60 text-slate-200 text-xs border border-slate-600">
            {t}
          </span>
        ))}
      </div>
    )
  }

  // FREE_GAME_ZONE: chips from text/json
  if (String(type).toUpperCase() === 'FREE_GAME_ZONE') {
    const games: string[] = []
    blocks.forEach((b: any) => {
      if (b.type === 'JSON') {
        try {
          const arr = JSON.parse(b.content)
          if (Array.isArray(arr)) games.push(...arr.map((x) => String(x)))
        } catch {}
      } else {
        const parts = String(b.content)
          .split(/[\s,•\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        games.push(...parts)
      }
    })
    return (
      <div className="flex flex-wrap gap-2">
        {games.length === 0 && <div className="text-sm text-slate-400">No games available.</div>}
        {games.map((g, i) => (
          <span key={`${g}-${i}`} className="px-3 py-1 rounded-full bg-slate-700/60 text-slate-200 text-xs border border-slate-600">
            {g}
          </span>
        ))}
      </div>
    )
  }

  // Default: Render as a grid of cards from blocks
  const renderGrid = () => {
    const normalized = blocks.map((b: any) => ({
      id: b.id,
      title: b.title || b.key || 'Untitled',
      description: b.content || '',
      link: b.linkUrl || b.link || '',
    }))
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {normalized.map((b: any) => (
          <Card key={b.id} className="bg-slate-800/60 border-slate-700/40">
            <CardHeader>
              <CardTitle className="text-white text-base">{b.title}</CardTitle>
              {b.description && (
                <CardDescription className="text-slate-300 text-sm">{b.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {b.link && (
                <Link href={b.link} target="_blank">
                  <Button variant="secondary" size="sm">Open</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const preset = String(section?.settings?.preset ?? '').toUpperCase()
  if (preset === 'GRID') return renderGrid()

  return (
    <div className="space-y-3">
      {blocks.map((b: any) => (
        <div key={b.id} className="p-3 bg-slate-800/60 rounded-md border border-slate-800/60">
          <div className="font-semibold text-slate-100">{b.title || b.key || 'Untitled'}</div>
          {b.content && (
            <div className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{b.content}</div>
          )}
          {b.linkUrl && (
            <Link href={b.linkUrl} target="_blank" className="inline-block mt-2">
              <Button variant="secondary" size="sm">Open</Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
  }

  const showTitleBar = showTopBar && (sectionTitle || sectionDesc)

  return (
    <Card className={className || 'bg-slate-900/60 border-slate-800/60'}>
      {showTitleBar && (
        <CardHeader>
          {sectionTitle && (
            <CardTitle className="text-white text-base flex items-center gap-2">
              {String(type).toUpperCase() === 'CHARTS' && <LayoutGrid className="h-4 w-4 text-cyan-300" />}
              {String(type).toUpperCase() === 'LIVE_RESULTS' && <BarChart3 className="h-4 w-4 text-red-300" />}
              {String(type).toUpperCase() === 'LATEST_RESULTS' && <BarChart3 className="h-4 w-4 text-cyan-300" />}
              {String(type).toUpperCase() === 'FAQ' && <Info className="h-4 w-4 text-slate-300" />}
              {sectionTitle}
            </CardTitle>
          )}
          {sectionDesc && (
            <CardDescription className="text-slate-300 text-sm">{sectionDesc}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        {error && (
          <div className="text-sm text-red-400 mb-3">{error}</div>
        )}
        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : (
          renderContent()
        )}
      </CardContent>
    </Card>
  )
}