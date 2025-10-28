"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BulkResultEntry } from './BulkResultEntry'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { ResultEntryForm } from './ResultEntryForm'
import { HistoryRangePicker } from './HistoryRangePicker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, X, Trash2 } from 'lucide-react'

interface AdminResultRow {
  id: string
  marketId: string
  marketName: string
  date: string | Date
  openResult: string | null
  closeResult: string | null
  status: string
  isPublished: boolean
  createdAt: string | Date
  openTime?: string
  closeTime?: string
}

function parseHalfPanna(val?: string | null): { triple: string | null; single: string | null } {
  if (!val) return { triple: null, single: null }
  const m = val.match(/^(\d{3})-(\d)$/)
  if (!m) return { triple: null, single: null }
  return { triple: m[1], single: m[2] }
}

function sumDigitsMod10(triple: string) {
  if (!/^\d{3}$/.test(triple)) return ''
  const s = triple.split('').map((d) => parseInt(d, 10)).reduce((a, b) => a + b, 0)
  return String(s % 10)
}

function getTodayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function toMinutes(hhmm?: string): number {
  if (!hhmm) return NaN
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10))
  return h * 60 + m
}

function getISTMinutesNow(): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const str = formatter.format(now)
  const [h, m] = str.split(':').map((s) => parseInt(s, 10))
  return h * 60 + m
}

