'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  const [blocks, setBlocks] = useState<Array<{ id: string; type: string; key: string; title?: string | null; content: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/sections/USER_CONTENT', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load content (${res.status})`)
        const json = await res.json()
        const allBlocks: Array<{ id: string; type: string; key: string; title?: string | null; content: string }> = json?.section?.contentBlocks || []
        const termsBlocks = allBlocks.filter((b) => String(b.key).toUpperCase().startsWith('TERMS_AND_CONDITIONS'))
        if (active) setBlocks(termsBlocks)
      } catch (e: any) {
        console.error('Terms load error:', e)
        if (active) setError(e?.message || 'Failed to load terms & conditions')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const sanitizePlusPrefix = (raw: string) => raw.replace(/^\s*\+\s*/, '')

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6">
      <Card className="bg-slate-900/60 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-amber-400" />
            Terms & Conditions
          </CardTitle>
          <CardDescription className="text-slate-300">Website usage terms</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-slate-300">Loading...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && !error && (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4">
              {blocks.length ? (
                blocks.map((block) => (
                  <div key={block.id}>
                    {block.title ? <h3 className="text-white text-base font-semibold mb-1">{block.title}</h3> : null}
                    {block.type === 'HTML' ? (
                      <div dangerouslySetInnerHTML={{ __html: sanitizePlusPrefix(block.content) }} />
                    ) : (
                      <p className="text-slate-300">{sanitizePlusPrefix(block.content)}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-300 text-sm">
                  Admin can add terms content under USER_CONTENT section with keys starting with TERMS_AND_CONDITIONS.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}