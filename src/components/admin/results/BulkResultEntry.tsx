'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Plus, Trash2 } from 'lucide-react'

const bulkResultSchema = z.object({
  date: z.date(),
  results: z.array(z.object({
    marketId: z.string().min(1, 'Market is required'),
    openResult: z.string().optional(),
    closeResult: z.string().optional(),
  })).min(1, 'At least one result is required'),
})

type BulkResultFormData = z.infer<typeof bulkResultSchema>

// Mock markets data
const mockMarkets = [
  { id: '1', name: 'KALYAN', displayName: 'Kalyan Morning' },
  { id: '2', name: 'MILAN_DAY', displayName: 'Milan Day' },
  { id: '3', name: 'RAJDHANI_NIGHT', displayName: 'Rajdhani Night' },
]

interface BulkResultEntryProps {
  children: React.ReactNode
}

export function BulkResultEntry({ children }: BulkResultEntryProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BulkResultFormData>({
    resolver: zodResolver(bulkResultSchema),
    defaultValues: {
      date: new Date(),
      results: [
        { marketId: '', openResult: '', closeResult: '' },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'results',
  })

  const onSubmit = async (data: BulkResultFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving bulk results:', data)

      // Here you would make an API call to save multiple results
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error saving bulk results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addResultRow = () => {
    append({ marketId: '', openResult: '', closeResult: '' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Result Entry</DialogTitle>
          <DialogDescription>
            Enter results for multiple markets at once. Auto-calculation will be applied to all entries.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Market Results</Label>
                <Button type="button" variant="outline" size="sm" onClick={addResultRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Market
                </Button>
              </div>

              <div className="border rounded-lg">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Market</TableHead>
                        <TableHead>Open Result</TableHead>
                        <TableHead>Close Result</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`results.${index}.marketId`}
                              render={({ field: selectField }: { field: any }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={selectField.onChange}
                                    defaultValue={selectField.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select market" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {mockMarkets.map((market) => (
                                        <SelectItem key={market.id} value={market.id}>
                                          {market.displayName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`results.${index}.openResult`}
                              render={({ field: inputField }: { field: any }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="123-4"
                                      {...inputField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`results.${index}.closeResult`}
                              render={({ field: inputField }: { field: any }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="123-4"
                                      {...inputField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Bulk calculations preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Bulk Calculations Preview</h4>
              <div className="text-sm text-muted-foreground">
                Auto-calculations (Jodi, Panel) will be applied to all entries when saved.
              </div>
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
                {isLoading ? 'Saving...' : `Save ${fields.length} Result${fields.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}