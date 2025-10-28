'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { MoreHorizontal, Edit, Trash2, Eye, Copy } from 'lucide-react'
import { ResultEntryForm } from './ResultEntryForm'

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
}

interface ResultsTableProps {
  filter?: 'today' | 'pending' | 'history'
  from?: string
  to?: string
  marketId?: string
}

export function ResultsTable({ filter = 'today', from, to, marketId }: ResultsTableProps) {
  const [results, setResults] = useState<AdminResultRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadResults() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('filter', filter)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (marketId) params.set('marketId', marketId)
      const res = await fetch(`/api/admin/results?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to fetch results (${res.status})`)
      }
      const data = await res.json()
      setResults((data.results || []).map((r: any) => ({
        ...r,
        date: r.date,
        createdAt: r.createdAt,
      })))
    } catch (e: any) {
      console.error('Failed to fetch results', e)
      setError(e?.message || 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    ;(async () => {
      if (!ignore) await loadResults()
    })()
    const handler = () => loadResults()
    window.addEventListener('admin-results:refresh', handler)
    return () => {
      ignore = true
      window.removeEventListener('admin-results:refresh', handler)
    }
  }, [filter, from, to, marketId])

  const filteredResults = useMemo(() => results, [results])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/results?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to delete result (${res.status})`)
      }
      await loadResults()
    } catch (e: any) {
      console.error('Error deleting result:', e)
      setError(e?.message || 'Failed to delete result')
    }
  }

  const handleTogglePublish = async (id: string) => {
    try {
      const current = results.find(r => r.id === id)
      const nextPublished = current ? !current.isPublished : true
      const res = await fetch('/api/admin/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished: nextPublished }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to update result (${res.status})`)
      }
      await loadResults()
    } catch (e: any) {
      console.error('Error updating publish state:', e)
      setError(e?.message || 'Failed to update publish state')
    }
  }

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (status === 'NO_RESULT') {
      return <Badge variant="outline">No Result</Badge>
    }
    return isPublished ? (
      <Badge variant="default">Published</Badge>
    ) : (
      <Badge variant="secondary">Pending</Badge>
    )
  }

  const isStub = (r: AdminResultRow) => (typeof r.id === 'string' && r.id.startsWith('stub-'))

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading results…</div>
  }
  if (error) {
    return <div className="py-8 text-center text-destructive">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Open Result</TableHead>
              <TableHead>Close Result</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">{result.marketName}</TableCell>
                <TableCell>
                  <span suppressHydrationWarning>
                    {new Date(result.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </TableCell>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {result.openResult || '-'}
                  </code>
                </TableCell>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {result.closeResult || '-'}
                  </code>
                </TableCell>
                <TableCell>
                  {getStatusBadge(result.status, result.isPublished)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isStub(result) ? (
                        <ResultEntryForm
                          marketId={result.marketId}
                          date={new Date(result.date)}
                          // No resultId for stubs -> create new entry
                          initialOpenResult={result.openResult}
                          initialCloseResult={result.closeResult}
                        >
                          <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                            <Edit className="h-4 w-4 mr-2" />
                            Enter Result
                          </DropdownMenuItem>
                        </ResultEntryForm>
                      ) : (
                        <ResultEntryForm
                          marketId={result.marketId}
                          date={new Date(result.date)}
                          resultId={result.id}
                          initialOpenResult={result.openResult}
                          initialCloseResult={result.closeResult}
                        >
                          <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </ResultEntryForm>
                      )}

                      {!isStub(result) && (
                        <DropdownMenuItem onClick={() => handleTogglePublish(result.id)}>
                          {result.isPublished ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                      )}

                      {!isStub(result) && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(result.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}