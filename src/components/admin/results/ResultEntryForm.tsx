"use client"

import { useEffect, useMemo, useState, useRef } from 'react'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

// Remove discriminated union and define a flat schema that does not require resultType.
const resultSchema = z.object({
  marketId: z.string().min(1, 'Please select a market'),
  date: z.date(),
  openResult: z.string()
    .regex(/^(\d{3}-\d{1})?$/, 'Open result must be in format: 123-4')
    .optional()
    .or(z.literal('')),
  closeResult: z.string()
    .regex(/^(\d{3}-\d{1})?$/, 'Close result must be in format: 123-4')
    .optional()
    .or(z.literal('')),
  color: z.enum(['RED', 'BLACK']).optional(),
})

type ResultFormData = z.infer<typeof resultSchema>

interface ResultEntryFormProps {
  children: React.ReactNode
  marketId?: string
  date?: Date
  // Support editing existing results
  resultId?: string
  initialOpenResult?: string | null
  initialCloseResult?: string | null
  // When provided, restrict UI to only open or only close entry
  entryType?: 'open' | 'close'
}

function sumDigitsMod10(triple: string) {
  if (!/^\d{3}$/.test(triple)) return ''
  const s = triple.split('').reduce((acc, d) => acc + Number(d), 0)
  return String(s % 10)
}

function todayDayEnum(): string {
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
  return days[new Date().getDay()]
}

