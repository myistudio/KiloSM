import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { redis } from '@/lib/redis'
import { SectionType, ContentBlockType } from '@/generated/prisma'

function dayNameFromUTCDay(dayIdx: number): string {
  return ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][dayIdx]
}

function normalizeDateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPatti(): string {
  return String(randInt(0, 999)).padStart(3, '0')
}

function randomDigit(): string {
  return String(randInt(0, 9))
}

function buildSingleResult(): { open: string; close: string } {
  const open = `${randomPatti()}-${randomDigit()}`
  const close = `${randomPatti()}-${randomDigit()}`
  return { open, close }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

async function ensureUserContentSection() {
  let section = await prisma.section.findUnique({ where: { type: SectionType.USER_CONTENT } })
  if (!section) {
    section = await prisma.section.create({
      data: {
        type: SectionType.USER_CONTENT,
        name: 'User Content',
        title: 'User Content Blocks',
        isEnabled: true,
        sortOrder: 999,
      },
    })
  }
  return section
}

async function deleteAllResultsAndSeed({ weeks = 30 }: { weeks: number }) {
  // Remove all results and related demo activity logs
  await prisma.activityLog.deleteMany({ where: { action: 'DEMO_SEED_RESULT' } })
  await prisma.marketResult.deleteMany({})

  const markets = await prisma.market.findMany({
    where: { isActive: true },
    select: { id: true, name: true, displayName: true, operatingDays: true },
    orderBy: { sortOrder: 'asc' },
  })

  const today = normalizeDateOnlyUTC(new Date())
  const totalDays = weeks * 7

  for (const m of markets) {
    const opDays = Array.isArray(m.operatingDays) ? (m.operatingDays as unknown as string[]) : []
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today)
      d.setUTCDate(today.getUTCDate() - i)
      const dayName = dayNameFromUTCDay(d.getUTCDay())
      if (!opDays.includes(dayName)) continue
      const dateOnly = normalizeDateOnlyUTC(d)
      const { open, close } = buildSingleResult()

      const created = await prisma.marketResult.create({
        data: {
          marketId: m.id,
          date: dateOnly,
          openResult: open,
          closeResult: close,
          status: 'SINGLE',
          isPublished: true,
        },
      })

      // Randomly mark some dates as RED for chart highlights (about ~10%)
      if (Math.random() < 0.1) {
        await prisma.activityLog.create({
          data: {
            marketId: m.id,
            resultId: created.id,
            action: 'DEMO_SEED_RESULT',
            details: { date: dateOnly.toISOString(), color: 'RED' },
          },
        })
      }
    }
  }
}

async function seedWeeklyJodiContent() {
  const section = await ensureUserContentSection()
  const keys = Array.from({ length: 12 }, (_, i) => `WEEKLY_JODI_${i + 1}`)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const title = `Weekly Jodi ${i + 1}`
    const content = `Sample weekly jodi entries for block ${i + 1}: 12, 34, 56, 78, 90`
    await prisma.contentBlock.upsert({
      where: { sectionId_key: { sectionId: section.id, key } },
      update: { title, content, isActive: true, sortOrder: i, type: ContentBlockType.TEXT },
      create: { sectionId: section.id, key, title, content, isActive: true, sortOrder: i, type: ContentBlockType.TEXT },
    })
  }
  // Basic SEO defaults
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_TITLE' } },
    update: { title: 'Weekly Jodi', content: 'Weekly Jodi - Satta Matka', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_TITLE', title: 'Weekly Jodi', content: 'Weekly Jodi - Satta Matka', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_DESCRIPTION' } },
    update: { title: 'Weekly Jodi Description', content: 'Weekly jodi entries and results.', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_DESCRIPTION', title: 'Weekly Jodi Description', content: 'Weekly jodi entries and results.', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_KEYWORDS' } },
    update: { title: 'Weekly Jodi Keywords', content: 'satta, satta matka, weekly jodi, jodi', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_WEEKLY_JODI_KEYWORDS', title: 'Weekly Jodi Keywords', content: 'satta, satta matka, weekly jodi, jodi', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
}

