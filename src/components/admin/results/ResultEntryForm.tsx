'use client'

import { useState } from 'react'
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

// Result validation schemas
const singleResultSchema = z.object({
  openResult: z.string()
    .regex(/^\d{3}-\d{1}$/, 'Open result must be in format: 123-4')
    .optional()
    .or(z.literal('')),
  closeResult: z.string()
    .regex(/^\d{3}-\d{1}$/, 'Close result must be in format: 123-4')
    .optional()
    .or(z.literal('')),
})

const doubleResultSchema = z.object({
  openResult: z.string()
    .regex(/^\d{3}-\d{2}-\d{3}$/, 'Open result must be in format: 123-45-678')
    .optional()
    .or(z.literal('')),
  closeResult: z.string()
    .regex(/^\d{3}-\d{2}-\d{3}$/, 'Close result must be in format: 123-45-678')
    .optional()
    .or(z.literal('')),
})

const noResultSchema = z.object({
  status: z.literal('NO_RESULT'),
})

const resultSchema = z.discriminatedUnion('resultType', [
  z.object({
    resultType: z.literal('SINGLE'),
    ...singleResultSchema.shape,
  }),
  z.object({
    resultType: z.literal('DOUBLE'),
    ...doubleResultSchema.shape,
  }),
  z.object({
    resultType: z.literal('NO_RESULT'),
    ...noResultSchema.shape,
  }),
]).and(z.object({
  marketId: z.string().min(1, 'Please select a market'),
  date: z.date(),
}))

type ResultFormData = z.infer<typeof resultSchema>

// Mock markets data
const mockMarkets = [
  { id: '1', name: 'KALYAN', displayName: 'Kalyan Morning' },
  { id: '2', name: 'MILAN_DAY', displayName: 'Milan Day' },
  { id: '3', name: 'RAJDHANI_NIGHT', displayName: 'Rajdhani Night' },
]

interface ResultEntryFormProps {
  children: React.ReactNode
  marketId?: string
  date?: Date
}

export function ResultEntryForm({ children, marketId, date }: ResultEntryFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resultType, setResultType] = useState<'SINGLE' | 'DOUBLE' | 'NO_RESULT'>('SINGLE')

  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      resultType: 'SINGLE',
      marketId: marketId || '',
      date: date || new Date(),
      openResult: '',
      closeResult: '',
    },
  })

  const currentResultType = form.watch('resultType')

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving result:', data)

      // Calculate jodi and panel automatically
      const calculations = calculateJodiAndPanel(data)

      // Here you would make an API call to save the result
      const resultData = {
        ...data,
        ...calculations,
      }

      console.log('Result with calculations:', resultData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error saving result:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateJodiAndPanel = (data: ResultFormData) => {
    // Auto-calculation logic for jodi and panel
    const calculations: { jodi?: string; panel?: string } = {}

    if (data.resultType === 'SINGLE' && data.closeResult) {
      const closeDigits = data.closeResult.replace(/[-\s]/g, '')
      if (closeDigits.length >= 3) {
        calculations.jodi = `${closeDigits[1]}${closeDigits[2]}`
        calculations.panel = `${closeDigits[0]}${closeDigits[1]}${closeDigits[2]}`
      }
    }

    return calculations
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enter Result</DialogTitle>
          <DialogDescription>
            Enter result for the selected market and date. Results will be auto-calculated.
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
                        {mockMarkets.map((market) => (
                          <SelectItem key={market.id} value={market.id}>
                            {market.displayName} ({market.name})
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
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resultType"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Result Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select result type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single (123-4)</SelectItem>
                      <SelectItem value="DOUBLE">Double (123-45-678)</SelectItem>
                      <SelectItem value="NO_RESULT">No Result (*--***)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentResultType !== 'NO_RESULT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="openResult"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Open Result</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              currentResultType === 'SINGLE' ? '123-4' : '123-45-678'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closeResult"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Close Result</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              currentResultType === 'SINGLE' ? '123-4' : '123-45-678'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Auto-calculation preview */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Auto-Calculations</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Jodi:</span>
                      <span className="ml-2 font-mono">45</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Panel:</span>
                      <span className="ml-2 font-mono">123</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Result'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}