'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'

const marketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  // Removed resultTime per requirement
  operatingDays: z.array(z.string()).min(1, 'Select at least one operating day'),
  isActive: z.boolean(),
  sortOrder: z.number().min(0),
  // New fields for associated page links
  descriptionLink: z.string().min(1, 'Provide a link for Market Description'),
  jodiChartLink: z.string().min(1, 'Provide a link for Jodi Chart'),
  panelChartLink: z.string().min(1, 'Provide a link for Panel Chart'),
})

type MarketFormData = z.infer<typeof marketSchema>

interface Market {
  id?: string
  name: string
  displayName: string
  status: string
  openTime: string
  closeTime: string
  // Removed resultTime
  operatingDays: string[]
  isActive: boolean
  sortOrder: number
  pageLinks?: {
    description: string
    jodi: string
    panel: string
  }
}

interface MarketFormProps {
  children: React.ReactNode
  market?: Market
}

const daysOfWeek = [
  { id: 'MONDAY', label: 'Monday' },
  { id: 'TUESDAY', label: 'Tuesday' },
  { id: 'WEDNESDAY', label: 'Wednesday' },
  { id: 'THURSDAY', label: 'Thursday' },
  { id: 'FRIDAY', label: 'Friday' },
  { id: 'SATURDAY', label: 'Saturday' },
  { id: 'SUNDAY', label: 'Sunday' },
]

export function MarketForm({ children, market }: MarketFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [descTouched, setDescTouched] = useState(false)
  const [jodiTouched, setJodiTouched] = useState(false)
  const [panelTouched, setPanelTouched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const form = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      name: market?.name || '',
      displayName: market?.displayName || '',
      openTime: market?.openTime || '11:30',
      closeTime: market?.closeTime || '12:30',
      // Removed resultTime default
      operatingDays: market?.operatingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      isActive: market?.isActive ?? true,
      sortOrder: market?.sortOrder || 0,
      descriptionLink: market?.pageLinks?.description || '',
      jodiChartLink: market?.pageLinks?.jodi || '',
      panelChartLink: market?.pageLinks?.panel || '',
    },
  })

  // Auto-suggest page links from Market Code (name) or Display Name when fields are untouched
  const nameValue = form.watch('name')
  const displayNameValue = form.watch('displayName')
  useEffect(() => {
    const baseSource = (nameValue || displayNameValue || '').trim()
    const slugName = baseSource.replace(/\s+/g, '-').toUpperCase()
    const base = slugName ? `/${slugName}` : ''

    if (!descTouched) {
      form.setValue('descriptionLink', base)
    }
    if (!jodiTouched) {
      form.setValue('jodiChartLink', base ? `${base}-JODI-CHART` : '')
    }
    if (!panelTouched) {
      form.setValue('panelChartLink', base ? `${base}-PANEL-CHART` : '')
    }
  }, [nameValue, displayNameValue, descTouched, jodiTouched, panelTouched])

  const onSubmit = async (data: MarketFormData) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      // Build defaults when links are not provided
      const slugName = data.name.trim().replace(/\s+/g, '-').toUpperCase()
      const pages = {
        description: (data.descriptionLink?.trim()) || `/${slugName}`,
        jodi: (data.jodiChartLink?.trim()) || `/${slugName}-JODI-CHART`,
        panel: (data.panelChartLink?.trim()) || `/${slugName}-PANEL-CHART`,
      }

      const res = await fetch('/api/admin/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          displayName: data.displayName,
          openTime: data.openTime,
          closeTime: data.closeTime,
          operatingDays: data.operatingDays,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          descriptionLink: pages.description,
          jodiChartLink: pages.jodi,
          panelChartLink: pages.panel,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to save market (${res.status})`)
      }

      // const json = await res.json()
      // Optionally update local state or refetch table
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('markets:updated'))
      }

      setOpen(false)
      form.reset()
    } catch (error: any) {
      console.error('Error saving market:', error)
      setErrorMessage(error?.message || 'Failed to save market')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {market ? 'Edit Market' : 'Add New Market'}
          </DialogTitle>
          <DialogDescription>
            {market
              ? 'Update market information and settings.'
              : 'Create a new Satta Matka market with schedule and settings.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && (
              <Alert className="border-destructive text-destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Market Code</FormLabel>
                    <FormControl>
                      <Input placeholder="KALYAN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Kalyan Morning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openTime"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Open Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closeTime"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Close Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Associated Pages Links */}
            <div className="space-y-2">
              <Label className="text-base">Associated Pages Links</Label>
              <div className="text-xs text-muted-foreground">
                <div>If left blank, defaults will be based on MARKETNAME:</div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  <li>
                    Description: <span className="font-mono">/MARKETNAME</span>
                  </li>
                  <li>
                    Jodi Chart: <span className="font-mono">/MARKETNAME-JODI-CHART</span>
                  </li>
                  <li>
                    Panel Chart: <span className="font-mono">/MARKETNAME-PANEL-CHART</span>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="descriptionLink"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Market Description Page Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.xxx.com/market-description"
                          {...field}
                          onChange={(e) => {
                            setDescTouched(true)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jodiChartLink"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Jodi Chart Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.xxx.com/jodi-chart"
                          {...field}
                          onChange={(e) => {
                            setJodiTouched(true)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="panelChartLink"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Panel Chart Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.xxx.com/panel-chart"
                          {...field}
                          onChange={(e) => {
                            setPanelTouched(true)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="operatingDays"
              render={() => (
                <FormItem>
                  <FormLabel>Operating Days</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                      {daysOfWeek.map((day) => (
                        <FormField
                          key={day.id}
                          control={form.control}
                          name="operatingDays"
                          render={({ field }: { field: any }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked: boolean) => {
                                      return checked
                                        ? field.onChange([...field.value, day.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value: string) => value !== day.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this market
                      </div>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (market ? 'Update Market' : 'Create Market')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}