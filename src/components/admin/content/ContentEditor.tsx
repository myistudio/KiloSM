'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { useSearchParams } from 'next/navigation'

const contentBlockSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'HTML', 'JSON', 'LINK']),
  isActive: z.boolean(),
  sectionId: z.string().min(1, 'Section is required'),
})

type ContentBlockFormData = z.infer<typeof contentBlockSchema>

// Content block type definition
type ContentBlock = {
  id: string
  sectionId: string
  key: string
  title?: string | null
  content: string
  type: 'TEXT' | 'HTML' | 'JSON' | 'LINK'
  isActive: boolean
  sortOrder: number
}

// Section type definition
type Section = {
  id: string
  type: string
  name: string
  title: string
  isEnabled: boolean
  sortOrder: number
}

// Mock content blocks data
// const mockContentBlocks: ContentBlock[] = [
//   {
//     id: '1',
//     sectionId: '1',
//     sectionName: 'SEO Keywords',
//     key: 'main_keywords',
//     title: 'Main Keywords',
//     content: 'satta matka, kalyan matka, matka result, satta king, matka guessing',
//     type: 'TEXT',
//     isActive: true,
//     sortOrder: 1,
//   },
// ]

// Mock sections for selection
// const mockSections = [
//   { id: '1', name: 'SEO Keywords', title: 'SEO Keywords' },
// ]

