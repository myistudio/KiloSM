import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  try {
    const page = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
        ogImageUrl: true,
        twitterCard: true,
        robotsNoIndex: true,
        robotsNoFollow: true,
        h1: true,
        seoSchema: true,
      },
    })
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    return NextResponse.json({ seo: page })
  } catch (error) {
    console.error('Error fetching page SEO:', error)
    return NextResponse.json({ error: 'Failed to fetch page SEO' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  try {
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body.metaTitle === 'string') data.metaTitle = body.metaTitle
    if (typeof body.metaDescription === 'string') data.metaDescription = body.metaDescription
    if (typeof body.canonicalUrl === 'string') data.canonicalUrl = body.canonicalUrl
    if (typeof body.ogImageUrl === 'string') data.ogImageUrl = body.ogImageUrl
    if (typeof body.twitterCard === 'string') data.twitterCard = body.twitterCard
    if (typeof body.robotsNoIndex === 'boolean') data.robotsNoIndex = !!body.robotsNoIndex
    if (typeof body.robotsNoFollow === 'boolean') data.robotsNoFollow = !!body.robotsNoFollow
    if (typeof body.h1 === 'string') data.h1 = body.h1
    if (body.seoSchema !== undefined) data.seoSchema = body.seoSchema

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No SEO fields provided' }, { status: 400 })
    }

    const page = await prisma.page.update({ where: { id }, data })
    return NextResponse.json({ seo: {
      id: page.id,
      slug: page.slug,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      canonicalUrl: page.canonicalUrl,
      ogImageUrl: page.ogImageUrl,
      twitterCard: page.twitterCard,
      robotsNoIndex: page.robotsNoIndex,
      robotsNoFollow: page.robotsNoFollow,
      h1: page.h1,
      seoSchema: page.seoSchema,
    } })
  } catch (error) {
    console.error('Error updating page SEO:', error)
    return NextResponse.json({ error: 'Failed to update page SEO' }, { status: 500 })
  }
}