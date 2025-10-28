'use client'

import { useState } from 'react'
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

// Mock results data
const mockResults = [
  {
    id: '1',
    marketId: '1',
    marketName: 'Kalyan Morning',
    date: new Date(),
    openResult: '123-4',
    closeResult: '567-8',
    jodi: '78',
    panel: '567',
    status: 'PUBLISHED' as const,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    marketId: '2',
    marketName: 'Milan Day',
    date: new Date(),
    openResult: '234-5',
    closeResult: '678-9',
    jodi: '89',
    panel: '678',
    status: 'PENDING' as const,
    isPublished: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    marketId: '3',
    marketName: 'Rajdhani Night',
    date: new Date(),
    openResult: null,
    closeResult: null,
    jodi: null,
    panel: null,
    status: 'NO_RESULT' as const,
    isPublished: true,
    createdAt: new Date(),
  },
]

interface ResultsTableProps {
  filter?: 'today' | 'pending' | 'history'
}

export function ResultsTable({ filter = 'today' }: ResultsTableProps) {
  const [results, setResults] = useState(mockResults)

  const filteredResults = results.filter(result => {
    switch (filter) {
      case 'today':
        return result.date.toDateString() === new Date().toDateString()
      case 'pending':
        return !result.isPublished
      case 'history':
        return result.date < new Date()
      default:
        return true
    }
  })

  const handleDelete = (id: string) => {
    setResults(results.filter(result => result.id !== id))
  }

  const handleTogglePublish = (id: string) => {
    setResults(results.map(result =>
      result.id === id
        ? { ...result, isPublished: !result.isPublished }
        : result
    ))
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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Open Result</TableHead>
            <TableHead>Close Result</TableHead>
            <TableHead>Jodi</TableHead>
            <TableHead>Panel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResults.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{result.marketName}</TableCell>
              <TableCell>{result.date.toLocaleDateString()}</TableCell>
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
                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {result.jodi || '-'}
                </code>
              </TableCell>
              <TableCell>
                <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {result.panel || '-'}
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
                    <ResultEntryForm marketId={result.marketId} date={result.date}>
                      <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </ResultEntryForm>
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
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(result.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No results found for the selected filter.
        </div>
      )}
    </div>
  )
}