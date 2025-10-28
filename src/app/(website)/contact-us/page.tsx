'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function ContactUsPage() {
  const [blocks, setBlocks] = useState<Array<{ id: string; type: string; key: string; title?: string | null; content: string; metadata?: any }>>([])
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
        const allBlocks: Array<{ id: string; type: string; key: string; title?: string | null; content: string; metadata?: any }> = json?.section?.contentBlocks || []
        const contactBlocks = allBlocks.filter((b) => String(b.key).toUpperCase().startsWith('CONTACT_US'))
        if (active) setBlocks(contactBlocks)
      } catch (e: any) {
        console.error('Contact load error:', e)
        if (active) setError(e?.message || 'Failed to load contact information')
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
            <Users className="h-5 w-5 text-green-400" />
            Contact Us
          </CardTitle>
          <CardDescription className="text-slate-300">Get in touch with our team</CardDescription>
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
                    {/* If metadata contains links or email, render them neatly */}
                    {block.metadata && typeof block.metadata === 'object' ? (
                      <div className="mt-2 text-slate-400 space-y-1">
                        {block.metadata.email && (
                          <p>Email: <a className="text-cyan-300 underline" href={`mailto:${block.metadata.email}`}>{block.metadata.email}</a></p>
                        )}
                        {block.metadata.phone && (
                          <p>Phone: <a className="text-cyan-300 underline" href={`tel:${block.metadata.phone}`}>{block.metadata.phone}</a></p>
                        )}
                        {block.metadata.url && (
                          <p>Website: <a className="text-cyan-300 underline" href={block.metadata.url} target="_blank" rel="noopener noreferrer">{block.metadata.url}</a></p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-slate-300 text-sm">
                  Admin can add contact info under USER_CONTENT section with keys starting with CONTACT_US. Optional metadata can include {`{ email, phone, url }`}.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}