async function seedDateFixContent() {
  const section = await ensureUserContentSection()
  const markets = await prisma.market.findMany({ where: { isActive: true }, select: { id: true, name: true, displayName: true, sortOrder: true } })
  for (let i = 0; i < markets.length; i++) {
    const m = markets[i]
    const key = `DATE_FIX_${slugify(m.name)}`
    const title = `${m.displayName || m.name} Date Fix`
    const fixNum = String(randInt(0, 9999)).padStart(4, '0')
    await prisma.contentBlock.upsert({
      where: { sectionId_key: { sectionId: section.id, key } },
      update: { title, content: fixNum, isActive: true, sortOrder: i, type: ContentBlockType.TEXT },
      create: { sectionId: section.id, key, title, content: fixNum, isActive: true, sortOrder: i, type: ContentBlockType.TEXT },
    })
  }
  // Basic SEO defaults
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_DATE_FIX_TITLE' } },
    update: { title: 'Date Fix', content: 'Date Fix - Satta Matka', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_DATE_FIX_TITLE', title: 'Date Fix', content: 'Date Fix - Satta Matka', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_DATE_FIX_DESCRIPTION' } },
    update: { title: 'Date Fix Description', content: 'Admin-managed 4-digit date fix numbers for all active markets.', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_DATE_FIX_DESCRIPTION', title: 'Date Fix Description', content: 'Admin-managed 4-digit date fix numbers for all active markets.', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
  await prisma.contentBlock.upsert({
    where: { sectionId_key: { sectionId: section.id, key: 'SEO_DATE_FIX_KEYWORDS' } },
    update: { title: 'Date Fix Keywords', content: 'satta, satta matka, date fix, fix', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
    create: { sectionId: section.id, key: 'SEO_DATE_FIX_KEYWORDS', title: 'Date Fix Keywords', content: 'satta, satta matka, date fix, fix', isActive: true, sortOrder: 999, type: ContentBlockType.TEXT },
  })
}

export async function POST(req: Request) {
  await requireAdmin()
  try {
    const { searchParams } = new URL(req.url)
    let action = searchParams.get('action') || ''
    if (!action) {
      // Also allow JSON body with { action }
      try {
        const body = await req.json().catch(() => null)
        if (body && typeof body.action === 'string') action = body.action
      } catch {}
    }

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    switch (action) {
      case 'reset_results':
        await prisma.activityLog.deleteMany({ where: { action: 'DEMO_SEED_RESULT' } })
        await prisma.marketResult.deleteMany({})
        await redis.incr('live_markets_version').catch(() => {})
        return NextResponse.json({ ok: true, message: 'All results removed' })

      case 'seed_results_30_weeks':
        await deleteAllResultsAndSeed({ weeks: 30 })
        await redis.incr('live_markets_version').catch(() => {})
        return NextResponse.json({ ok: true, message: 'Seeded 30 weeks of results for all active markets' })

      case 'seed_weekly_jodi':
        await seedWeeklyJodiContent()
        return NextResponse.json({ ok: true, message: 'Seeded Weekly Jodi content blocks' })

      case 'seed_date_fix':
        await seedDateFixContent()
        return NextResponse.json({ ok: true, message: 'Seeded Date Fix content blocks' })

      case 'reset_and_seed_all':
        await deleteAllResultsAndSeed({ weeks: 30 })
        await seedWeeklyJodiContent()
        await seedDateFixContent()
        await redis.incr('live_markets_version').catch(() => {})
        return NextResponse.json({ ok: true, message: 'Reset all results and seeded 30 weeks, Weekly Jodi, and Date Fix content.' })

      case 'seed_results_6_months_and_clear_charts':
        // Approximate 6 months as 26 weeks
        await deleteAllResultsAndSeed({ weeks: 26 })
        // Clear CHARTS content blocks
        {
          const chartsSection = await prisma.section.findUnique({ where: { type: SectionType.CHARTS } })
          if (chartsSection) {
            await prisma.contentBlock.deleteMany({ where: { sectionId: chartsSection.id } })
          }
        }
        await redis.incr('live_markets_version').catch(() => {})
        return NextResponse.json({ ok: true, message: 'Seeded last 6 months of results and cleared all CHARTS content blocks.' })

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin database action failed:', error)
    return NextResponse.json({ error: 'Admin database action failed' }, { status: 500 })
  }
}