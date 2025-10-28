'use client'

import { useState, useEffect } from 'react'
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
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { MarketForm } from './MarketForm'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Mock data - will be replaced with actual database queries
const mockMarkets = [
  {
    id: '1',
    name: 'KALYAN',
    displayName: 'Kalyan Morning',
    status: 'ACTIVE' as const,
    openTime: '11:30',
    closeTime: '12:30',
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'MILAN_DAY',
    displayName: 'Milan Day',
    status: 'ACTIVE' as const,
    openTime: '15:00',
    closeTime: '17:00',
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'RAJDHANI_NIGHT',
    displayName: 'Rajdhani Night',
    status: 'INACTIVE' as const,
    openTime: '21:30',
    closeTime: '23:30',
    operatingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    isActive: false,
    sortOrder: 3,
  },
]

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
}

export function MarketsTable() {
  const [data, setData] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchMarkets = async () => {
    setErrorMessage('')
    try {
      const res = await fetch('/api/admin/markets')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to fetch markets (${res.status})`)
      }
      const json = await res.json()
      setData(json?.markets || [])
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
      const res = await fetch(`/api/admin/markets?id=${marketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
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

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert className="border-destructive text-destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Operating Days</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((market: Market) => (
            <TableRow key={market.id}>
              <TableCell className="font-medium">{market.name}</TableCell>
              <TableCell>{market.displayName}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>Open: {market.openTime}</div>
                  <div>Close: {market.closeTime}</div>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}