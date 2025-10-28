import { Metadata } from 'next'
import '../globals.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SectionType } from '@/generated/prisma'
import { SchemaScripts, HCard, buildMetadata, fillPlaceholdersDeep } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  // Load default SEO settings and favicon
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['SEO_DEFAULT_TITLE', 'SEO_DEFAULT_DESCRIPTION', 'SEO_DEFAULT_KEYWORDS', 'SITE_FAVICON_URL'] } },
    select: { key: true, value: true },
  })
  const settings: Record<string, any> = {}
  for (const row of rows) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  const title = settings.SEO_DEFAULT_TITLE || 'Satta Matka - Live Results & Predictions'
  const description = settings.SEO_DEFAULT_DESCRIPTION || 'Get live Satta Matka results, predictions, and tips. Fastest results for Kalyan, Milan, and other markets.'
  const keywords = settings.SEO_DEFAULT_KEYWORDS || 'satta matka, kalyan matka, matka result, satta king, matka guessing'
  const favicon = settings.SITE_FAVICON_URL || undefined
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const meta = buildMetadata({ title, description, keywords })
  if (favicon) {
    // Next.js metadata icons
    meta.icons = { icon: favicon }
  }
  // Set site-wide canonical
  meta.alternates = { canonical: siteUrl }
  return meta
}

// Disable caching so Disclaimer updates reflect immediately
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch Site Title/Tagline, Logo and Global Schemas
  const settingsRows = await prisma.appSetting.findMany({
    where: { key: { in: ['SITE_TITLE', 'SITE_TAGLINE', 'SITE_LOGO_URL', 'SEO_GLOBAL_SCHEMAS'] } },
    select: { key: true, value: true },
  })
  const settings: Record<string, any> = {}
  for (const row of settingsRows) {
    try { settings[row.key] = JSON.parse(row.value) } catch { settings[row.key] = row.value }
  }
  const siteTitle: string = settings.SITE_TITLE || 'Satta Matka'
  const siteTagline: string = settings.SITE_TAGLINE || 'Live Results & Predictions'
  const siteLogoUrl: string | undefined = settings.SITE_LOGO_URL || undefined
  const rawSchemas: Array<Record<string, any>> = Array.isArray(settings.SEO_GLOBAL_SCHEMAS) ? settings.SEO_GLOBAL_SCHEMAS : []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const ctx = { site: { title: siteTitle, url: siteUrl } }
  const globalSchemas = fillPlaceholdersDeep(rawSchemas, ctx)
  // Fetch Disclaimer section content blocks from backend
  const disclaimerSection = await prisma.section.findUnique({
    where: { type: SectionType.DISCLAIMER },
    include: {
      contentBlocks: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, type: true, key: true, title: true, content: true },
      },
    },
  })

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white/90">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3">
          <div className="flex flex-col items-center justify-center text-center">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={siteTitle} className="h-10 w-auto mb-2" />
            ) : (
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {siteTitle}
              </h1>
            )}
            <p className="text-xs text-slate-400">{siteTagline}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-8">
        {children}
      </main>

      {/* Disclaimer */}
      <section className="container mx-auto px-3 sm:px-4 md:px-6">
        <Card className="bg-slate-800/50" style={{ backgroundColor: (disclaimerSection?.settings as any)?.backgroundColor || undefined }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400" style={{ color: (disclaimerSection?.settings as any)?.headingColor || undefined }}>
              <AlertCircle className="h-5 w-5" />
              {disclaimerSection?.title ?? 'Disclaimer'}
            </CardTitle>
            <CardDescription className="text-xs text-white/80" style={{ color: (disclaimerSection?.settings as any)?.textColor || undefined }}>{disclaimerSection?.name ?? 'Important notice'}</CardDescription>
          </CardHeader>
          <CardContent>
            {disclaimerSection?.contentBlocks?.length ? (
              <div className="disclaimer-content space-y-2">
                {disclaimerSection.contentBlocks.map((block) => {
                  if (block.type === 'HTML') {
                    const sanitizedHtml = (block.content || '').replace(/^\s*\+\s*/, '')
                    return (
                      <div
                        key={block.id}
                        className="prose prose-invert text-xs leading-snug"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      />
                    )
                  }
                  const sanitizedText = (block.content || '').replace(/^\s*\+\s*/, '')
                  return (
                    <p key={block.id} className="text-xs text-white/80 leading-snug">
                      {sanitizedText}
                    </p>
                  )
                })}
              </div>
            ) : (
              <div className="disclaimer-content text-xs text-white/80 leading-snug">
                This website is for entertainment purposes only. Please play responsibly.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-8">
          {/* Removed microformat link to avoid webview navigation */}
          {/* <HCard name="Satta Matka" url="https://example.com" org="Satta Matka" /> */}
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Satta Matka. All rights reserved. | For entertainment purposes only.</p>
            <p className="text-sm mt-2">Please play responsibly. Gambling can be addictive.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
              <a className="text-slate-300 hover:text-white underline-offset-4 hover:underline" href="/privacy-policy">Privacy Policy</a>
              <a className="text-slate-300 hover:text-white underline-offset-4 hover:underline" href="/terms-and-conditions">Terms & Conditions</a>
              <a className="text-slate-300 hover:text-white underline-offset-4 hover:underline" href="/contact-us">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Global JSON-LD schemas from settings */}
      {globalSchemas?.length ? <SchemaScripts schemas={globalSchemas} /> : null}
    </div>
  )
}