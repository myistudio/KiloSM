'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Save, RotateCcw } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-server'
import { Textarea } from '@/components/ui/textarea'

// Keys used in AppSetting
const KEYS = {
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  LIVE_PRE_WINDOW_MINUTES: 'LIVE_PRE_WINDOW_MINUTES',
  LIVE_POST_WINDOW_MINUTES: 'LIVE_POST_WINDOW_MINUTES',
  LIVE_REQUIRE_BOTH_RESULTS: 'LIVE_REQUIRE_BOTH_RESULTS',
  SITE_TITLE: 'SITE_TITLE',
  SITE_TAGLINE: 'SITE_TAGLINE',
  SITE_LOGO_URL: 'SITE_LOGO_URL',
  SITE_FAVICON_URL: 'SITE_FAVICON_URL',
  SEO_DEFAULT_TITLE: 'SEO_DEFAULT_TITLE',
  SEO_DEFAULT_DESCRIPTION: 'SEO_DEFAULT_DESCRIPTION',
  SEO_DEFAULT_KEYWORDS: 'SEO_DEFAULT_KEYWORDS',
  SEO_GLOBAL_SCHEMAS: 'SEO_GLOBAL_SCHEMAS',
  SEO_JODI_TEMPLATE: 'SEO_JODI_TEMPLATE',
  SEO_PANEL_TEMPLATE: 'SEO_PANEL_TEMPLATE',
  SEO_MARKET_TEMPLATE: 'SEO_MARKET_TEMPLATE',
  SEO_JODI_SCHEMAS: 'SEO_JODI_SCHEMAS',
  SEO_PANEL_SCHEMAS: 'SEO_PANEL_SCHEMAS',
  SEO_MARKET_SCHEMAS: 'SEO_MARKET_SCHEMAS',
} as const

type SettingsState = {
  [KEYS.MAINTENANCE_MODE]: boolean
  [KEYS.LIVE_PRE_WINDOW_MINUTES]: number
  [KEYS.LIVE_POST_WINDOW_MINUTES]: number
  [KEYS.LIVE_REQUIRE_BOTH_RESULTS]: boolean
  [KEYS.SITE_TITLE]: string
  [KEYS.SITE_TAGLINE]: string
  [KEYS.SITE_LOGO_URL]: string
  [KEYS.SITE_FAVICON_URL]: string
  [KEYS.SEO_DEFAULT_TITLE]: string
  [KEYS.SEO_DEFAULT_DESCRIPTION]: string
  [KEYS.SEO_DEFAULT_KEYWORDS]: string
  [KEYS.SEO_GLOBAL_SCHEMAS]: any
  [KEYS.SEO_JODI_TEMPLATE]: any
  [KEYS.SEO_PANEL_TEMPLATE]: any
  [KEYS.SEO_MARKET_TEMPLATE]: any
  [KEYS.SEO_JODI_SCHEMAS]: any
  [KEYS.SEO_PANEL_SCHEMAS]: any
  [KEYS.SEO_MARKET_SCHEMAS]: any
}