function ResultRow({ row, onSaved, compact = false, preMin, postMin }: { row: AdminResultRow; onSaved: () => void; compact?: boolean; preMin: number; postMin: number }) {
  const [openTriple, setOpenTriple] = useState<string>(() => parseHalfPanna(row.openResult).triple || '')
  const [closeTriple, setCloseTriple] = useState<string>(() => parseHalfPanna(row.closeResult).triple || '')
  const openSingle = useMemo(() => sumDigitsMod10(openTriple), [openTriple])
  const closeSingle = useMemo(() => sumDigitsMod10(closeTriple), [closeTriple])
  const openResult = useMemo(() => (/^\d{3}$/.test(openTriple) && openSingle ? `${openTriple}-${openSingle}` : ''), [openTriple, openSingle])
  const closeResult = useMemo(() => (/^\d{3}$/.test(closeTriple) && closeSingle ? `${closeTriple}-${closeSingle}` : ''), [closeTriple, closeSingle])
  const [saving, setSaving] = useState(false)

  const isStub = row.id.startsWith('stub-')

  // Compute which entry should be shown now for faster updates
  const [nowMin, setNowMin] = useState<number>(getISTMinutesNow())
  useEffect(() => {
    const id = setInterval(() => setNowMin(getISTMinutesNow()), 15000)
    return () => clearInterval(id)
  }, [])
  const openMin = toMinutes(row.openTime)
  const closeMin = toMinutes(row.closeTime)
  const openWindowStart = Number.isFinite(openMin) ? (openMin - preMin) : NaN
  const openWindowEnd = Number.isFinite(openMin) ? (openMin + postMin) : NaN
  const closeWindowStart = Number.isFinite(closeMin) ? (closeMin - preMin) : NaN
  const closeWindowEnd = Number.isFinite(closeMin) ? (closeMin + postMin) : NaN

  const withinOpenWindow = Number.isFinite(openMin) && nowMin >= (openMin - preMin) && nowMin <= (openMin + postMin)
  const withinCloseWindow = Number.isFinite(closeMin) && nowMin >= (closeMin - preMin) && nowMin <= (closeMin + postMin)

  const showOpen = withinOpenWindow && !row.openResult
  const showClose = withinCloseWindow && !row.closeResult

  const save = async () => {
    setSaving(true)
    try {
      const payloadBase = {
        marketId: row.marketId,
        date: typeof row.date === 'string' ? new Date(row.date) : row.date,
        openResult: openResult || null,
        closeResult: closeResult || null,
      }
      const inferredStatus = payloadBase.openResult || payloadBase.closeResult ? 'SINGLE' : 'NO_RESULT'

      let res: Response
      if (isStub) {
        res = await fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadBase, status: inferredStatus, isPublished: false }),
        })
      } else {
        res = await fetch('/api/admin/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: row.id, ...payloadBase, status: inferredStatus }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save result')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-results:refresh'))
      }
      onSaved()
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  const markNoResult = async () => {
    if (isStub) return // nothing to delete/patch for stub without an entry
    setSaving(true)
    try {
      const res = await fetch('/api/admin/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, openResult: null, closeResult: null, status: 'NO_RESULT', isPublished: false }),
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('admin-results:refresh'))
        onSaved()
      }
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const togglePublish = async (publish: boolean) => {
    if (isStub) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isPublished: publish }),
      })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('admin-results:refresh'))
        onSaved()
      }
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const del = async () => {
    if (isStub) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/results?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('admin-results:refresh'))
        onSaved()
      }
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  return (
    <TableRow>
      <TableCell className={cn('text-sm', compact && 'py-2')}>
        {row.marketName}
        <Badge variant={row.isPublished ? 'default' : 'outline'} className="ml-2">{row.isPublished ? 'Published' : 'Draft'}</Badge>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-2', compact && 'gap-1')}>
          {showOpen ? (
            <>
              <Input value={openTriple} maxLength={3} inputMode="numeric" placeholder="123" onChange={(e) => setOpenTriple(e.target.value.replace(/[^0-9]/g, '').slice(0,3))} />
              <Badge variant="secondary" className="min-w-[32px] justify-center">{openSingle || '–'}</Badge>
              <span className="text-xs text-muted-foreground">{openResult || ''}</span>
              {Number.isFinite(openMin) && (
                <span className="text-[10px] text-muted-foreground">Ends in {Math.max(0, Math.ceil(openWindowEnd - nowMin))}m</span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{row.openResult || '—'}</span>
          )}
          {!showOpen && !row.openResult && Number.isFinite(openMin) && (
            nowMin < openWindowStart ? (
              <span className="text-[10px] text-muted-foreground">Opens in {Math.max(0, Math.ceil(openWindowStart - nowMin))}m</span>
            ) : (
              nowMin > openWindowEnd ? (
                <span className="text-[10px] text-muted-foreground">Window closed</span>
              ) : null
            )
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-2', compact && 'gap-1')}>
          {showClose ? (
            <>
              <Input value={closeTriple} maxLength={3} inputMode="numeric" placeholder="456" onChange={(e) => setCloseTriple(e.target.value.replace(/[^0-9]/g, '').slice(0,3))} />
              <Badge variant="secondary" className="min-w-[32px] justify-center">{closeSingle || '–'}</Badge>
              <span className="text-xs text-muted-foreground">{closeResult || ''}</span>
              {Number.isFinite(closeMin) && (
                <span className="text-[10px] text-muted-foreground">Ends in {Math.max(0, Math.ceil(closeWindowEnd - nowMin))}m</span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{row.closeResult || '—'}</span>
          )}
          {!showClose && !row.closeResult && Number.isFinite(closeMin) && (
            nowMin < closeWindowStart ? (
              <span className="text-[10px] text-muted-foreground">Closes in {Math.max(0, Math.ceil(closeWindowStart - nowMin))}m</span>
            ) : (
              nowMin > closeWindowEnd ? (
                <span className="text-[10px] text-muted-foreground">Window closed</span>
              ) : null
            )
          )}
        </div>
      </TableCell>
      <TableCell className={cn(compact && 'py-2')}>
        <div className="flex items-center gap-2">
          <Button size={compact ? 'sm' : 'default'} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          {!isStub && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={compact ? 'sm' : 'default'} variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => togglePublish(!row.isPublished)}>
                  {row.isPublished ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={markNoResult}>Mark NO_RESULT</DropdownMenuItem>
                <DropdownMenuItem onClick={del} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {(showOpen || showClose) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {showOpen ? 'Open window active – enter OPEN result now.' : showClose ? 'Close window active – enter CLOSE result now.' : ''}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

export function ResultsManager() {
  const [pending, setPending] = useState<AdminResultRow[]>([])
  const [today, setToday] = useState<AdminResultRow[]>([])
  const [todayMarkets, setTodayMarkets] = useState<Array<{ id: string; name?: string; displayName: string }>>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingMarkets, setLoadingMarkets] = useState(true)
  const [autoMode, setAutoMode] = useState<boolean>(false)
  const [autoPublish, setAutoPublish] = useState<boolean>(true)
  const [savingSettings, setSavingSettings] = useState<boolean>(false)
  const [preWindowMin, setPreWindowMin] = useState<number>(15)
  const [postWindowMin, setPostWindowMin] = useState<number>(15)
  const [liveRefreshEnabled, setLiveRefreshEnabled] = useState<boolean>(false)

  const fetchPending = async () => {
    setLoadingPending(true)
    try {
      const res = await fetch('/api/admin/results?filter=pending', { cache: 'no-store' })
      const json = await res.json()
      setPending((json.results || []).sort((a: AdminResultRow, b: AdminResultRow) => (a.marketName || '').localeCompare(b.marketName || '')))
    } catch (e) { console.error(e) } finally { setLoadingPending(false) }
  }

  const fetchToday = async () => {
    setLoadingToday(true)
    try {
      const res = await fetch('/api/admin/results?filter=today', { cache: 'no-store' })
      const json = await res.json()
      setToday(json.results || [])
    } catch (e) { console.error(e) } finally { setLoadingToday(false) }
  }

  const fetchTodayMarkets = async () => {
    setLoadingMarkets(true)
    try {
      const res = await fetch('/api/admin/markets', { cache: 'no-store' })
      const json = await res.json()
      const dayEnum = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date().getDay()]
      const markets = (json.markets || [])
        .filter((m: any) => m.isActive && (m.operatingDays || []).includes(dayEnum))
        .map((m: any) => ({ id: m.id, name: m.name, displayName: m.displayName }))
      setTodayMarkets(markets)
    } catch (e) { console.error(e) } finally { setLoadingMarkets(false) }
  }

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/system-settings', { cache: 'no-store' })
      const json = await res.json()
      const s = json.settings || {}
      setAutoMode(Boolean(s.RESULTS_AUTO_MODE_ENABLED))
      setAutoPublish(Boolean(s.RESULTS_AUTO_PUBLISH_ON_COMPLETE ?? true))
      setPreWindowMin(Number.isFinite(Number(s.LIVE_PRE_WINDOW_MINUTES)) ? Number(s.LIVE_PRE_WINDOW_MINUTES) : 15)
      setPostWindowMin(Number.isFinite(Number(s.LIVE_POST_WINDOW_MINUTES)) ? Number(s.LIVE_POST_WINDOW_MINUTES) : 15)
    } catch (e) { console.error('Failed to load settings', e) }
  }

  useEffect(() => {
    fetchPending(); fetchToday(); fetchTodayMarkets(); loadSettings()
    const handler = () => { fetchPending(); fetchToday() }
    window.addEventListener('admin-results:refresh', handler as any)
    return () => window.removeEventListener('admin-results:refresh', handler as any)
  }, [])

  useEffect(() => {
    if (!liveRefreshEnabled) return
    const id = setInterval(() => {
      fetchPending(); fetchToday(); fetchTodayMarkets()
    }, 15000)
    return () => clearInterval(id)
  }, [liveRefreshEnabled])

  // Subscribe to SSE for immediate refresh signals when live markets change (via Redis version key)
  useEffect(() => {
    const es = new EventSource('/api/markets/live/stream')
    const onMessage = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'version' || data?.type === 'init') {
          fetchPending(); fetchToday()
        }
      } catch {}
    }
    es.addEventListener('message', onMessage)
    es.addEventListener('error', () => { /* auto-reconnect */ })
    return () => { es.removeEventListener('message', onMessage); es.close() }
  }, [])

  const saveSetting = async (key: string, value: any) => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save setting')
      }
    } catch (e) {
      console.error('Save setting failed', e)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automation & Controls</CardTitle>
          <CardDescription>Configure automatic mode and quick access to manual updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={autoMode}
                  onCheckedChange={async (checked) => {
                    setAutoMode(checked)
                    await saveSetting('RESULTS_AUTO_MODE_ENABLED', checked)
                  }}
                />
                <div>
                  <div className="text-sm font-medium">Automatic Mode</div>
                  <div className="text-xs text-muted-foreground">When enabled, the system assists with scheduling and publishing logic.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={autoPublish}
                  onCheckedChange={async (checked) => {
                    setAutoPublish(checked)
                    await saveSetting('RESULTS_AUTO_PUBLISH_ON_COMPLETE', checked)
                  }}
                  disabled={!autoMode}
                />
                <div>
                  <div className="text-sm font-medium">Auto-publish on completion</div>
                  <div className="text-xs text-muted-foreground">Publish automatically when both Open and Close are entered.</div>
                </div>
              </div>
              {/* Live window configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium">Live pre-window (minutes)</div>
                    <div className="text-xs text-muted-foreground">Show inputs starting this many minutes before open/close.</div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={preWindowMin}
                    onChange={(e) => setPreWindowMin(Math.max(0, Math.min(180, parseInt(e.target.value || '0', 10))))}
                    onBlur={async (e) => {
                      const v = Math.max(0, Math.min(180, parseInt(e.target.value || '0', 10)))
                      if (!Number.isFinite(v)) return
                      await saveSetting('LIVE_PRE_WINDOW_MINUTES', v)
                    }}
                    className="w-24"
                    disabled={savingSettings}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium">Live post-window (minutes)</div>
                    <div className="text-xs text-muted-foreground">Keep inputs visible for this many minutes after open/close.</div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={postWindowMin}
                    onChange={(e) => setPostWindowMin(Math.max(0, Math.min(180, parseInt(e.target.value || '0', 10))))}
                    onBlur={async (e) => {
                      const v = Math.max(0, Math.min(180, parseInt(e.target.value || '0', 10)))
                      if (!Number.isFinite(v)) return
                      await saveSetting('LIVE_POST_WINDOW_MINUTES', v)
                    }}
                    className="w-24"
                    disabled={savingSettings}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={liveRefreshEnabled}
                  onCheckedChange={(checked) => setLiveRefreshEnabled(checked)}
                />
                <div>
                  <div className="text-sm font-medium">Live auto-refresh</div>
                  <div className="text-xs text-muted-foreground">Automatically reload Pending and Today every 15 seconds.</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <BulkResultEntry>
                <Button variant="outline" className="w-full sm:w-auto">Bulk Entry</Button>
              </BulkResultEntry>
              <ResultEntryForm>
                <Button className="w-full sm:w-auto">Manual Entry</Button>
              </ResultEntryForm>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { fetchPending(); fetchToday(); }}>Refresh Now</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Results */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Results</CardTitle>
          <CardDescription>Markets operating today without published results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Date: <span suppressHydrationWarning>{getTodayDateOnly().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <BulkResultEntry>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Bulk Entry</Button>
              </BulkResultEntry>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => { fetchPending(); fetchToday(); }}>Refresh Now</Button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Market</TableHead>
                  <TableHead className="min-w-[220px]">Open</TableHead>
                  <TableHead className="min-w-[220px]">Close</TableHead>
                  <TableHead className="min-w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPending && (
                  <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
                )}
                {!loadingPending && pending.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted-foreground">No pending markets for today.</TableCell></TableRow>
                )}
                {pending.map((row) => (
                  <ResultRow key={row.id} row={row} onSaved={fetchPending} compact preMin={preWindowMin} postMin={postWindowMin} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Today's Results */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Results</CardTitle>
          <CardDescription>Entered results for today; manage publish and corrections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => { fetchPending(); fetchToday(); }}>Refresh Now</Button>
          </div>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Market</TableHead>
                  <TableHead className="min-w-[220px]">Open</TableHead>
                  <TableHead className="min-w-[220px]">Close</TableHead>
                  <TableHead className="min-w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingToday && (
                  <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
                )}
                {!loadingToday && today.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted-foreground">No results yet for today.</TableCell></TableRow>
                )}
                {today.map((row) => (
                  <ResultRow key={row.id} row={row} onSaved={fetchToday} preMin={preWindowMin} postMin={postWindowMin} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* History editing moved to separate page: /admin/results/history */}

      {/* Today's Open Entry Market List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Open Entry Market List</CardTitle>
          <CardDescription>Markets operating today without OPEN entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Market</TableHead>
                  <TableHead className="min-w-[160px]">Enter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loadingMarkets || loadingToday) && (
                  <TableRow><TableCell colSpan={2}>Loading…</TableCell></TableRow>
                )}
                {!loadingMarkets && !loadingToday && todayMarkets
                  .filter(m => !(today.find((r) => r.marketId === m.id)?.openResult))
                  .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))
                  .map((m) => (
                    <TableRow key={`open-${m.id}`}>
                      <TableCell>{m.displayName || m.name}</TableCell>
                      <TableCell>
                        <ResultEntryForm marketId={m.id} date={getTodayDateOnly()} entryType="open">
                          <Button size="sm">Enter Result</Button>
                        </ResultEntryForm>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loadingMarkets && !loadingToday && todayMarkets.filter(m => !(today.find((r) => r.marketId === m.id)?.openResult)).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-muted-foreground">All OPEN entries completed.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Today's Close Entry Market List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Close Entry Market List</CardTitle>
          <CardDescription>Markets operating today without CLOSE entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Market</TableHead>
                  <TableHead className="min-w-[160px]">Enter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loadingMarkets || loadingToday) && (
                  <TableRow><TableCell colSpan={2}>Loading…</TableCell></TableRow>
                )}
                {!loadingMarkets && !loadingToday && todayMarkets
                  .filter(m => !(today.find((r) => r.marketId === m.id)?.closeResult))
                  .sort((a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || ''))
                  .map((m) => (
                    <TableRow key={`close-${m.id}`}>
                      <TableCell>{m.displayName || m.name}</TableCell>
                      <TableCell>
                        <ResultEntryForm marketId={m.id} date={getTodayDateOnly()} entryType="close">
                          <Button size="sm">Enter Result</Button>
                        </ResultEntryForm>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loadingMarkets && !loadingToday && todayMarkets.filter(m => !(today.find((r) => r.marketId === m.id)?.closeResult)).length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-muted-foreground">All CLOSE entries completed.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}