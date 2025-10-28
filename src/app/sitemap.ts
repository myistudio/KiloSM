import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/results`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${siteUrl}/privacy-policy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/terms-and-conditions`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/contact-us`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/weekly-jodi`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${siteUrl}/date-fix`, changeFrequency: 'weekly', priority: 0.4 },
  ]

  const [markets, pages] = await Promise.all([
    prisma.market.findMany({
      where: { isActive: true },
      select: { name: true, updatedAt: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.page.findMany({
      where: { isEnabled: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const marketRoutes: MetadataRoute.Sitemap = markets.flatMap((m) => {
    const lastModified = m.updatedAt || new Date()
    const base = { changeFrequency: 'daily' as const, priority: 0.7, lastModified }
    const slug = encodeURIComponent(m.name)
    return [
      { url: `${siteUrl}/${slug}`, ...base },
      { url: `${siteUrl}/jodi-chart/${slug}`, ...base },
      { url: `${siteUrl}/panel-chart/${slug}`, ...base },
    ]
  })

  const pageRoutes: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${siteUrl}/pages/${encodeURIComponent(p.slug)}`,
    changeFrequency: 'weekly',
    priority: 0.6,
    lastModified: p.updatedAt || new Date(),
  }))

  return [...staticRoutes, ...marketRoutes, ...pageRoutes]
}