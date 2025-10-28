import type { Metadata } from 'next'

// Helper to build Next.js Metadata from dynamic inputs
export function buildMetadata({
  title,
  description,
  keywords,
  openGraph,
  twitter,
}: {
  title: string
  description?: string
  keywords?: string | string[]
  openGraph?: Partial<NonNullable<Metadata['openGraph']>>
  twitter?: Partial<NonNullable<Metadata['twitter']>>
}): Metadata {
  const base: Metadata = {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
  return base
}

// Replace {{placeholders}} in strings using context values
export function fillPlaceholders(str: string, ctx: Record<string, any>): string {
  return String(str).replace(/{{\s*([\w\.]+)\s*}}/g, (_, key) => {
    const parts = String(key).split('.')
    let val: any = ctx
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p]
      } else {
        return ''
      }
    }
    return typeof val === 'string' ? val : (val != null ? String(val) : '')
  })
}

export function fillPlaceholdersDeep<T = any>(value: T, ctx: Record<string, any>): T {
  if (value == null) return value
  if (typeof value === 'string') return fillPlaceholders(value, ctx) as unknown as T
  if (Array.isArray(value)) return value.map((v) => fillPlaceholdersDeep(v, ctx)) as unknown as T
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      out[k] = fillPlaceholdersDeep(v, ctx)
    }
    return out as T
  }
  return value
}

// Build metadata from a simple template object and context
export function buildMetadataFromTemplate(
  template: { title: string; description?: string; keywords?: string | string[]; openGraph?: any; twitter?: any },
  ctx: Record<string, any>,
  defaults?: Partial<Metadata>
): Metadata {
  const title = fillPlaceholders(template.title, ctx)
  const description = template.description ? fillPlaceholders(template.description, ctx) : undefined
  const keywords = Array.isArray(template.keywords)
    ? template.keywords.map((k) => fillPlaceholders(String(k), ctx))
    : (template.keywords ? fillPlaceholders(String(template.keywords), ctx) : undefined)
  const og = template.openGraph ? Object.fromEntries(Object.entries(template.openGraph).map(([k, v]) => [k, typeof v === 'string' ? fillPlaceholders(v, ctx) : v])) : undefined
  const tw = template.twitter ? Object.fromEntries(Object.entries(template.twitter).map(([k, v]) => [k, typeof v === 'string' ? fillPlaceholders(v, ctx) : v])) : undefined
  const meta = buildMetadata({ title, description, keywords, openGraph: og, twitter: tw })
  // Merge with defaults (defaults take effect where template omits)
  return {
    ...defaults,
    ...meta,
    openGraph: { ...(defaults?.openGraph || {}), ...(meta.openGraph || {}) },
    twitter: { ...(defaults?.twitter || {}), ...(meta.twitter || {}) },
  }
}

// JSON-LD Schema scripts component for pages
export function SchemaScripts({ schemas }: { schemas: Array<Record<string, any>> }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

// Simple microformat h-card component
export function HCard({
  name,
  url,
  email,
  org,
  className,
}: {
  name: string
  url?: string
  email?: string
  org?: string
  className?: string
}) {
  return (
    <div className={`h-card ${className ?? ''}`}>
      <span className="p-name">{name}</span>
      {org && <span className="p-org">{org}</span>}
      {url && (
        <a className="u-url" href={url} rel="me noopener noreferrer">
          {url}
        </a>
      )}
      {email && (
        <a className="u-email" href={`mailto:${email}`}>
          {email}
        </a>
      )}
    </div>
  )
}