'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Tabs removed per design change
import {
  Clock,
  TrendingUp,
  Star,
  Zap,
  Info,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Award,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Timer,
  Smartphone,
  Globe
} from 'lucide-react'

// Live clock component
function SmallLiveStatus({ size = 'md', inline = false }: { size?: 'sm' | 'md', inline?: boolean }) {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = mounted
    ? time.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—:—'

  const sizeClasses = size === 'sm'
    ? {
        dot: 'h-1.5 w-1.5',
        pill: 'px-2 py-0.5 text-[10px] gap-1.5',
      }
    : {
        dot: 'h-2 w-2',
        pill: 'px-3 py-1 text-xs gap-2',
      }

  return (
    <div className={inline ? '' : 'mt-2 flex items-center justify-center'}>
      <div className={`inline-flex items-center ${sizeClasses.pill} rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold shadow-md`}>
        <span className="relative flex">
          <span className={`animate-ping absolute inline-flex rounded-full ${sizeClasses.dot} bg-white opacity-75`}></span>
          <span className={`relative inline-flex rounded-full ${sizeClasses.dot} bg-white`}></span>
        </span>
        <span>LIVE</span>
        <span suppressHydrationWarning>{timeStr}</span>
      </div>
    </div>
  )
}

// Astrology luck numbers component
function AstrologyLuckNumbers() {
  const [numbers, setNumbers] = useState([3, 7, 2, 9, 5])

  useEffect(() => {
    const interval = setInterval(() => {
      setNumbers(prev => prev.map(() => Math.floor(Math.random() * 10)))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Star className="h-5 w-5" />
          Today's Lucky Numbers
        </CardTitle>
        <CardDescription className="text-slate-300">
          Based on astrology and numerology
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-3 mb-4">
          {numbers.map((num, index) => (
            <div
              key={index}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg animate-pulse"
            >
              {num}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-400">
          Updates every 5 seconds
        </p>
      </CardContent>
    </Card>
  )
}

// Live results component
function LiveResults() {
  const [results, setResults] = useState([
    { market: 'Kalyan Morning', result: '123-45-678', time: '13:30', status: 'live', open: '11:30', close: '12:30' },
    { market: 'Milan Day', result: '234-56-789', time: '19:00', status: 'live', open: '15:00', close: '17:00' },
    { market: 'Rajdhani Night', result: '345-67-890', time: '23:59', status: 'loading', open: '21:30', close: '23:30' },
  ])

  return (
    <Card className="bg-slate-900/60 border border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Activity className="h-5 w-5" />
            Live Results
          </CardTitle>
          <SmallLiveStatus size="sm" inline />
        </div>
        <CardDescription className="text-slate-300">
          Real-time results from all markets
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 py-4">
        <div className="space-y-2">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between px-2 py-2 bg-slate-800/60 rounded-md">
              <div>
                <div className="font-medium text-white">{result.market}</div>
                <div className="text-xs text-slate-400">{result.time}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-green-400">
                  {result.result}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Open: {result.open} • Close: {result.close}</div>
                <Badge variant={result.status === 'live' ? 'default' : 'secondary'} className="mt-1">
                  {result.status === 'live' ? 'live' : 'loading'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Market timing component
function MarketTimings() {
  const markets = [
    { name: 'Kalyan Morning', open: '11:30', close: '12:30', result: '13:30' },
    { name: 'Milan Day', open: '15:00', close: '17:00', result: '19:00' },
    { name: 'Rajdhani Night', open: '21:30', close: '23:30', result: '23:59' },
  ]

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-400">
          <Clock className="h-5 w-5" />
          Market Timings
        </CardTitle>
        <CardDescription className="text-slate-300">
          Today's schedule for all markets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {markets.map((market, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <div className="font-medium">{market.name}</div>
                <div className="text-sm text-slate-400">
                  Open: {market.open} • Close: {market.close}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-400">Result</div>
                <div className="text-sm text-slate-400">{market.result}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Notice board component
function NoticeBoard() {
  const notices = [
    { title: 'Server Maintenance', message: 'Scheduled maintenance on Oct 8th, 2-4 AM IST', type: 'warning' },
    { title: 'New Market Added', message: 'Starline games now available', type: 'info' },
    { title: 'Result Declaration', message: 'All results will be declared 15 mins after close time', type: 'info' },
  ]

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <Info className="h-5 w-5" />
          Notice Board
        </CardTitle>
        <CardDescription className="text-slate-300">
          Important announcements and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notices.map((notice, index) => (
            <div key={index} className="p-3 bg-slate-700/50 rounded-lg border-l-4 border-yellow-400">
              <div className="font-medium text-yellow-400">{notice.title}</div>
              <div className="text-sm text-slate-300 mt-1">{notice.message}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick stats component
function QuickStats() {
  const stats = [
    { label: 'Active Markets', value: '12', icon: BarChart3, color: 'text-blue-400' },
    { label: 'Today\'s Results', value: '8', icon: CheckCircle, color: 'text-green-400' },
    { label: 'Total Users', value: '1.2K', icon: Users, color: 'text-purple-400' },
    { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-cyan-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-slate-800/50">
          <CardContent className="p-4 text-center">
            <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Satta Matka
            </h1>
            <p className="text-xs text-slate-400">Live Results & Predictions</p>
            {/* Live/time removed from header as requested */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            Fastest Live Results
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Get instant Satta Matka results, predictions, and tips for all major markets.
            Updated in real-time with 99.9% accuracy.
          </p>
          {/* Removed LiveClock and CTA buttons as requested */}
        </div>

        {/* Quick Stats */}
        {/* Replaced QuickStats with full-width Success Rate */}
        <Card className="bg-slate-800/50 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-cyan-400" />
              <div>
                <div className="text-3xl font-bold text-white">94%</div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sequential Sections (no tabs) */}
        <section className="mt-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <LiveResults />
            </div>
            <div className="lg:col-span-3">
              <MarketTimings />
            </div>
          </div>
        </section>

        {/* Latest Results Section */}
        <section className="mt-12">
          <LatestResults />
        </section>

        <section className="mt-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <AstrologyLuckNumbers />
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-purple-400">Daily Predictions</CardTitle>
                <CardDescription className="text-slate-300">
                  Based on planetary positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                    <div className="font-medium text-purple-400">Jodi: 45</div>
                    <div className="text-sm text-slate-300">High probability today</div>
                  </div>
                  <div className="p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
                    <div className="font-medium text-cyan-400">Panel: 123</div>
                    <div className="text-sm text-slate-300">Lucky number combination</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <NoticeBoard />
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
          <h3 className="text-2xl font-bold text-white">Website Sections</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. SEO Keywords */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <FileText className="h-5 w-5" />
                  SEO Keywords
                </CardTitle>
                <CardDescription className="text-slate-300">Primary keywords for SEO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">satta matka, kalyan matka, matka result, satta king</div>
              </CardContent>
            </Card>

            {/* 2. Online Play */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Zap className="h-5 w-5" />
                  Play Online
                </CardTitle>
                <CardDescription className="text-slate-300">Safe and secure online play options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button>Play Now</Button>
                  <Button variant="outline">Learn More</Button>
                </div>
              </CardContent>
            </Card>

            {/* 3. Market Articles */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <FileText className="h-5 w-5" />
                  Market Articles
                </CardTitle>
                <CardDescription className="text-slate-300">Guides and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                  <li>How to read results</li>
                  <li>Beginner's guide to markets</li>
                  <li>Tips for responsible play</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Latest Results */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Latest Results
                </CardTitle>
                <CardDescription className="text-slate-300">Most recent declarations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>Kalyan Morning: 123-4</div>
                  <div>Milan Day: 456-7</div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Info Marquee */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <Info className="h-5 w-5" />
                  Information Marquee
                </CardTitle>
                <CardDescription className="text-slate-300">Important rolling updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Server maintenance tonight 2-4 AM IST • New market added • Results declared 15 mins after close</div>
              </CardContent>
            </Card>

            {/* 6. Starline Games */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-400">
                  <Star className="h-5 w-5" />
                  Starline Games
                </CardTitle>
                <CardDescription className="text-slate-300">Morning and Day sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Starline Morning: 10:30</div>
                  <div>Starline Day: 18:30</div>
                </div>
              </CardContent>
            </Card>

            {/* 7. 36 Bazar */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-400">
                  <BarChart3 className="h-5 w-5" />
                  36 Bazar
                </CardTitle>
                <CardDescription className="text-slate-300">Popular bazar timings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Open: 11:00 • Close: 12:00 • Result: 12:30</div>
              </CardContent>
            </Card>

            {/* 8. 48 Bazar */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-400">
                  <BarChart3 className="h-5 w-5" />
                  48 Bazar
                </CardTitle>
                <CardDescription className="text-slate-300">Evening bazar timings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Open: 18:00 • Close: 19:00 • Result: 19:30</div>
              </CardContent>
            </Card>

            {/* 9. Weekly Tips - Patti */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-400">
                  <Award className="h-5 w-5" />
                  Weekly Patti Tips
                </CardTitle>
                <CardDescription className="text-slate-300">Top picks of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">123, 456, 789</div>
              </CardContent>
            </Card>

            {/* 10. Weekly Tips - Line */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-300">
                  <Award className="h-5 w-5" />
                  Weekly Line Tips
                </CardTitle>
                <CardDescription className="text-slate-300">High probability lines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">12-34-56 • 78-90-12</div>
              </CardContent>
            </Card>

            {/* 11. Weekly Tips - Jodi */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-200">
                  <Award className="h-5 w-5" />
                  Weekly Jodi Tips
                </CardTitle>
                <CardDescription className="text-slate-300">Lucky pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">45, 67, 89</div>
              </CardContent>
            </Card>

            {/* 12. Free Game Zone */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Activity className="h-5 w-5" />
                  Free Game Zone
                </CardTitle>
                <CardDescription className="text-slate-300">Practice and play for free</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Try out combinations safely</div>
              </CardContent>
            </Card>

            {/* 13. FAQ */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-300">
                  <Info className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription className="text-slate-300">Common queries answered</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                  <li>What is Satta Matka?</li>
                  <li>How are results declared?</li>
                </ul>
              </CardContent>
            </Card>

            {/* 14. Market Time Table */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                  <Clock className="h-5 w-5" />
                  Market Timetable
                </CardTitle>
                <CardDescription className="text-slate-300">All market schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">View open, close, and result times</div>
              </CardContent>
            </Card>

            {/* 15. Disclaimer */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Disclaimer
                </CardTitle>
                <CardDescription className="text-slate-300">Important notice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">This website is for entertainment purposes only. Please play responsibly.</div>
              </CardContent>
            </Card>

            {/* 16. Link Section 1 */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-400">
                  <FileText className="h-5 w-5" />
                  Useful Links
                </CardTitle>
                <CardDescription className="text-slate-300">Resources and tools</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                  <li>Result History</li>
                  <li>Tips Archive</li>
                </ul>
              </CardContent>
            </Card>

            {/* 17. Link Section 2 */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-violet-300">
                  <FileText className="h-5 w-5" />
                  More Links
                </CardTitle>
                <CardDescription className="text-slate-300">Guides and help</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                  <li>Beginner Guide</li>
                  <li>Responsible Play</li>
                </ul>
              </CardContent>
            </Card>

            {/* 18. User Content */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <Users className="h-5 w-5" />
                  User Content
                </CardTitle>
                <CardDescription className="text-slate-300">Community submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Top community tips and predictions</div>
              </CardContent>
            </Card>

            {/* 19. Charts */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-300">
                  <BarChart3 className="h-5 w-5" />
                  Charts
                </CardTitle>
                <CardDescription className="text-slate-300">Visual trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Market performance and trends</div>
              </CardContent>
            </Card>

            {/* 20. Q&A Section */}
            <Card className="bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-200">
                  <Info className="h-5 w-5" />
                  Q&A Section
                </CardTitle>
                <CardDescription className="text-slate-300">Ask and answer questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">Community Q&A</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Satta Matka. All rights reserved. | For entertainment purposes only.</p>
            <p className="text-sm mt-2">Please play responsibly. Gambling can be addictive.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


function LatestResults() {
  const [items, setItems] = useState<Array<{ market: string; result?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        // Try latest published results first
        const res = await fetch('/api/results/latest', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          const results = (json?.results ?? []).map((r: any) => ({
            market: r.marketDisplayName || r.marketName || 'Unknown',
            result: r.closeResult || r.openResult || '-'
          }))
          if (results.length > 0) {
            setItems(results.slice(0, 6))
            return
          }
        }
        // Fallback: list active markets to show placeholders
        const resMarkets = await fetch('/api/markets', { cache: 'no-store' })
        if (!resMarkets.ok) {
          throw new Error(`Failed to load markets (${resMarkets.status})`)
        }
        const jsonMk = await resMarkets.json()
        const markets = (jsonMk?.markets ?? []).map((m: any) => ({ market: m.displayName || m.name }))
        setItems(markets.slice(0, 6))
      } catch (e: any) {
        console.error('Error loading latest results:', e)
        setError(e?.message || 'Failed to load latest results')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Card className="bg-slate-900/60 border border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
            Latest Results
          </CardTitle>
          <SmallLiveStatus size="sm" inline />
        </div>
        <CardDescription className="text-slate-300">
          Recently declared results with quick chart access
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 py-4">
        {error && (
          <div className="mb-3 text-sm text-red-400">{error}</div>
        )}
        <div className="space-y-2">
          {loading && (
            <div className="text-sm text-slate-400">Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-sm text-slate-400">No results yet. Check back soon.</div>
          )}
          {!loading && items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-2 py-2 bg-slate-800/60 rounded-md">
              <Button
                variant="outline"
                size="sm"
                className="rounded-md px-2 py-0.5 text-[11px] bg-teal-900/30 border-teal-700/60 text-teal-200 hover:bg-teal-900/50 hover:border-teal-700"
              >
                Jodi
              </Button>
              <div className="text-center flex-1">
                <div className="font-medium text-white">{item.market}</div>
                {item.result && (
                  <div className="font-mono text-lg font-bold text-cyan-400">{item.result}</div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md px-2 py-0.5 text-[11px] bg-amber-900/30 border-amber-700/60 text-amber-200 hover:bg-amber-900/50 hover:border-amber-700"
              >
                Panel
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}