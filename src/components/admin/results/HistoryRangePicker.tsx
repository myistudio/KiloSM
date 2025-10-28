"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as RangeCalendar } from '@/components/ui/calendar'
import { Calendar } from 'lucide-react'
import { ResultsTable } from '@/components/admin/results/ResultsTable'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

function formatDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function HistoryRangePicker() {
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from, to }
  })

  const [markets, setMarkets] = useState<Array<{ id: string; name: string; displayName: string }>>([])
  const [selectedMarketId, setSelectedMarketId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/markets', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const items = (json.markets || []).map((m: any) => ({ id: m.id, name: m.name, displayName: m.displayName }))
        if (!ignore) setMarkets(items)
      } catch (e) {
        console.error('Failed to load markets', e)
      }
    })()
    return () => { ignore = true }
  }, [])

  const fromStr = range.from ? formatDateInput(range.from) : undefined
  const toStr = range.to ? formatDateInput(range.to) : undefined
  const marketIdParam = selectedMarketId || undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {range.from && range.to ? (
                <span>
                  <div className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>
                      {range.from.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                    {' '} - {' '}
                    <span suppressHydrationWarning>
                      {range.to.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                </span>
              ) : (
                <span>Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <RangeCalendar
              mode="range"
              selected={range}
              onSelect={(r: any) => setRange(r)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            const to = new Date()
            const from = new Date()
            from.setDate(from.getDate() - 30)
            setRange({ from, to })
          }}
        >
          Last 30 days
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Use 'ALL' sentinel to avoid empty string value errors */}
          <Select value={selectedMarketId ?? 'ALL'} onValueChange={(val) => setSelectedMarketId(val === 'ALL' ? undefined : val)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All markets</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.displayName || m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ResultsTable filter="history" from={fromStr} to={toStr} marketId={marketIdParam} />
    </div>
  )
}