export function ResultEntryForm({ children, marketId, date, resultId, initialOpenResult, initialCloseResult, entryType }: ResultEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Removed resultType state
  // const [resultType, setResultType] = useState<'SINGLE' | 'DOUBLE' | 'NO_RESULT'>('SINGLE')
  const [markets, setMarkets] = useState<Array<{ id: string; name?: string; displayName: string; isActive: boolean; operatingDays: string[]; openTime: string; closeTime: string }>>([])

  // Digit inputs state: 3-2-3 layout
  const [openTripleDigits, setOpenTripleDigits] = useState<string[]>(['', '', ''])
  const [closeTripleDigits, setCloseTripleDigits] = useState<string[]>(['', '', ''])
  const openRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const closeRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const openTriple = useMemo(() => openTripleDigits.join(''), [openTripleDigits])
  const closeTriple = useMemo(() => closeTripleDigits.join(''), [closeTripleDigits])
  const openSingle = useMemo(() => sumDigitsMod10(openTriple), [openTriple])
  const closeSingle = useMemo(() => sumDigitsMod10(closeTriple), [closeTriple])
  const jodi = useMemo(() => (openSingle && closeSingle ? `${openSingle}${closeSingle}` : ''), [openSingle, closeSingle])

  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      // Removed resultType default
      // resultType: 'SINGLE',
      marketId: marketId || '',
      date: date || new Date(),
      openResult: '',
      closeResult: '',
      color: 'BLACK',
    } as any,
  })

  // Removed currentResultType watcher
  // const currentResultType = form.watch('resultType')

  // Fetch real markets (active and operating today)
  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch('/api/admin/markets')
        const data = await res.json()
        const today = todayDayEnum()
        const all = (data.markets || [])
        // For new entries, show only active markets operating today; for editing existing entries, include all markets
        const filtered = resultId
          ? all
          : all.filter((m: any) => m.isActive && (m.operatingDays || []).includes(today))
        filtered.sort((a: any, b: any) => (a.openTime || '').localeCompare(b.openTime || ''))
        setMarkets(filtered)
      } catch (e) {
        console.error('Failed to load markets', e)
      }
    }
    loadMarkets()
  }, [])

  // Keep form's openResult/closeResult in sync with digits (auto after entering digits)
  useEffect(() => {
    const openRes = /^\d{3}$/.test(openTriple) && openSingle ? `${openTriple}-${openSingle}` : ''
    const closeRes = /^\d{3}$/.test(closeTriple) && closeSingle ? `${closeTriple}-${closeSingle}` : ''
    form.setValue('openResult', openRes)
    form.setValue('closeResult', closeRes)
  }, [openTriple, closeTriple, openSingle, closeSingle, form])

  // Prefill digits when dialog opens for editing
  function parseHalfPanna(val?: string | null): { triple: string | null, single: string | null } {
    if (!val) return { triple: null, single: null }
    const m = val.match(/^(\d{3})-(\d)$/)
    if (!m) return { triple: null, single: null }
    return { triple: m[1], single: m[2] }
  }

  useEffect(() => {
    if (open) {
      // market and date defaults
      if (marketId) form.setValue('marketId', marketId)
      if (date) form.setValue('date', date)

      const openParsed = parseHalfPanna(initialOpenResult || undefined)
      const closeParsed = parseHalfPanna(initialCloseResult || undefined)
      if (openParsed.triple) {
        setOpenTripleDigits(openParsed.triple.split(''))
      }
      if (closeParsed.triple) {
        setCloseTripleDigits(closeParsed.triple.split(''))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true)
    try {
      const payloadBase = {
        marketId: data.marketId,
        date: data.date,
        openResult: data.openResult || null,
        closeResult: data.closeResult || null,
        color: data.color || null,
      }
      const inferredStatus = payloadBase.openResult || payloadBase.closeResult ? 'SINGLE' : 'NO_RESULT'

      let res: Response
      if (resultId) {
        res = await fetch('/api/admin/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: resultId, ...payloadBase, status: inferredStatus, isPublished: inferredStatus !== 'NO_RESULT' }),
        })
      } else {
        res = await fetch('/api/admin/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payloadBase, status: inferredStatus, isPublished: inferredStatus !== 'NO_RESULT' }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save result')
      }

      // Notify lists to reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-results:refresh'))
      }

      setOpen(false)
      form.reset()
      setOpenTripleDigits(['', '', ''])
      setCloseTripleDigits(['', '', ''])
    } catch (error) {
      console.error('Error saving result:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {resultId ? 'Update Result' : entryType === 'open' ? 'Enter Open Result' : entryType === 'close' ? 'Enter Close Result' : 'Enter Result'}
          </DialogTitle>
          <DialogDescription>
            Enter 3-2-3 digits; single digits and jodi will be auto-calculated.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marketId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Market</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a market" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {markets.map((market) => (
                          <SelectItem key={market.id} value={market.id}>
                            {market.displayName} {market.openTime ? `(${market.openTime}-${market.closeTime})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span className="flex items-center">
                                <CalendarIcon className="mr-2 h-4 w-4" /> Pick a date
                              </span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              {(entryType === undefined || entryType === 'open') && (
                <div>
                  <Label>Open Triple</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {openRefs.map((ref, idx) => (
                      <Input
                        key={idx}
                        ref={ref}
                        value={openTripleDigits[idx]}
                        maxLength={1}
                        inputMode="numeric"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          setOpenTripleDigits((prev) => {
                            const next = [...prev]
                            next[idx] = val
                            return next
                          })
                          if (val && idx < openRefs.length - 1) {
                            openRefs[idx + 1].current?.focus()
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(entryType === undefined || entryType === 'close') && (
                <div>
                  <Label>Close Triple</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {closeRefs.map((ref, idx) => (
                      <Input
                        key={idx}
                        ref={ref}
                        value={closeTripleDigits[idx]}
                        maxLength={1}
                        inputMode="numeric"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          setCloseTripleDigits((prev) => {
                            const next = [...prev]
                            next[idx] = val
                            return next
                          })
                          if (val && idx < closeRefs.length - 1) {
                            closeRefs[idx + 1].current?.focus()
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={entryType ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
              {(entryType === undefined || entryType === 'open') && (
                <FormField
                  control={form.control}
                  name="openResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Result</FormLabel>
                      <FormControl>
                        <Input placeholder="123-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(entryType === undefined || entryType === 'close') && (
                <FormField
                  control={form.control}
                  name="closeResult"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Close Result</FormLabel>
                      <FormControl>
                        <Input placeholder="456-5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {(entryType === undefined || entryType === 'close') && (
              <div className="flex items-center gap-3">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={field.value === 'RED'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'RED' : 'BLACK')}
                        />
                        <FormLabel>Mark Close as Red</FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : (resultId ? 'Update Result' : 'Save Result')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}