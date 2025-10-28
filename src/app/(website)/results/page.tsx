'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  Star,
  Award,
  Target
} from 'lucide-react'

// Real-time results component
function RealtimeResults() {
  const [results, setResults] = useState([
    {
      id: '1',
      market: 'Kalyan Morning',
      date: new Date().toLocaleDateString('en-IN'),
      openResult: '123-4',
      closeResult: '567-8',
      jodi: '78',
      panel: '567',
      status: 'confirmed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '2',
      market: 'Milan Day',
      date: new Date().toLocaleDateString('en-IN'),
      openResult: '234-5',
      closeResult: '678-9',
      jodi: '89',
      panel: '678',
      status: 'confirmed',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: '3',
      market: 'Rajdhani Night',
      date: new Date().toLocaleDateString('en-IN'),
      openResult: '345-6',
      closeResult: '789-0',
      jodi: '90',
      panel: '789',
      status: 'pending',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  ])

  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Occasionally update a result status
      if (Math.random() > 0.8) {
        setResults(prev => prev.map(result =>
          result.status === 'pending'
            ? { ...result, status: 'confirmed' as const }
            : result
        ))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600">Confirmed</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-400">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <TrendingUp className="h-5 w-5" />
              Real-time Results
            </CardTitle>
            <CardDescription className="text-slate-300">
              Live updates from all markets
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400" suppressHydrationWarning>
              Last update: {mounted ? lastUpdate.toLocaleTimeString() : ''}
            </span>
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{result.market}</h3>
                  <p className="text-sm text-slate-400" suppressHydrationWarning>{result.date}</p>
                </div>
                {getStatusBadge(result.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Open</div>
                  <div className="font-mono text-lg font-bold text-cyan-400">
                    {result.openResult}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Close</div>
                  <div className="font-mono text-lg font-bold text-green-400">
                    {result.closeResult}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Jodi</div>
                  <div className="font-mono text-lg font-bold text-purple-400">
                    {result.jodi}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Panel</div>
                  <div className="font-mono text-lg font-bold text-yellow-400">
                    {result.panel}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span suppressHydrationWarning>Declared: {mounted ? result.timestamp.toLocaleTimeString() : ''}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Live</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Historical results component
function HistoricalResults() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const historicalData = [
    { market: 'Kalyan Morning', result: '456-78-901', jodi: '78', panel: '456' },
    { market: 'Milan Day', result: '567-89-012', jodi: '89', panel: '567' },
    { market: 'Rajdhani Night', result: '678-90-123', jodi: '90', panel: '678' },
  ]

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-400">
          <Calendar className="h-5 w-5" />
          Historical Results
        </CardTitle>
        <CardDescription className="text-slate-300">
          View past results and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
          />
        </div>

        <div className="space-y-3">
          {historicalData.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <div className="font-medium">{result.market}</div>
                <div className="text-sm text-slate-400">{selectedDate.toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-white">
                  {result.result}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    J: {result.jodi}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    P: {result.panel}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Charts and analytics component
function ResultsAnalytics() {
  const analytics = [
    { metric: 'Total Markets', value: '12', change: '+2', trend: 'up' },
    { metric: 'Success Rate', value: '94%', change: '+2%', trend: 'up' },
    { metric: 'Avg. Response Time', value: '< 30s', change: '-5s', trend: 'up' },
    { metric: 'User Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' },
  ]

  return (
    <Card className="bg-slate-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Target className="h-5 w-5" />
          Performance Analytics
        </CardTitle>
        <CardDescription className="text-slate-300">
          System performance and accuracy metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {analytics.map((item, index) => (
            <div key={index} className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-sm text-slate-400 mb-2">{item.metric}</div>
              <div className={`text-xs flex items-center justify-center gap-1 ${
                item.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-slate-400">
                ← Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                  Live Results
                </h1>
                <p className="text-sm text-slate-400">Real-time updates and historical data</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live Updates
              </Badge>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Real-time Results Section */}
        <div className="mb-8">
          <RealtimeResults />
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">
              Historical Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <HistoricalResults />
          </TabsContent>

          <TabsContent value="analytics">
            <ResultsAnalytics />
          </TabsContent>
        </Tabs>

        {/* Featured Stats */}
        <Card className="mt-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <Award className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400">Accuracy Rate</div>
              </div>
              <div>
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{"< 30s"}</div>
                <div className="text-sm text-slate-400">Avg. Update Time</div>
              </div>
              <div>
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">1.2K+</div>
                <div className="text-sm text-slate-400">Active Users</div>
              </div>
              <div>
                <Target className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400">Live Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}