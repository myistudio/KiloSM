'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ContentEditor } from '@/components/admin/content/ContentEditor'

type Section = {
  id: string
  type: string
  title: string
  name: string
}

const Upper = (s: string) => String(s || '').toUpperCase()

export function SectionModule({ section }: { section: Section }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const type = Upper(section.type)

  const isUserContent = type === 'USER_CONTENT'
  const isFAQ = type === 'FAQ'
  const isQA = type === 'QA_SECTION'
  const isNotice = type === 'NOTICE_BOARD'
  const isLinks = type === 'LINK_SECTION_1' || type === 'LINK_SECTION_2'
  const isTimetable = type === 'MARKET_TIMETABLE'
  const isStarlineOrBazar = type === 'STARLINE_GAMES' || type === 'BAZAR_36' || type === 'BAZAR_48'
  const isMarketArticles = type === 'MARKET_ARTICLES'
  const isAstrology = type === 'ASTROLOGY_LUCK'

  // Ensure the editor defaults to filtering this section by setting sectionId in URL
  useEffect(() => {
    try {
      const current = searchParams?.get('sectionId') || ''
      if (!current && pathname) {
        const params = new URLSearchParams(searchParams?.toString() || '')
        params.set('sectionId', section.id)
        const next = `${pathname}?${params.toString()}`
        router.replace(next)
      }
    } catch {}
    // Only run on mount and when section id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{section.title}</h1>
          <p className="text-muted-foreground">{section.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/content" prefetch={false}>Back to Content Hub</Link>
          </Button>
          {isUserContent && (
            <Button asChild>
              <Link href="/admin/weekly-jodi" prefetch={false}>Open Weekly Jodi Manager</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Guidance specific to section types */}
      <Card>
        <CardHeader>
          <CardTitle>Module Guidance</CardTitle>
          <CardDescription>
            Tips for editing blocks for this section type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFAQ && (
            <div className="text-sm text-muted-foreground">
              Use TEXT blocks for short answers or JSON blocks like {`{ "q": "Question", "a": "Answer" }`} for structured FAQs.
            </div>
          )}
          {isQA && (
            <div className="text-sm text-muted-foreground">
              Use JSON for Q&A pairs: {`{ "q": "Question", "a": "Answer" }`} or use TEXT for single answers.
            </div>
          )}
          {isNotice && (
            <div className="text-sm text-muted-foreground">
              Notice board supports HTML for rich announcements. Prefer concise messages and keep time‑sensitive updates current.
            </div>
          )}
          {isLinks && (
            <div className="text-sm text-muted-foreground">
              For link sections, set Content Type to LINK and provide absolute URLs. Titles act as link labels.
            </div>
          )}
          {isTimetable && (
            <div className="text-sm text-muted-foreground">
              Provide JSON arrays like {`[{ name:"Kalyan", open:"11:30", close:"12:30" }]`} to power timetable rendering.
            </div>
          )}
          {isStarlineOrBazar && (
            <div className="text-sm text-muted-foreground">
              Provide JSON arrays for schedules/results per game (e.g., Starline or Bazar sets).
            </div>
          )}
          {isMarketArticles && (
            <div className="text-sm text-muted-foreground">
              Keys should follow MK_NAME_* (e.g., KALYAN_DESCRIPTION). Frontend maps keys per market detail page.
            </div>
          )}
          {isAstrology && (
            <div className="text-sm text-muted-foreground">
              Provide JSON arrays of lucky numbers or TEXT guidance; keep content brief and clear.
            </div>
          )}
          {!isFAQ && !isQA && !isNotice && !isLinks && !isTimetable && !isStarlineOrBazar && !isMarketArticles && !isAstrology && (
            <div className="text-sm text-muted-foreground">
              Edit blocks below. Use the Content Type best suited to your data (TEXT/HTML/JSON/LINK).
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generic editor filtered to this section */}
      <Card>
        <CardHeader>
          <CardTitle>Content Blocks</CardTitle>
          <CardDescription>
            Add or edit blocks for {section.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentEditor />
        </CardContent>
      </Card>
    </div>
  )
}