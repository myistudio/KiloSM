'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Define Section type to align with API
interface Section {
  id: string
  type: string
  name: string
  title: string
  isEnabled: boolean
  sortOrder: number
  settings?: { headingColor?: string; textColor?: string; backgroundColor?: string; headerBgColor?: string }
}

export function SectionManager() {
  // Initialize with empty list and load from API
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [countsBySection, setCountsBySection] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [secRes, blocksRes] = await Promise.all([
          fetch('/api/admin/sections'),
          fetch('/api/admin/content-blocks'),
        ])
        const secJson = await secRes.json()
        const blkJson = await blocksRes.json()
        const fetchedSections: Section[] = secJson.sections || []
        const blocks: Array<{ id: string; sectionId: string }> = blkJson.contentBlocks || []

        // Build counts by sectionId
        const counts: Record<string, number> = {}
        for (const b of blocks) {
          counts[b.sectionId] = (counts[b.sectionId] || 0) + 1
        }

        setSections(fetchedSections)
        setCountsBySection(counts)
      } catch (e) {
        console.error('Failed to load sections/content blocks', e)
      }
    }
    load()
  }, [])

  const handleToggleSection = (id: string) => {
    setSections((prev) => prev.map((section) =>
      section.id === id ? { ...section, isEnabled: !section.isEnabled } : section
    ))
  }

  const handleSortOrderChange = (id: string, value: string) => {
    const num = Number(value)
    setSections((prev) => prev.map((section) =>
      section.id === id ? { ...section, sortOrder: Number.isFinite(num) ? num : section.sortOrder } : section
    ))
  }

  const toggleAdvanced = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      const updates = sections.map((s) => ({ id: s.id, isEnabled: s.isEnabled, sortOrder: s.sortOrder, settings: s.settings || {}, title: s.title, name: s.name }))
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Update failed (${res.status})`)
      }
      const json = await res.json()
      const nextSections: Section[] = json.sections || []
      setSections(nextSections)
    } catch (e) {
      console.error('Error saving section changes:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSections = sections.filter(s => s.isEnabled).length
  const totalSections = sections.length
  const uniqueTypes = Array.from(new Set(sections.map(s => s.type)))
  const filteredBySearch = sections.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase())
  )
  const visibleSections = filteredBySearch.filter(s => !typeFilter || s.type === typeFilter)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeSections}</div>
          <div className="text-sm text-muted-foreground">Active Sections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{totalSections - activeSections}</div>
          <div className="text-sm text-muted-foreground">Disabled Sections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalSections ? Math.round((activeSections / totalSections) * 100) : 0}%</div>
          <div className="text-sm text-muted-foreground">Active Rate</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections by title, name, or type" className="max-w-md" />
        <Select value={typeFilter || '__ALL__'} onValueChange={(v) => setTypeFilter(v === '__ALL__' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">All Types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <Card key={section.id} className={`transition-colors ${!section.isEnabled ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{section.title}</h3>
                    <Badge variant="outline" className="uppercase">{section.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={section.isEnabled}
                    onCheckedChange={() => handleToggleSection(section.id)}
                  />
                  {/* visibility icons removed */}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Section Title:</span>
                    <Input
                      type="text"
                      value={section.title}
                      placeholder="Enter section title"
                      onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, title: e.target.value } : s))}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subheading (Description):</span>
                    <Input
                      type="text"
                      value={section.name}
                      placeholder="Enter section subheading"
                      onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, name: e.target.value } : s))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Display Order:</span>
                  <Select
                    value={section.sortOrder.toString()}
                    onValueChange={(value) => handleSortOrderChange(section.id, value)}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.max(totalSections, 1) }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Styles */}
                <div className="space-y-2">
                  <Button size="sm" variant="outline" onClick={() => toggleAdvanced(section.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {expanded[section.id] ? 'Hide Advanced Styles' : 'Show Advanced Styles'}
                  </Button>
                  {expanded[section.id] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Heading Color:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Input type="color" value={section.settings?.headingColor || '#ffffff'} onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, settings: { ...s.settings, headingColor: e.target.value } } : s))} className="w-10 h-10 p-1" />
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Text Color:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Input type="color" value={section.settings?.textColor || '#cbd5e1'} onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, settings: { ...s.settings, textColor: e.target.value } } : s))} className="w-10 h-10 p-1" />
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Header Background:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Input type="color" value={section.settings?.headerBgColor || '#0ea5e9'} onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, settings: { ...s.settings, headerBgColor: e.target.value } } : s))} className="w-10 h-10 p-1" />
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Card Background:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Input type="color" value={section.settings?.backgroundColor || '#1f2937'} onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, settings: { ...s.settings, backgroundColor: e.target.value } } : s))} className="w-10 h-10 p-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Blocks:</span>
                  <Badge variant="outline">{countsBySection[section.id] ?? 0}</Badge>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/admin/content?sectionId=${section.id}`} prefetch={false}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Content
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" variant="default" asChild>
                    <Link href={`/admin/content/${section.type.toLowerCase().replace(/_/g, '-') }?sectionId=${section.id}`} prefetch={false}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Module
                    </Link>
                  </Button>
                 {/* Reorder control removed to simplify UI */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Changes Button */}
      <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur border-t flex justify-center py-3 mt-6">
        <Button onClick={handleSaveChanges} disabled={isLoading || !sections.length} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving Changes...' : 'Save Section Changes'}
        </Button>
      </div>
    </div>
  )
}