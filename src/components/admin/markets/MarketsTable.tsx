'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { MarketForm } from './MarketForm'
import { Alert, AlertDescription } from '@/components/ui/alert'

function toSlug(name: string) {
  return name.trim().toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-')
}

// Define local Market type matching API response
interface Market {
  id: string
  name: string
  displayName: string
  openTime: string
  closeTime: string
  operatingDays: string[]
  isActive: boolean
  sortOrder: number
  // Highlight fields
  isHighlighted?: boolean
  highlightMessage?: string | null
  highlightActionText?: string | null
  highlightActionUrl?: string | null
}

export function MarketsTable() {
  const [data, setData] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [edits, setEdits] = useState<Record<string, { openTime: string; closeTime: string; isHighlighted?: boolean; highlightMessage?: string; highlightActionText?: string; highlightActionUrl?: string }>>({})

  const fetchMarkets = async () => {
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/markets')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to fetch markets (${res.status})`)
      }
      const json = await res.json()
      const list: Market[] = json?.markets || []
      setData(list)
      setEdits(list.reduce((acc, m) => {
        acc[m.id] = {
          openTime: m.openTime,
          closeTime: m.closeTime,
          isHighlighted: !!m.isHighlighted,
          highlightMessage: m.highlightMessage || '',
          highlightActionText: m.highlightActionText || '',
          highlightActionUrl: m.highlightActionUrl || '',
        }
        return acc
      }, {} as Record<string, { openTime: string; closeTime: string; isHighlighted?: boolean; highlightMessage?: string; highlightActionText?: string; highlightActionUrl?: string }>))
    } catch (error: any) {
      console.error('Error loading markets:', error)
      setErrorMessage(error?.message || 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
    const handler = () => fetchMarkets()
    window.addEventListener('markets:updated', handler)
    return () => window.removeEventListener('markets:updated', handler)
  }, [])

  const handleDelete = async (marketId: string) => {
    try {
      const res = await fetch(`/api/admin/markets?id=${marketId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to delete market (${res.status})`)
      }
      // Refresh list after delete
      fetchMarkets()
    } catch (error: any) {
      console.error('Error deleting market:', error)
      setErrorMessage(error?.message || 'Failed to delete market')
    }
  }

  const handleToggleStatus = async (marketId: string, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/markets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketId, isActive: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to update market (${res.status})`)
      }
      // Refresh list after update
      fetchMarkets()
    } catch (error: any) {
      console.error('Error updating market:', error)
      setErrorMessage(error?.message || 'Failed to update market')
    }
  }

  const handleSaveTimes = async (marketId: string) => {
    try {
      const entry = edits[marketId]
      if (!entry) return
      const res = await fetch(`/api/admin/markets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketId, openTime: entry.openTime, closeTime: entry.closeTime }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to update market times (${res.status})`)
      }
      fetchMarkets()
    } catch (error: any) {
      console.error('Error saving times:', error)
      setErrorMessage(error?.message || 'Failed to save times')
    }
  }

  const handleSaveHighlight = async (marketId: string) => {
    try {
      const entry = edits[marketId]
      if (!entry) return
      const res = await fetch(`/api/admin/markets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: marketId,
          isHighlighted: !!entry.isHighlighted,
          highlightMessage: (entry.highlightMessage || '').trim() || null,
          highlightActionText: (entry.highlightActionText || '').trim() || null,
          highlightActionUrl: (entry.highlightActionUrl || '').trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to update highlight (${res.status})`)
      }
      // Broadcast and refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('markets:updated'))
      }
      fetchMarkets()
    } catch (error: any) {
      console.error('Error saving highlight:', error)
      setErrorMessage(error?.message || 'Failed to save highlight settings')
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert className="border-destructive text-destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Market</TableHead>
              <TableHead className="min-w-[200px]">Times</TableHead>
              <TableHead className="min-w-[110px]">Status</TableHead>
              <TableHead className="min-w-[180px]">Days</TableHead>
              <TableHead className="min-w-[260px]">Highlight</TableHead>
              <TableHead className="min-w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((market) => {
              const current = edits[market.id] || { openTime: market.openTime, closeTime: market.closeTime, isHighlighted: !!market.isHighlighted, highlightMessage: market.highlightMessage || '', highlightActionText: market.highlightActionText || '', highlightActionUrl: market.highlightActionUrl || '' }
              const openVal = current.openTime
              const closeVal = current.closeTime
              const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t)
              const hasChanges = openVal !== market.openTime || closeVal !== market.closeTime
              const canSave = hasChanges && isValidTime(openVal) && isValidTime(closeVal)

              return (
                <TableRow key={market.id}>
                  <TableCell>
                    <div className="font-medium">{market.displayName}</div>
                    <div className="text-xs text-muted-foreground">{market.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Open:</span>
                        <Input
                          value={openVal}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, openTime: e.target.value } }))}
                          placeholder="HH:MM"
                          className="h-8 w-[110px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Close:</span>
                        <Input
                          value={closeVal}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, closeTime: e.target.value } }))}
                          placeholder="HH:MM"
                          className="h-8 w-[110px]"
                        />
                      </div>
                      {!isValidTime(openVal) || !isValidTime(closeVal) ? (
                        <div className="text-[10px] text-destructive">Time format must be HH:MM</div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={market.isActive ? 'default' : 'secondary'}>
                      {market.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {market.operatingDays.slice(0, 3).map((day: string) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                      {market.operatingDays.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{market.operatingDays.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!current.isHighlighted}
                          onCheckedChange={(val) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, isHighlighted: !!val } }))}
                        />
                        <span className="text-xs">Highlight</span>
                      </div>
                      <Input
                        value={current.highlightMessage || ''}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, highlightMessage: e.target.value } }))}
                        placeholder="Highlight message (optional)"
                        className="h-8"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={current.highlightActionText || ''}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, highlightActionText: e.target.value } }))}
                          placeholder="Button text"
                          className="h-8"
                        />
                        <Input
                          value={current.highlightActionUrl || ''}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [market.id]: { ...current, highlightActionUrl: e.target.value } }))}
                          placeholder="Button link URL"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Button variant="outline" size="sm" onClick={() => handleSaveHighlight(market.id)}>
                          Save Highlight
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaveTimes(market.id)} disabled={!canSave}>
                        Save
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <MarketForm market={{ ...market, status: market.isActive ? 'ACTIVE' : 'INACTIVE' }}>
                            <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </MarketForm>
                          <DropdownMenuItem onClick={() => handleToggleStatus(market.id, !market.isActive)}>
                            {market.isActive ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${toSlug(market.name)}`} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Market Page
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Market</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{market.displayName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(market.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No markets found.
        </div>
      )}
    </div>
  )
}