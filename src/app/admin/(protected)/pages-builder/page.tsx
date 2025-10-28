'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SECTION_REGISTRY, SectionKey } from '@/components/sections/registry'
import { PlusCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface CanvasItem {
  key: SectionKey
  id: string
  enabled: boolean
}

interface PageSummary {
  id: string
  slug: string
  title: string
  description?: string | null
  isEnabled: boolean
}

export default function PagesBuilderPage() {
  const [pageTitle, setPageTitle] = useState('New Page')
  const [slug, setSlug] = useState('new-page')
  const [canvas, setCanvas] = useState<CanvasItem[]>([])
  const [pageId, setPageId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [pages, setPages] = useState<PageSummary[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  // SEO state
  const [seoMetaTitle, setSeoMetaTitle] = useState<string>('')
  const [seoMetaDescription, setSeoMetaDescription] = useState<string>('')
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState<string>('')
  const [seoOgImageUrl, setSeoOgImageUrl] = useState<string>('')
  const [seoTwitterCard, setSeoTwitterCard] = useState<string>('summary')
  const [seoRobotsNoIndex, setSeoRobotsNoIndex] = useState<boolean>(false)
  const [seoRobotsNoFollow, setSeoRobotsNoFollow] = useState<boolean>(false)
  const [seoH1, setSeoH1] = useState<string>('')
  const [seoSchemaRaw, setSeoSchemaRaw] = useState<string>('')

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoadingPages(true)
        const res = await fetch('/api/admin/pages', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) setPages(data.pages || [])
      } finally {
        setLoadingPages(false)
      }
    }
    loadPages()
  }, [])

  const addSectionToCanvas = (key: SectionKey) => {
    setCanvas((prev) => [...prev, { key, id: `${key}-${prev.length + 1}`, enabled: true }])
  }

  const removeItem = (id: string) => {
    setCanvas((prev) => prev.filter((i) => i.id !== id))
  }

  const selectPage = async (id: string) => {
    try {
      const page = pages.find(p => p.id === id)
      setPageId(id)
      if (page) {
        setPageTitle(page.title)
        setSlug(page.slug)
      }
      const res = await fetch(`/api/admin/pages/${id}/layout`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load layout')
      const items = Array.isArray(data?.items) ? data.items : []
      setCanvas(items.map((it: any, idx: number) => ({ key: it.key as SectionKey, id: `${it.key}-${idx + 1}`, enabled: it?.isEnabled ?? true })))
      // Load SEO
      const resSeo = await fetch(`/api/admin/pages/${id}/seo`)
      const dataSeo = await resSeo.json()
      if (resSeo.ok && dataSeo?.seo) {
        setSeoMetaTitle(dataSeo.seo.metaTitle || '')
        setSeoMetaDescription(dataSeo.seo.metaDescription || '')
        setSeoCanonicalUrl(dataSeo.seo.canonicalUrl || '')
        setSeoOgImageUrl(dataSeo.seo.ogImageUrl || '')
        setSeoTwitterCard(dataSeo.seo.twitterCard || 'summary')
        setSeoRobotsNoIndex(!!dataSeo.seo.robotsNoIndex)
        setSeoRobotsNoFollow(!!dataSeo.seo.robotsNoFollow)
        setSeoH1(dataSeo.seo.h1 || '')
        setSeoSchemaRaw(dataSeo.seo.seoSchema ? JSON.stringify(dataSeo.seo.seoSchema, null, 2) : '')
      }
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Load layout failed')
    }
  }

  const saveDraft = async () => {
    try {
      setSaving(true)
      // Create page if needed
      let pid = pageId
      if (!pid) {
        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: pageTitle, slug }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to create page')
        pid = data?.page?.id
        setPageId(pid)
      }
      // Persist layout
      const items = canvas.map((c, idx) => ({ key: c.key, sortOrder: idx, isEnabled: c.enabled }))
      const res2 = await fetch(`/api/admin/pages/${pid}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data2 = await res2.json()
      if (!res2.ok) throw new Error(data2?.error || 'Failed to save layout')
      // Persist SEO
      let seoSchema: any = null
      if (seoSchemaRaw.trim()) {
        try {
          seoSchema = JSON.parse(seoSchemaRaw)
        } catch (err) {
          throw new Error('SEO Schema JSON is invalid')
        }
      }
      const resSeo = await fetch(`/api/admin/pages/${pid}/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaTitle: seoMetaTitle || pageTitle,
          metaDescription: seoMetaDescription || undefined,
          canonicalUrl: seoCanonicalUrl || undefined,
          ogImageUrl: seoOgImageUrl || undefined,
          twitterCard: seoTwitterCard || undefined,
          robotsNoIndex: seoRobotsNoIndex,
          robotsNoFollow: seoRobotsNoFollow,
          h1: seoH1 || pageTitle,
          seoSchema,
        }),
      })
      const dataSeo = await resSeo.json()
      if (!resSeo.ok) throw new Error(dataSeo?.error || 'Failed to save SEO')
      alert('Draft saved')
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const publishPage = async () => {
    try {
      setPublishing(true)
      let pid = pageId
      if (!pid) {
        await saveDraft()
        pid = pageId
      }
      if (!pid) throw new Error('Page not created')
      const res = await fetch(`/api/admin/pages/${pid}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to publish page')
      alert('Page published')
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const moveItemUp = (id: string) => {
    setCanvas(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveItemDown = (id: string) => {
    setCanvas(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const toggleItemEnabled = (id: string) => {
    setCanvas(prev => prev.map(i => (i.id === id ? { ...i, enabled: !i.enabled } : i)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pages Builder</h1>
          <p className="text-muted-foreground">Visually assemble and configure modular sections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={saving || publishing}>
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button onClick={publishPage} disabled={publishing || saving}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Page Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Page Basics</CardTitle>
          <CardDescription>Define title and URL slug for this page</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Existing Pages</label>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded border px-2 py-1 text-sm"
                onChange={(e) => selectPage(e.target.value)}
                defaultValue=""
                disabled={loadingPages}
              >
                <option value="">Select a page</option>
                {pages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.slug})
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => { setPageId(null); setPageTitle('New Page'); setSlug('new-page'); setCanvas([]) }}>New</Button>
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Title</label>
            <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>Meta tags and structured data for search engines</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Meta Title</label>
            <Input value={seoMetaTitle} onChange={(e) => setSeoMetaTitle(e.target.value)} placeholder="Defaults to Page Title" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Meta Description</label>
            <Input value={seoMetaDescription} onChange={(e) => setSeoMetaDescription(e.target.value)} placeholder="Concise summary" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Canonical URL</label>
            <Input value={seoCanonicalUrl} onChange={(e) => setSeoCanonicalUrl(e.target.value)} placeholder="https://example.com/page" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">OG Image URL</label>
            <Input value={seoOgImageUrl} onChange={(e) => setSeoOgImageUrl(e.target.value)} placeholder="https://example.com/og.jpg" />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Twitter Card</label>
            <select className="w-full rounded border px-2 py-2 text-sm" value={seoTwitterCard} onChange={(e) => setSeoTwitterCard(e.target.value)}>
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
            </select>
          </div>
          <div className="sm:col-span-1 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seoRobotsNoIndex} onChange={(e) => setSeoRobotsNoIndex(e.target.checked)} />
              robots: noindex
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seoRobotsNoFollow} onChange={(e) => setSeoRobotsNoFollow(e.target.checked)} />
              robots: nofollow
            </label>
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">H1 Override</label>
            <Input value={seoH1} onChange={(e) => setSeoH1(e.target.value)} placeholder="Defaults to Page Title" />
          </div>
          <div className="sm:col-span-3">
            <label className="text-sm font-medium">JSON-LD Schema</label>
            <textarea
              className="w-full rounded border px-2 py-2 text-sm h-40 font-mono"
              value={seoSchemaRaw}
              onChange={(e) => setSeoSchemaRaw(e.target.value)}
              placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"Title"}'
            />
            <div className="text-xs text-muted-foreground mt-1">Paste valid JSON for structured data.</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Palette */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Add modules to the canvas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SECTION_REGISTRY.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => addSectionToCanvas(s.key)}>
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Canvas</CardTitle>
            <CardDescription>Arrange and configure sections</CardDescription>
          </CardHeader>
          <CardContent>
            {canvas.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sections yet. Use the palette to add modules.</div>
            ) : (
              <div className="space-y-3">
                {canvas.map((item, idx) => {
                  const meta = SECTION_REGISTRY.find((s) => s.key === item.key)
                  return (
                    <div key={item.id} className="rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{meta?.name} <span className="text-xs text-muted-foreground">#{idx + 1}</span></div>
                        <div className="flex items-center gap-1">
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" checked={item.enabled} onChange={() => toggleItemEnabled(item.id)} />
                            Enabled
                          </label>
                          <Button variant="ghost" size="sm" onClick={() => moveItemUp(item.id)} title="Move up">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveItemDown(item.id)} title="Move down">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} title="Remove">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{meta?.description}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}