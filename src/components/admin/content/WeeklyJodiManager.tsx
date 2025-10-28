"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface JodiItem {
  key: string
  title: string
  content: string
  sortOrder: number
  saving?: boolean
  saved?: boolean
  error?: string | null
}

export function WeeklyJodiManager() {
  const keys = useMemo(() => Array.from({ length: 12 }, (_, i) => `WEEKLY_JODI_${i + 1}`), [])
  const [items, setItems] = useState<JodiItem[]>(keys.map((k, i) => ({ key: k, title: `Weekly Jodi ${i + 1}`, content: "", sortOrder: i })))
  const [loading, setLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // SEO state
  const [seoTitle, setSeoTitle] = useState<string>("")
  const [seoDescription, setSeoDescription] = useState<string>("")
  const [seoKeywords, setSeoKeywords] = useState<string>("") // comma-separated or JSON array
  const [seoSchema, setSeoSchema] = useState<string>("") // JSON string
  const [seoSaving, setSeoSaving] = useState<boolean>(false)
  const [seoSaved, setSeoSaved] = useState<boolean>(false)
  const [seoError, setSeoError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchBlocks() {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch("/api/admin/content-blocks?sectionType=USER_CONTENT", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to fetch content blocks")
        const blocks: any[] = Array.isArray(data?.contentBlocks) ? data.contentBlocks : []
        const map = new Map<string, { title?: string | null; content?: string | null; sortOrder?: number }>()
        blocks.forEach((b) => {
          if (keys.includes(b.key)) {
            map.set(b.key, { title: b.title, content: b.content, sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : 0 })
          }
        })
        if (!cancelled) {
          setItems((prev) => prev.map((it, i) => {
            const existing = map.get(it.key)
            return {
              ...it,
              title: existing?.title ?? it.title,
              content: existing?.content ?? it.content,
              sortOrder: existing?.sortOrder ?? i,
              saved: false,
              error: null,
            }
          }))
        }
        // Load SEO blocks
        const seoMap: Record<string, string> = {}
        blocks.forEach((b) => {
          if (typeof b?.key === "string" && b.key.startsWith("SEO_WEEKLY_JODI_")) {
            seoMap[b.key] = b.content || ""
          }
        })
        if (!cancelled) {
          setSeoTitle(seoMap['SEO_WEEKLY_JODI_TITLE'] || '')
          setSeoDescription(seoMap['SEO_WEEKLY_JODI_DESCRIPTION'] || '')
          setSeoKeywords(seoMap['SEO_WEEKLY_JODI_KEYWORDS'] || '')
          setSeoSchema(seoMap['SEO_WEEKLY_JODI_SCHEMA'] || '')
        }
      } catch (err: any) {
        console.error(err)
        if (!cancelled) setLoadError(err?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchBlocks()
    return () => { cancelled = true }
  }, [keys])

  async function saveItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, saving: true, saved: false, error: null } : it))
    const it = items[idx]
    try {
      const res = await fetch("/api/admin/content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: "USER_CONTENT",
          key: it.key,
          title: it.title,
          content: it.content,
          type: "TEXT",
          sortOrder: it.sortOrder,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save")
      setItems((prev) => prev.map((p, i) => i === idx ? { ...p, saving: false, saved: true } : p))
    } catch (err: any) {
      setItems((prev) => prev.map((p, i) => i === idx ? { ...p, saving: false, saved: false, error: err?.message || "Failed to save" } : p))
    }
  }

  async function saveAll() {
    for (let i = 0; i < items.length; i++) {
      // Sequential saves
      // eslint-disable-next-line no-await-in-loop
      await saveItem(i)
    }
  }

  async function saveSeo() {
    setSeoSaving(true)
    setSeoSaved(false)
    setSeoError(null)
    try {
      const payloads = [
        { key: 'SEO_WEEKLY_JODI_TITLE', content: seoTitle },
        { key: 'SEO_WEEKLY_JODI_DESCRIPTION', content: seoDescription },
        { key: 'SEO_WEEKLY_JODI_KEYWORDS', content: seoKeywords },
        { key: 'SEO_WEEKLY_JODI_SCHEMA', content: seoSchema },
      ]
      for (const p of payloads) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch('/api/admin/content-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionType: 'USER_CONTENT',
            key: p.key,
            title: p.key.replace('SEO_WEEKLY_JODI_', '').replace('_', ' '),
            content: p.content,
            type: p.key.endsWith('_SCHEMA') ? 'JSON' : 'TEXT',
            sortOrder: 999, // push to end
            isActive: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `Failed to save ${p.key}`)
      }
      setSeoSaved(true)
    } catch (err: any) {
      setSeoError(err?.message || 'Failed to save SEO settings')
    } finally {
      setSeoSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Weekly Jodi Content</h2>
          <p className="text-muted-foreground">Manage 12 blocks under the User Content section using keys WEEKLY_JODI_1..12</p>
        </div>
        <Button onClick={saveAll} disabled={loading || items.some((i) => i.saving)}>
          Save All
        </Button>
      </div>

      {loadError && (
        <div className="text-red-500 text-sm">{loadError}</div>
      )}

      {/* SEO Settings */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">SEO Settings</CardTitle>
          <CardDescription>Title, description, keywords (comma-separated or JSON array), and schema JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Weekly Jodi - Satta Matka" />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Weekly jodi entries..." />
            </div>
            <div>
              <label className="block text-sm font-medium">Keywords</label>
              <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="satta, satta matka, weekly jodi" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Schema (JSON)</label>
              <textarea
                className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 p-2 min-h-[160px] font-mono"
                value={seoSchema}
                onChange={(e) => setSeoSchema(e.target.value)}
                placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"Weekly Jodi"}'
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={saveSeo} disabled={seoSaving}>{seoSaving ? 'Saving...' : (seoSaved ? 'Saved' : 'Save SEO')}</Button>
            {seoError && <span className="text-red-500 text-xs">{seoError}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <Card key={item.key} className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">{item.title || item.key.replace("WEEKLY_JODI_", "Weekly Jodi ")}</CardTitle>
              <CardDescription className="text-center">{item.key}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Title</label>
                <Input
                  value={item.title}
                  onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))}
                  placeholder={`Weekly Jodi ${idx + 1}`}
                />
                <label className="block text-sm font-medium">Content</label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 p-2 min-h-[120px]"
                  value={item.content}
                  onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, content: e.target.value } : p))}
                  placeholder={`Enter content for ${item.key}`}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={() => saveItem(idx)} disabled={!!item.saving}>
                    {item.saving ? "Saving..." : (item.saved ? "Saved" : "Save")}
                  </Button>
                  {item.error && <span className="text-red-500 text-xs">{item.error}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}