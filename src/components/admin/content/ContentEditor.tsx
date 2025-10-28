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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Edit, Plus, Trash2, Eye } from 'lucide-react'

const contentBlockSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['TEXT', 'HTML', 'JSON', 'LINK']),
  isActive: z.boolean().default(true),
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sectionsRes, blocksRes] = await Promise.all([
          fetch('/api/admin/sections'),
          fetch('/api/admin/content-blocks'),
        ])
        const sectionsJson = await sectionsRes.json()
        const blocksJson = await blocksRes.json()
        setSections(sectionsJson.sections || [])
        setContentBlocks(blocksJson.contentBlocks || [])
      } catch (error) {
        console.error('Failed to load content data:', error)
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

  const handleDelete = (id: string) => {
    setContentBlocks(blocks => blocks.filter(block => block.id !== id))
  }

  const groupedBlocks = contentBlocks.reduce((acc, block) => {
    const sectionTitle = sections.find((s) => s.id === block.sectionId)?.title || 'Unknown Section'
    if (!acc[sectionTitle]) {
      acc[sectionTitle] = []
    }
    acc[sectionTitle].push(block)
    return acc
  }, {} as Record<string, typeof contentBlocks>)

  return (
    <div className="space-y-6">
      {/* Content Editor Form */}
      <Card>
        <CardHeader>
          <CardTitle>Content Block Editor</CardTitle>
          <CardDescription>
            Add or edit content blocks for different sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key (unique)</FormLabel>
                      <FormControl>
                        <Input placeholder="Unique content key, e.g. CHART_KALYAN_JODI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter content here..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
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
        </CardContent>
      </Card>

      {/* Content Blocks by Section */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Blocks</TabsTrigger>
          <TabsTrigger value="SEO Keywords">SEO</TabsTrigger>
          <TabsTrigger value="FAQ">FAQ</TabsTrigger>
          <TabsTrigger value="Disclaimer">Disclaimer</TabsTrigger>
          <TabsTrigger value="Starline Games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedBlocks).map(([sectionName, blocks]) => (
            <Card key={sectionName}>
              <CardHeader>
                <CardTitle className="text-lg">{sectionName}</CardTitle>
                <CardDescription>{blocks.length} content blocks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{block.title || block.key}</h4>
                          <Badge variant="outline">{block.type}</Badge>
                          {block.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {block.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(block)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {Object.entries(groupedBlocks).map(([sectionName]) => (
          <TabsContent key={sectionName} value={sectionName} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{sectionName} Content Blocks</CardTitle>
                <CardDescription>
                  Manage content blocks for {sectionName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedBlocks[sectionName].map((block) => (
                    <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{block.title || block.key}</h4>
                          <Badge variant="outline">{block.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {block.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(block)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}