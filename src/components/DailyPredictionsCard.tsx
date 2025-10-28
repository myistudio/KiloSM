"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DailyPredictionsCard() {
  const [predSettings, setPredSettings] = useState<any>(null)
  const [predictions, setPredictions] = useState<{ jodi: string | null; panel: string | null; source?: string }>({ jodi: null, panel: null })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [settingsRes, predsRes] = await Promise.all([
          fetch('/api/sections/DAILY_PREDICTIONS', { cache: 'no-store' }).catch(() => null),
          fetch('/api/predictions/daily', { cache: 'no-store' }).catch(() => null),
        ])
        if (settingsRes && settingsRes.ok) {
          const json = await settingsRes.json()
          if (active) setPredSettings(json?.section?.settings || null)
        }
        if (predsRes && predsRes.ok) {
          const predsJson = await predsRes.json()
          if (active) setPredictions({ jodi: predsJson?.jodi ?? null, panel: predsJson?.panel ?? null, source: predsJson?.source })
        }
      } catch (e) {
        // silent fail; fallback styles will apply
      }
    }
    load()
    return () => { active = false }
  }, [])

  const jodi = predictions.jodi || null
  const panel = predictions.panel || null

  return (
    <Card className="bg-slate-800/50" style={{ backgroundColor: predSettings?.backgroundColor || undefined }}>
      <CardHeader className="p-0">
        <div className="w-full py-3 rounded-t-xl" style={{ backgroundColor: predSettings?.headerBgColor || 'rgba(109, 40, 217, 0.2)' }}>
          <CardTitle className="text-center" style={{ color: predSettings?.headingColor || '#c084fc' }}>Daily Predictions</CardTitle>
        </div>
        <CardDescription className="text-center mt-2" style={{ color: predSettings?.textColor || undefined }}>
          Based on planetary positions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <div className="font-medium text-purple-400">Jodi: {jodi ?? '--'}</div>
            <div className="text-sm text-slate-300">{jodi ? 'High probability today' : 'No prediction available yet'}</div>
          </div>
          <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <div className="font-medium text-purple-400">Panel: {panel ?? '--'}</div>
            <div className="text-sm text-slate-300">{panel ? 'High probability today' : 'No prediction available yet'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}