const defaultSettings: SettingsState = {
  MAINTENANCE_MODE: false,
  LIVE_PRE_WINDOW_MINUTES: 15,
  LIVE_POST_WINDOW_MINUTES: 15,
  LIVE_REQUIRE_BOTH_RESULTS: true,
  SITE_TITLE: 'Satta Matka',
  SITE_TAGLINE: 'Live Results & Predictions',
  SITE_LOGO_URL: '',
  SITE_FAVICON_URL: '',
  SEO_DEFAULT_TITLE: 'Satta Matka - Live Results & Predictions',
  SEO_DEFAULT_DESCRIPTION: 'Get live Satta Matka results, predictions, and tips. Fastest results for Kalyan, Milan, and other markets.',
  SEO_DEFAULT_KEYWORDS: 'satta matka, kalyan matka, matka result, satta king, matka guessing',
  SEO_GLOBAL_SCHEMAS: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '{{site.title}}',
      url: '{{site.url}}',
      potentialAction: {
        '@type': 'SearchAction',
        target: '{{site.url}}/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '{{site.title}}',
      url: '{{site.url}}',
    },
  ],
  SEO_JODI_TEMPLATE: {
    title: '{{market.displayName}} Jodi Chart - Historical Results & Analysis',
    description: 'Complete jodi chart for {{market.displayName}} market with historical results, frequency analysis, and statistics. Market timing: {{market.openTime12}} - {{market.closeTime12}}.',
    keywords: [
      '{{market.displayName}} jodi chart',
      '{{market.name}} jodi',
      'satta matka jodi',
      'jodi chart analysis',
      'matka jodi frequency',
    ],
  },
  SEO_PANEL_TEMPLATE: {
    title: '{{market.displayName}} Panel Chart - Historical Results & Analysis',
    description: 'Complete panel chart for {{market.displayName}} market with historical results, frequency analysis, and statistics. Market timing: {{market.openTime12}} - {{market.closeTime12}}.',
    keywords: [
      '{{market.displayName}} panel chart',
      '{{market.name}} panel',
      'satta matka panel',
      'panel chart analysis',
      'matka panel frequency',
    ],
  },
  SEO_MARKET_TEMPLATE: {
    title: '{{market.displayName}} Market Details - Timings, Latest Result & Charts',
    description: 'Explore {{market.displayName}} market timings, latest results, and jodi/panel charts. Operating hours: {{market.openTime12}} - {{market.closeTime12}}.',
    keywords: [
      '{{market.displayName}} market',
      '{{market.name}} matka',
      'satta matka {{market.displayName}}',
      'matka results',
      'market charts',
    ],
  },
  SEO_JODI_SCHEMAS: [],
  SEO_PANEL_SCHEMAS: [],
  SEO_MARKET_SCHEMAS: [],
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [faviconUploading, setFaviconUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/system-settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load system settings')
        const data = await res.json()
        const s = data.settings || {}
        setSettings((prev) => ({
          ...prev,
          MAINTENANCE_MODE: s[KEYS.MAINTENANCE_MODE] ?? prev.MAINTENANCE_MODE,
          LIVE_PRE_WINDOW_MINUTES: s[KEYS.LIVE_PRE_WINDOW_MINUTES] ?? prev.LIVE_PRE_WINDOW_MINUTES,
          LIVE_POST_WINDOW_MINUTES: s[KEYS.LIVE_POST_WINDOW_MINUTES] ?? prev.LIVE_POST_WINDOW_MINUTES,
          LIVE_REQUIRE_BOTH_RESULTS: s[KEYS.LIVE_REQUIRE_BOTH_RESULTS] ?? prev.LIVE_REQUIRE_BOTH_RESULTS,
          SITE_TITLE: s[KEYS.SITE_TITLE] ?? prev.SITE_TITLE,
          SITE_TAGLINE: s[KEYS.SITE_TAGLINE] ?? prev.SITE_TAGLINE,
          SITE_LOGO_URL: s[KEYS.SITE_LOGO_URL] ?? prev.SITE_LOGO_URL,
          SITE_FAVICON_URL: s[KEYS.SITE_FAVICON_URL] ?? prev.SITE_FAVICON_URL,
          SEO_DEFAULT_TITLE: s[KEYS.SEO_DEFAULT_TITLE] ?? prev.SEO_DEFAULT_TITLE,
          SEO_DEFAULT_DESCRIPTION: s[KEYS.SEO_DEFAULT_DESCRIPTION] ?? prev.SEO_DEFAULT_DESCRIPTION,
          SEO_DEFAULT_KEYWORDS: s[KEYS.SEO_DEFAULT_KEYWORDS] ?? prev.SEO_DEFAULT_KEYWORDS,
          SEO_GLOBAL_SCHEMAS: s[KEYS.SEO_GLOBAL_SCHEMAS] ?? prev.SEO_GLOBAL_SCHEMAS,
          SEO_JODI_TEMPLATE: s[KEYS.SEO_JODI_TEMPLATE] ?? prev.SEO_JODI_TEMPLATE,
          SEO_PANEL_TEMPLATE: s[KEYS.SEO_PANEL_TEMPLATE] ?? prev.SEO_PANEL_TEMPLATE,
          SEO_MARKET_TEMPLATE: s[KEYS.SEO_MARKET_TEMPLATE] ?? prev.SEO_MARKET_TEMPLATE,
          SEO_JODI_SCHEMAS: s[KEYS.SEO_JODI_SCHEMAS] ?? prev.SEO_JODI_SCHEMAS,
          SEO_PANEL_SCHEMAS: s[KEYS.SEO_PANEL_SCHEMAS] ?? prev.SEO_PANEL_SCHEMAS,
          SEO_MARKET_SCHEMAS: s[KEYS.SEO_MARKET_SCHEMAS] ?? prev.SEO_MARKET_SCHEMAS,
        }))
        setLoaded(true)
      } catch (e) {
        console.error(e)
        setLoaded(true)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const JSON_KEYS = new Set([
        KEYS.SEO_GLOBAL_SCHEMAS,
        KEYS.SEO_JODI_TEMPLATE,
        KEYS.SEO_PANEL_TEMPLATE,
        KEYS.SEO_MARKET_TEMPLATE,
        KEYS.SEO_JODI_SCHEMAS,
        KEYS.SEO_PANEL_SCHEMAS,
        KEYS.SEO_MARKET_SCHEMAS,
      ])
      const payload = Object.entries(settings).map(([key, value]) => {
        if (JSON_KEYS.has(key as any) && typeof value === 'string') {
          try {
            const parsed = JSON.parse(value as string)
            return { key, value: parsed }
          } catch {
            return { key, value }
          }
        }
        return { key, value }
      })
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save settings')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => setSettings(defaultSettings)

  const uploadFile = async (file: File, kind: 'logo' | 'favicon') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data?.url as string
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure global application behavior and site metadata</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !loaded}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>Temporarily redirect users to a maintenance page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Enable maintenance mode</Label>
              <Switch
                id="maintenance-mode"
                checked={settings.MAINTENANCE_MODE}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, MAINTENANCE_MODE: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Results Window */}
        <Card>
          <CardHeader>
            <CardTitle>Live Results Window</CardTitle>
            <CardDescription>Configure publish windows for live results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pre-publish window (minutes)</Label>
              <Slider
                value={[settings.LIVE_PRE_WINDOW_MINUTES]}
                min={0}
                max={120}
                step={5}
                onValueChange={(v) => setSettings((s) => ({ ...s, LIVE_PRE_WINDOW_MINUTES: v[0] }))}
              />
              <div className="text-sm text-muted-foreground mt-1">{settings.LIVE_PRE_WINDOW_MINUTES} minutes</div>
            </div>
            <div>
              <Label>Post-publish window (minutes)</Label>
              <Slider
                value={[settings.LIVE_POST_WINDOW_MINUTES]}
                min={0}
                max={120}
                step={5}
                onValueChange={(v) => setSettings((s) => ({ ...s, LIVE_POST_WINDOW_MINUTES: v[0] }))}
              />
              <div className="text-sm text-muted-foreground mt-1">{settings.LIVE_POST_WINDOW_MINUTES} minutes</div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="require-both">Require both open and close results</Label>
              <Switch
                id="require-both"
                checked={settings.LIVE_REQUIRE_BOTH_RESULTS}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, LIVE_REQUIRE_BOTH_RESULTS: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Site Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logo and favicon used across the site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-title">Site Title</Label>
              <Input
                id="site-title"
                value={settings.SITE_TITLE}
                onChange={(e) => setSettings((s) => ({ ...s, SITE_TITLE: e.target.value }))}
                placeholder="Satta Matka"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-tagline">Site Tagline</Label>
              <Input
                id="site-tagline"
                value={settings.SITE_TAGLINE}
                onChange={(e) => setSettings((s) => ({ ...s, SITE_TAGLINE: e.target.value }))}
                placeholder="Live Results & Predictions"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo (PNG/SVG/WebP)</Label>
              {settings.SITE_LOGO_URL ? (
                <div className="flex items-center gap-3">
                  <img src={settings.SITE_LOGO_URL} alt="Logo preview" className="h-10 w-auto rounded border" />
                  <Button variant="outline" onClick={() => setSettings((s) => ({ ...s, SITE_LOGO_URL: '' }))}>Remove</Button>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" id="logo-file" />
                <Button
                  disabled={logoUploading}
                  onClick={async () => {
                    const input = document.getElementById('logo-file') as HTMLInputElement
                    const file = input?.files?.[0]
                    if (!file) return
                    try {
                      setLogoUploading(true)
                      const url = await uploadFile(file, 'logo')
                      setSettings((s) => ({ ...s, SITE_LOGO_URL: url }))
                      input.value = ''
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setLogoUploading(false)
                    }
                  }}
                >{logoUploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon (ICO/PNG/SVG)</Label>
              {settings.SITE_FAVICON_URL ? (
                <div className="flex items-center gap-3">
                  <img src={settings.SITE_FAVICON_URL} alt="Favicon preview" className="h-8 w-8 rounded border" />
                  <Button variant="outline" onClick={() => setSettings((s) => ({ ...s, SITE_FAVICON_URL: '' }))}>Remove</Button>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/x-icon,image/png,image/svg+xml" id="favicon-file" />
                <Button
                  disabled={faviconUploading}
                  onClick={async () => {
                    const input = document.getElementById('favicon-file') as HTMLInputElement
                    const file = input?.files?.[0]
                    if (!file) return
                    try {
                      setFaviconUploading(true)
                      const url = await uploadFile(file, 'favicon')
                      setSettings((s) => ({ ...s, SITE_FAVICON_URL: url }))
                      input.value = ''
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setFaviconUploading(false)
                    }
                  }}
                >{faviconUploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Defaults</CardTitle>
            <CardDescription>Default meta used across pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo-title">Default Title</Label>
              <Input
                id="seo-title"
                value={settings.SEO_DEFAULT_TITLE}
                onChange={(e) => setSettings((s) => ({ ...s, SEO_DEFAULT_TITLE: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-desc">Default Description</Label>
              <Textarea
                id="seo-desc"
                value={settings.SEO_DEFAULT_DESCRIPTION as string}
                onChange={(e) => setSettings((s) => ({ ...s, SEO_DEFAULT_DESCRIPTION: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-keywords">Default Keywords</Label>
              <Input
                id="seo-keywords"
                value={settings.SEO_DEFAULT_KEYWORDS}
                onChange={(e) => setSettings((s) => ({ ...s, SEO_DEFAULT_KEYWORDS: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Schemas */}
        <Card>
          <CardHeader>
            <CardTitle>Global JSON-LD Schemas</CardTitle>
            <CardDescription>Rendered on all pages with placeholders</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={typeof settings.SEO_GLOBAL_SCHEMAS === 'string' ? settings.SEO_GLOBAL_SCHEMAS : JSON.stringify(settings.SEO_GLOBAL_SCHEMAS, null, 2)}
              onChange={(e) => setSettings((s) => ({ ...s, SEO_GLOBAL_SCHEMAS: e.target.value }))}
              rows={12}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}