"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NoticeBoardCard() {
  const [blocks, setBlocks] = useState<Array<{ title?: string; message: string; type: 'warning' | 'info' }>>([])
  const [error, setError] = useState<string>('')
  const [nbSettings, setNbSettings] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        const res = await fetch('/api/sections/NOTICE_BOARD', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load notice board (${res.status})`)
        const json = await res.json()
        const section = json?.section
        const items = (section?.contentBlocks ?? []).map((b: any) => ({
          title: b.title,
          message: b.content,
          type: (b.metadata?.type ?? 'info') as 'warning' | 'info',
        }))
        setBlocks(items)
        setNbSettings(section?.settings || null)
      } catch (e: any) {
        console.error('Error loading notice board:', e)
        setError(e?.message || 'Failed to load notice board')
      }
    }
    load()
  }, [])

  return (
    <Card className="bg-slate-800/50" style={{ backgroundColor: nbSettings?.backgroundColor || undefined }}>
      <CardHeader className="p-0">
        <div className="w-full py-3 rounded-t-xl" style={{ backgroundColor: nbSettings?.headerBgColor || 'rgba(234, 179, 8, 0.2)' }}>
          <CardTitle className="text-center" style={{ color: nbSettings?.headingColor || '#facc15' }}>Notice Board</CardTitle>
        </div>
        <CardDescription className="text-center mt-2" style={{ color: nbSettings?.textColor || undefined }}>
          Important announcements and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 text-sm text-red-400">{error}</div>
        )}
        <div className="space-y-3">
          {blocks.length === 0 && (
            <div className="text-sm text-slate-300">No notices available.</div>
          )}
          {blocks.map((notice, index) => (
            <div key={index} className="p-3 bg-slate-700/50 rounded-lg border-l-4 border-yellow-400">
              <div className="font-medium text-yellow-400">{notice.title || 'Notice'}</div>
              <div className="text-sm text-slate-300 mt-1">{notice.message}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}