export function ContentEditor() {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewBlock, setPreviewBlock] = useState<ContentBlock | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const form = useForm<ContentBlockFormData>({
    resolver: zodResolver(contentBlockSchema),
    defaultValues: {
      key: '',
      title: '',
      content: '',
      type: 'TEXT',
      isActive: true,
      sectionId: '',
    },
  })

  // Derive selectedType for helper UI
  const currentSectionId = form.watch('sectionId')
  const selectedSection = sections.find((s) => s.id === currentSectionId)
  const selectedType = selectedSection?.type

  useEffect(() => {
    // sensible defaults when creating new blocks by section type
    if (!editingBlock && selectedSection) {
      const t = String(selectedSection.type || '').toUpperCase()
      const curr = form.getValues('type')
      if (!curr) {
        if (t === 'FAQ' || t === 'QA_SECTION') form.setValue('type', 'JSON')
        else if (t === 'LINK_SECTION_1' || t === 'LINK_SECTION_2') form.setValue('type', 'LINK')
        else if (t === 'NOTICE_BOARD') form.setValue('type', 'HTML')
        else form.setValue('type', 'TEXT')
      }
    }
  }, [currentSectionId, editingBlock, selectedSection])

  // Small parsers for previews
  const parseParts = (s: string): string[] => String(s || '')
    .split(/[\,\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)

  const parseNumbers = (s: string): string[] => {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) return arr.map((x: any) => String(x))
    } catch {}
    return String(s || '')
      .split(/[\s,•\n]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x))
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [sectionsRes, blocksRes] = await Promise.all([
          fetch('/api/admin/sections'),
          fetch('/api/admin/content-blocks'),
        ])
        const sectionsJson = await sectionsRes.json()
        const blocksJson = await blocksRes.json()
        setSections(sectionsJson.sections || [])
        setContentBlocks(blocksJson.contentBlocks || [])
        setLoadError('')
      } catch (error) {
        console.error('Failed to load content data:', error)
        setLoadError('Failed to load sections or content blocks. Please refresh or try again later.')
      } finally {
        setIsLoadingData(false)
      }
    }
    loadData()
  }, [])

  const onSubmit = async (data: ContentBlockFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: data.sectionId,
          key: data.key,
          title: data.title ?? null,
          content: data.content,
          type: data.type,
          isActive: data.isActive,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Save failed (${res.status})`)
      }

      const json = await res.json()
      const saved = json.contentBlock

      setContentBlocks((blocks) => {
        const idx = blocks.findIndex((b) => b.id === saved.id)
        if (idx >= 0) {
          const next = [...blocks]
          next[idx] = saved
          return next
        }
        return [saved, ...blocks]
      })

      setEditingBlock(null)
      form.reset()
    } catch (error) {
      console.error('Error saving content block:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (block: ContentBlock) => {
    setEditingBlock(block.id)
    form.reset({
      key: block.key,
      title: block.title || '',
      content: block.content,
      type: block.type,
      isActive: block.isActive,
      sectionId: block.sectionId,
    })
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/content-blocks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Delete failed (${res.status})`)
      }
      setContentBlocks(blocks => blocks.filter(block => block.id !== id))
    } catch (error) {
      console.error('Error deleting content block:', error)
    }
  }

  // Add filter state and UI controls
  const [sectionFilter, setSectionFilter] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialId = searchParams.get('sectionId') || ''
    if (initialId) {
      setSectionFilter(initialId)
    }
  }, [searchParams])

  const filteredBlocks = (sectionFilter
    ? contentBlocks.filter((b) => b.sectionId === sectionFilter)
    : contentBlocks
  ).filter((b) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      (b.key || '').toLowerCase().includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.content || '').toLowerCase().includes(q)
    )
  })

  // Simplified: map section IDs to titles for display in list
  const sectionTitleById: Record<string, string> = Object.fromEntries(
    sections.map((s) => [s.id, s.title])
  )

  // Quick actions
  const quickToggleActive = async (block: ContentBlock) => {
    try {
      const res = await fetch('/api/admin/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: block.sectionId,
          key: block.key,
          title: block.title ?? null,
          content: block.content,
          type: block.type,
          isActive: !block.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Toggle failed (${res.status})`)
      }
      const json = await res.json()
      const saved: ContentBlock = json.contentBlock
      setContentBlocks((blocks) => blocks.map((b) => (b.id === saved.id ? saved : b)))
    } catch (e) {
      console.error('Failed to toggle active:', e)
    }
  }

  const duplicateBlock = async (block: ContentBlock) => {
    const newKey = `${block.key}-copy`
    const newTitle = block.title ? `${block.title} (Copy)` : undefined
    try {
      const res = await fetch('/api/admin/content-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: block.sectionId,
          key: newKey,
          title: newTitle ?? null,
          content: block.content,
          type: block.type,
          isActive: block.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Duplicate failed (${res.status})`)
      }
      const json = await res.json()
      const saved: ContentBlock = json.contentBlock
      setContentBlocks((blocks) => [saved, ...blocks])
    } catch (e) {
      console.error('Failed to duplicate block:', e)
    }
  }

  const formatJsonContent = () => {
    const current = form.getValues('content')
    try {
      const parsed = JSON.parse(current)
      form.setValue('content', JSON.stringify(parsed, null, 2), { shouldDirty: true })
    } catch (e) {
      console.warn('Invalid JSON, cannot format')
    }
  }

  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    const sectionTitle = sections.find((s) => s.id === block.sectionId)?.title || 'Unknown Section'
    if (!acc[sectionTitle]) {
      acc[sectionTitle] = []
    }
    acc[sectionTitle].push(block)
    return acc
  }, {} as Record<string, typeof contentBlocks>)

  const renderPreview = (block: ContentBlock) => {
    if (block.type === 'HTML') {
      return (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
      )
    }
    if (block.type === 'JSON') {
      try {
        const obj = JSON.parse(block.content)
        return (
          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">{JSON.stringify(obj, null, 2)}</pre>
        )
      } catch (e) {
        return (
          <pre className="bg-destructive/10 text-destructive p-3 rounded-md text-xs overflow-auto">Invalid JSON</pre>
        )
      }
    }
    if (block.type === 'LINK') {
      return (
        <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{block.content}</a>
      )
    }
    return (
      <div className="whitespace-pre-wrap break-words">{block.content}</div>
    )
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {/* Content Editor Form */}
      <Card>
        <CardHeader>
          <CardTitle>Content Block Editor</CardTitle>
          <CardDescription>
            Add or edit content blocks for different sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="text-sm text-muted-foreground">Loading sections and content...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Section */}
                  <FormField
                    control={form.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sections.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Key */}
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key (unique)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CHART_KALYAN_JODI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Content Type (always visible) */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TEXT">Text</SelectItem>
                            <SelectItem value="HTML">HTML</SelectItem>
                            <SelectItem value="JSON">JSON</SelectItem>
                            <SelectItem value="LINK">Link</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Advanced options toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Optional settings</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced((v) => !v)}>
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-md p-4 bg-muted/30">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Block title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormLabel>Active</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter content here..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      {/* Type-specific helpers */}
                      {form.watch('type') === 'JSON' && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={formatJsonContent}>Format JSON</Button>
                          {(String(selectedType || '').toUpperCase() === 'FAQ' || String(selectedType || '').toUpperCase() === 'QA_SECTION') && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                form.setValue('content', JSON.stringify({ q: '', a: '' }, null, 2), { shouldDirty: true })
                              }}
                            >
                              Insert Q/A JSON template
                            </Button>
                          )}
                        </div>
                      )}
                      {form.watch('type') === 'LINK' && !!form.watch('content') && (
                        <div className="mt-2 text-xs">
                          <a href={form.watch('content')} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">Open link</a>
                        </div>
                      )}
                      {/* Section-specific helpers */}
                      {String(selectedType || '').toUpperCase() === 'KEYWORD_SEO' && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">Separate keywords by comma or newline. Preview:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {parseParts(form.watch('content')).map((kw, i) => (
                              <Badge key={`${kw}-${i}`} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'ASTROLOGY_LUCK' && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">Enter numbers separated by commas or as a JSON array.</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {parseNumbers(form.watch('content')).map((n, i) => (
                              <Badge key={`${n}-${i}`} variant="secondary" className="text-xs">{n}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'NOTICE_BOARD' && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">For rich notices, set Content Type to HTML.</span>
                          {form.watch('type') !== 'HTML' && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => form.setValue('type', 'HTML')}>Use HTML</Button>
                          )}
                        </div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'INFO_MARQUEE' && (
                        <div className="mt-2 text-xs text-muted-foreground">Text will scroll on the frontend; keep it short. Separate multiple items with • (bullet) or commas.</div>
                      )}
                      
                      {(String(selectedType || '').toUpperCase() === 'LINK_SECTION_1' || String(selectedType || '').toUpperCase() === 'LINK_SECTION_2') && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Links are best with Content Type set to LINK.</span>
                          {form.watch('type') !== 'LINK' && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => form.setValue('type', 'LINK')}>Use LINK</Button>
                          )}
                        </div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'FAQ' && (
                        <div className="mt-2 text-xs text-muted-foreground">Use JSON blocks like {`{ "q": "Question", "a": "Answer" }`} or simple TEXT blocks for short Q&A.</div>
                      )}
                      {String(selectedType || '').toUpperCase() === 'QA_SECTION' && (
                        <div className="mt-2 text-xs text-muted-foreground">Use JSON blocks like {`{ "q": "Question", "a": "Answer" }`} or TEXT blocks for answers.</div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'MARKET_ARTICLES' && (
                        <div className="mt-2 text-xs text-muted-foreground">Keys should follow MK_NAME_* pattern (e.g., KALYAN_DESCRIPTION). Frontend maps keys per market detail page.</div>
                      )}
                      
                      {String(selectedType || '').toUpperCase() === 'USER_CONTENT' && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div>Suggested keys for homepage hero:</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">HOME_HERO_TITLE</Badge>
                            <Badge variant="secondary" className="text-xs">HOME_HERO_SUBTITLE</Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => form.setValue('key', 'HOME_HERO_TITLE', { shouldDirty: true })}
                            >
                              Use HOME_HERO_TITLE
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => form.setValue('key', 'HOME_HERO_SUBTITLE', { shouldDirty: true })}
                            >
                              Use HOME_HERO_SUBTITLE
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sticky save bar */}
                <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-3 flex gap-2 justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : (editingBlock ? 'Update Block' : 'Add Block')}
                  </Button>
                  {editingBlock && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingBlock(null)
                        form.reset()
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Content Blocks by Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{sections.length} sections</Badge>
          <Badge variant="outline">{contentBlocks.length} blocks</Badge>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v === '__ALL__' ? '' : v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">All Sections</SelectItem>
              {/* Render available sections */}
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks"
            className="w-full md:w-[280px]"
          />
          {sectionFilter && (
            <Button variant="ghost" onClick={() => setSectionFilter('')}>Clear</Button>
          )}
        </div>
      </div>

      {/* Simplified: Single list of blocks (no tabs) */}
      <Card>
        <CardHeader>
          <CardTitle>Content Blocks</CardTitle>
          <CardDescription>
            Manage content blocks{sectionFilter ? ` for ${sectionTitleById[sectionFilter] || 'Selected Section'}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBlocks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No content blocks found.</div>
          ) : (
            <div className="space-y-3">
              {filteredBlocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{block.title || block.key}</h4>
                      <Badge variant="outline">{block.type}</Badge>
                      <span className={`text-xs ${block.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>{block.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{sectionTitleById[block.sectionId] || 'Unknown Section'}</p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {block.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(block)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setPreviewBlock(block)}>Preview</Button>
                    <Button size="sm" variant="outline" onClick={() => quickToggleActive(block)}>{block.isActive ? 'Deactivate' : 'Activate'}</Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateBlock(block)}>Duplicate</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(block.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog remains unchanged */}
      {previewBlock && (
        <Dialog open={!!previewBlock} onOpenChange={(open) => { if (!open) setPreviewBlock(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{previewBlock.title || previewBlock.key}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline">{previewBlock.type}</Badge>
                {previewBlock.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              {renderPreview(previewBlock)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewBlock(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}