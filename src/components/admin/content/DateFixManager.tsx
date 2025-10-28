"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MarketItem {
  id: string
  name: string
  displayName: string
  sortOrder: number
  resultTime?: string | null
  title: string
  content: string
  saving?: boolean
  saved?: boolean
  error?: string | null
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export function DateFixManager() {
  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // SEO state
  const [seoTitle, setSeoTitle] = useState<string>("")
  const [seoDescription, setSeoDescription] = useState<string>("")
  const [seoKeywords, setSeoKeywords] = useState<string>("")
  const [seoSchema, setSeoSchema] = useState<string>("")
  const [seoSaving, setSeoSaving] = useState<boolean>(false)
  const [seoSaved, setSeoSaved] = useState<boolean>(false)
  const [seoError, setSeoError] = useState<string | null>(null)

  const dateFixKey = (slug: string) => `DATE_FIX_${slug}`

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setLoadError(null)
      try {
        const resMk = await fetch("/api/admin/markets", { cache: "no-store" })
        const dataMk = await resMk.json()
        if (!resMk.ok) throw new Error(dataMk?.error || "Failed to fetch markets")
        const mkts: any[] = Array.isArray(dataMk?.markets) ? dataMk.markets : []
        const active = mkts.filter((m) => m.isActive)
        active.sort((a, b) => {
          const at = a.resultTime ? new Date(a.resultTime).getTime() : 0
          const bt = b.resultTime ? new Date(b.resultTime).getTime() : 0
          return at - bt
        })

        const resCb = await fetch("/api/admin/content-blocks?sectionType=USER_CONTENT", { cache: "no-store" })
        const dataCb = await resCb.json()
        if (!resCb.ok) throw new Error(dataCb?.error || "Failed to fetch content blocks")
        const blocks: any[] = Array.isArray(dataCb?.contentBlocks) ? dataCb.contentBlocks : []
        const cbMap = new Map<string, { title?: string | null; content?: string | null }>()
        blocks.forEach((b) => {
          if (typeof b.key === "string" && b.key.startsWith("DATE_FIX_")) {
            cbMap.set(b.key, { title: b.title, content: b.content })
          }
        })

        const list: MarketItem[] = active.map((m, i) => {
          const k = dateFixKey(slugify(m.name))
          const existing = cbMap.get(k)
          return {
            id: m.id,
            name: m.name,
            displayName: m.displayName || m.name,
            sortOrder: typeof m.sortOrder === "number" ? m.sortOrder : i,
            resultTime: m.resultTime || null,
            title: existing?.title || `${m.displayName || m.name} Date Fix`,
            content: existing?.content || "",
          }
        })

        if (!cancelled) setMarkets(list)

        // Load SEO blocks
        const seoMap: Record<string, string> = {}
        blocks.forEach((b) => {
          if (typeof b?.key === "string" && b.key.startsWith("SEO_DATE_FIX_")) {
            seoMap[b.key] = b.content || ""
          }
        })
        if (!cancelled) {
          setSeoTitle(seoMap['SEO_DATE_FIX_TITLE'] || '')
          setSeoDescription(seoMap['SEO_DATE_FIX_DESCRIPTION'] || '')
          setSeoKeywords(seoMap['SEO_DATE_FIX_KEYWORDS'] || '')
          setSeoSchema(seoMap['SEO_DATE_FIX_SCHEMA'] || '')
        }
      } catch (err: any) {
        console.error(err)
        if (!cancelled) setLoadError(err?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  async function saveMarket(idx: number) {
    setMarkets((prev) => prev.map((m, i) => i === idx ? { ...m, saving: true, saved: false, error: null } : m))
    const m = markets[idx]
    try {
      const res = await fetch("/api/admin/content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: "USER_CONTENT",
          key: dateFixKey(slugify(m.name)),
          title: m.title,
          content: m.content,
          type: "TEXT",
          sortOrder: m.sortOrder ?? 0,
          isActive: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to save")
      setMarkets((prev) => prev.map((p, i) => i === idx ? { ...p, saving: false, saved: true } : p))
    } catch (err: any) {
      setMarkets((prev) => prev.map((p, i) => i === idx ? { ...p, saving: false, saved: false, error: err?.message || "Failed to save" } : p))
    }
  }

  async function saveAll() {
    for (let i = 0; i < markets.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await saveMarket(i)
    }
  }

  async function saveSeo() {
    setSeoSaving(true)
    setSeoSaved(false)
    setSeoError(null)
    try {
      const payloads = [
        { key: 'SEO_DATE_FIX_TITLE', content: seoTitle },
        { key: 'SEO_DATE_FIX_DESCRIPTION', content: seoDescription },
        { key: 'SEO_DATE_FIX_KEYWORDS', content: seoKeywords },
        { key: 'SEO_DATE_FIX_SCHEMA', content: seoSchema },
      ]
      for (const p of payloads) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch('/api/admin/content-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionType: 'USER_CONTENT',
            key: p.key,
            title: p.key.replace('SEO_DATE_FIX_', '').replace('_', ' '),
            content: p.content,
            type: p.key.endsWith('_SCHEMA') ? 'JSON' : 'TEXT',
            sortOrder: 999,
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
          <h2 className="text-2xl font-semibold">Date Fix Content</h2>
          <p className="text-muted-foreground">Manage per-market Date Fix blocks under the User Content section using keys DATE_FIX_&lt;market-slug&gt;</p>
        </div>
        <Button onClick={saveAll} disabled={loading || markets.some((m) => m.saving)}>
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
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Date Fix - Satta Matka" />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Daily date fix numbers..." />
            </div>
            <div>
              <label className="block text-sm font-medium">Keywords</label>
              <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="satta, satta matka, date fix" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Schema (JSON)</label>
              <textarea
                className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 p-2 min-h-[160px] font-mono"
                value={seoSchema}
                onChange={(e) => setSeoSchema(e.target.value)}
                placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"Date Fix"}'
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
        {markets.map((m, idx) => (
          <Card key={m.id} className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">{m.title || `${m.displayName} Date Fix`}</CardTitle>
              <CardDescription className="text-center">{dateFixKey(slugify(m.name))}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Title</label>
                <Input
                  value={m.title}
                  onChange={(e) => setMarkets((prev) => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))}
                  placeholder={`${m.displayName} Date Fix`}
                />
                <label className="block text-sm font-medium">4-digit Number</label>
                <Input
                  value={m.content}
                  onChange={(e) => setMarkets((prev) => prev.map((p, i) => i === idx ? { ...p, content: e.target.value } : p))}
                  placeholder={`Enter 4-digit fix number for ${m.displayName}`}
                />
                <div className="flex items-center gap-3">
                  <Button onClick={() => saveMarket(idx)} disabled={!!m.saving}>
                    {m.saving ? "Saving..." : (m.saved ? "Saved" : "Save")}
                  </Button>
                  {m.error && <span className="text-red-500 text-xs">{m.error}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}