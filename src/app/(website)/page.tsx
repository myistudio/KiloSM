import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SectionRenderer from '@/components/sections/SectionRenderer'
import DailyPredictionsCard from '@/components/DailyPredictionsCard'
import { prisma } from '@/lib/prisma'
import { SectionType } from '@/generated/prisma'
import { Timer, Target, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  // Fetch hero content server-side for SEO
  const userContent = await prisma.section.findUnique({
    where: { type: SectionType.USER_CONTENT },
    include: {
      contentBlocks: {
        where: { isActive: true },
        select: { key: true, content: true },
      },
    },
  })

  const blocks = userContent?.contentBlocks || []
  const titleBlock = blocks.find((b) => b.key === 'HOME_HERO_TITLE')
  const subtitleBlock = blocks.find((b) => b.key === 'HOME_HERO_SUBTITLE')

  const heroTitle = titleBlock?.content || 'Fastest Live Results'
  const heroSubtitle = subtitleBlock?.content || 'Get instant Satta Matka results, predictions, and tips'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      {/* Main Content */}
      <main className="container mx-auto px-[5px] py-8 overflow-x-hidden">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            {heroTitle}
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            {heroSubtitle.split(/\n+/).map((line, idx, arr) => (
              <span key={idx}>
                {line}
                {idx < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>

        {/* Sequential Sections (no tabs) */}
        <section className="mt-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <SectionRenderer type="LIVE_RESULTS" title="Live Results" description="Markets currently live" />
            </div>
            <div className="lg:col-span-3">
              <SectionRenderer type="MARKET_TIMETABLE" title="Market Timetable" description="All market schedules" />
            </div>
            <div className="lg:col-span-1">
              <SectionRenderer type="NOTICE_BOARD" title="Notice Board" description="Important updates" />
            </div>
            <div className="lg:col-span-3">
              <SectionRenderer type="INFO_MARQUEE" title="Information Marquee" description="Important rolling updates" />
            </div>
          </div>
        </section>

        {/* Latest Results Section */}
        <section className="mt-8">
          <SectionRenderer type="LATEST_RESULTS" title="Latest Results" description="Most recent published results" />
        </section>

        <section className="mt-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionRenderer type="ASTROLOGY_LUCK" title="Today's Lucky Numbers" description="Astrology & numerology picks" />
            <DailyPredictionsCard />
          </div>
        </section>

        {/* Featured Section */}
        <Card className="mt-12 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Why Choose Us?</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="space-y-2">
                <Timer className="h-8 w-8 mx-auto text-green-400" />
                <h4 className="font-semibold text-white">Instant Results</h4>
                <p className="text-sm text-slate-300">Results updated within seconds of declaration</p>
              </div>
              <div className="space-y-2">
                <Target className="h-8 w-8 mx-auto text-blue-400" />
                <h4 className="font-semibold text-white">99.9% Accuracy</h4>
                <p className="text-sm text-slate-300">Most reliable results in the market</p>
              </div>
              <div className="space-y-2">
                <Globe className="h-8 w-8 mx-auto text-purple-400" />
                <h4 className="font-semibold text-white">24/7 Support</h4>
                <p className="text-sm text-slate-300">Round the clock customer assistance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Sections */}
        <section className="mt-12 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SectionRenderer type="KEYWORD_SEO" title="SEO Keywords" description="Primary keywords for SEO" />
            <SectionRenderer type="ONLINE_PLAY" title="Play Online" description="Safe and secure online play options" />
            <SectionRenderer type="MARKET_ARTICLES" title="Market Articles" description="Guides and insights" />
            <SectionRenderer type="LINK_SECTION_1" title="Quick Link" description="Resources and tools" />
            <SectionRenderer type="LINK_SECTION_2" title="More Links" description="Guides and help" />
            <SectionRenderer type="USER_CONTENT" title="User Content" description="Community submissions" />
            <SectionRenderer type="CHARTS" title="Charts" description="To know more about the market and the statistics of this market, open the market detail page." />
            <SectionRenderer type="QA_SECTION" title="Q&A Section" description="Ask and answer questions" />
          </div>
        </section>
      </main>

      {/* Footer is rendered in WebsiteLayout; removed to avoid duplication */}
    </div>
  )
}