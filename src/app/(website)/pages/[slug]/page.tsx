import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SchemaScripts, buildMetadata, fillPlaceholdersDeep } from '@/lib/seo'
import SectionRenderer from '@/components/sections/SectionRenderer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug
  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      ogImageUrl: true,
      twitterCard: true,
      robotsNoIndex: true,
      robotsNoFollow: true,
      seoSchema: true,
      updatedAt: true,
      isEnabled: true,
    },
  })

  if (!page || !page.isEnabled) {
    return {
      title: 'Page Not Found',
      robots: { index: false, follow: false },
    }
  }

  const siteUrl = getSiteUrl()
  const title = page.metaTitle || page.title
  const description = page.metaDescription || page.description || undefined
  const canonical = page.canonicalUrl || `${siteUrl}/pages/${slug}`

  const meta = buildMetadata({
    title,
    description,
    openGraph: {
      url: canonical,
      images: page.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
    twitter: {
      card: (page.twitterCard as any) || undefined,
    },
  })

  // Apply robots directives per page
  meta.robots = {
    index: !page.robotsNoIndex,
    follow: !page.robotsNoFollow,
  }

  // Set canonical explicitly
  meta.alternates = {
    canonical,
  }

  return meta
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      sections: {
        where: { isEnabled: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          sortOrder: true,
          isEnabled: true,
          customTitle: true,
          customDescription: true,
          localSettings: true,
          section: { select: { type: true, name: true, title: true, isEnabled: true } },
        },
      },
    },
  })

  if (!page || !page.isEnabled) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const ctx = { site: { url: siteUrl }, page: { slug: page.slug, title: page.title } }
  // Normalize schema to array
  const rawSchema = page.seoSchema as any
  const schemas: Array<Record<string, any>> = Array.isArray(rawSchema)
    ? rawSchema
    : rawSchema
    ? [rawSchema]
    : []
  const pageSchemas = fillPlaceholdersDeep(schemas, ctx)

  const h1 = page.h1 || page.title
  const desc = page.description || ''

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{h1}</h1>
        {desc && <p className="mt-2 text-sm text-slate-300">{desc}</p>}
      </header>

      {/* Render assigned sections */}
      {page.sections?.length ? (
        <div className="space-y-6">
          {page.sections.map((ps) => (
            <section key={ps.id}>
              <SectionRenderer
                type={ps.section.type}
                title={ps.customTitle || ps.section.title || ps.section.name}
                description={ps.customDescription || undefined}
                className=""
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400">No sections added to this page yet.</div>
      )}

      {/* Page-specific JSON-LD */}
      {pageSchemas?.length ? <SchemaScripts schemas={pageSchemas} /> : null}
    </div>
  )
}