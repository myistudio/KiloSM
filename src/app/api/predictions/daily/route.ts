import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SectionType } from '@/generated/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseTips(blocks: Array<{ type: string; content: string }>): string[] {
  const tips: string[] = []
  blocks.forEach((b) => {
    if (b.type === 'JSON') {
      try {
        const arr = JSON.parse(b.content)
        if (Array.isArray(arr)) tips.push(...arr.map((x: any) => String(x)))
      } catch {}
    } else {
      const parts = String(b.content)
        .split(/[\s,•\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      tips.push(...parts)
    }
  })
  return tips
}

function isTwoDigit(str: string): boolean {
  return /^\d{2}$/.test(str)
}

function isThreeDigit(str: string): boolean {
  return /^\d{3}$/.test(str)
}

export async function GET() {
  try {
    // Try to source Jodi from Weekly Tips Jodi
    const jodiSection = await prisma.section.findUnique({
      where: { type: SectionType.WEEKLY_TIPS_JODI },
      include: {
        contentBlocks: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { type: true, content: true },
        },
      },
    })

    let jodi: string | null = null
    let panel: string | null = null
    let source: string = ''

    if (jodiSection && jodiSection.isEnabled) {
      const tips = parseTips(jodiSection.contentBlocks as any)
      const pick = tips.find((t) => isTwoDigit(t))
      if (pick) {
        jodi = pick
        source = source || 'WEEKLY_TIPS_JODI'
      }
    }

    // Try to source Panel from Weekly Tips Patti/Line
    const pattiSection = await prisma.section.findUnique({
      where: { type: SectionType.WEEKLY_TIPS_PATTI },
      include: {
        contentBlocks: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { type: true, content: true },
        },
      },
    })

    if (pattiSection && pattiSection.isEnabled) {
      const tips = parseTips(pattiSection.contentBlocks as any)
      const pick = tips.find((t) => isThreeDigit(t))
      if (pick) {
        panel = pick
        source = source || 'WEEKLY_TIPS_PATTI'
      }
    }

    // If panel not found, try line tips
    if (!panel) {
      const lineSection = await prisma.section.findUnique({
        where: { type: SectionType.WEEKLY_TIPS_LINE },
        include: {
          contentBlocks: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { type: true, content: true },
          },
        },
      })
      if (lineSection && lineSection.isEnabled) {
        const tips = parseTips(lineSection.contentBlocks as any)
        const pick = tips.find((t) => isThreeDigit(t))
        if (pick) {
          panel = pick
          source = source || 'WEEKLY_TIPS_LINE'
        }
      }
    }

    // Fallback: build from Astrology Luck numbers
    if (!jodi || !panel) {
      const luckSection = await prisma.section.findUnique({
        where: { type: SectionType.ASTROLOGY_LUCK },
        include: {
          contentBlocks: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { type: true, content: true },
          },
        },
      })
      if (luckSection && luckSection.isEnabled) {
        const nums: string[] = []
        ;(luckSection.contentBlocks as any).forEach((b: any) => {
          if (b.type === 'JSON') {
            try {
              const arr = JSON.parse(b.content)
              if (Array.isArray(arr)) nums.push(...arr.map((x: any) => String(x)))
            } catch {}
          } else {
            const parts = String(b.content)
              .split(/[\s,•,\n,\,]+/)
              .map((s: string) => s.trim())
              .filter(Boolean)
            parts.forEach((p: string) => {
              if (/^\d$/.test(p)) nums.push(p)
            })
          }
        })
        if (!jodi && nums.length >= 2) {
          jodi = `${nums[0]}${nums[1]}`
          source = source || 'ASTROLOGY_LUCK'
        }
        if (!panel && nums.length >= 3) {
          panel = `${nums[0]}${nums[1]}${nums[2]}`
          source = source || 'ASTROLOGY_LUCK'
        }
      }
    }

    return NextResponse.json(
      { jodi: jodi || null, panel: panel || null, source: source || '' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Error building daily predictions:', error)
    return NextResponse.json({ error: 'Failed to build predictions' }, { status: 500 })
  }
}