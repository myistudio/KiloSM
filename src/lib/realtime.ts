// Real-time service for live result updates
export interface MarketResult {
  id: string
  market: string
  date: string
  openResult: string
  closeResult: string
  jodi: string
  panel: string
  status: 'pending' | 'confirmed' | 'cancelled'
  timestamp: Date
}

export interface LiveUpdate {
  type: 'result_update' | 'market_status' | 'system_alert'
  data: MarketResult | Record<string, unknown>
  timestamp: Date
}

// Simulated real-time data store
class RealtimeService {
  private listeners: Map<string, (update: LiveUpdate) => void> = new Map()
  private results: MarketResult[] = []
  private isConnected = false

  // Simulate connection to real-time data source
  connect() {
    if (this.isConnected) return

    this.isConnected = true
    console.log('🔗 Connected to real-time service')

    // Simulate periodic result updates
    this.startResultSimulation()
  }

  disconnect() {
    this.isConnected = false
    console.log('🔌 Disconnected from real-time service')
  }

  // Subscribe to real-time updates
  subscribe(eventType: string, callback: (update: LiveUpdate) => void) {
    this.listeners.set(eventType, callback)

    return () => {
      this.listeners.delete(eventType)
    }
  }

  // Emit update to all listeners
  private emitUpdate(update: LiveUpdate) {
    this.listeners.forEach((callback) => {
      try {
        callback(update)
      } catch (error) {
        console.error('Error in real-time listener:', error)
      }
    })
  }

  // Simulate real-time result updates
  private startResultSimulation() {
    const markets = [
      'Kalyan Morning',
      'Milan Day',
      'Rajdhani Night',
      'Starline Morning',
      'Starline Day'
    ]

    // Update results every 30 seconds (simulated)
    setInterval(() => {
      if (!this.isConnected) return

      const randomMarket = markets[Math.floor(Math.random() * markets.length)]
      const shouldUpdateResult = Math.random() > 0.7 // 30% chance

      if (shouldUpdateResult) {
        this.simulateResultUpdate(randomMarket)
      }
    }, 30000)

    // Update timestamps every 5 seconds
    setInterval(() => {
      if (!this.isConnected) return

      this.emitUpdate({
        type: 'system_alert',
        data: { message: 'System running smoothly', status: 'healthy' },
        timestamp: new Date()
      })
    }, 5000)
  }

  private simulateResultUpdate(market: string) {
    const mockResult: MarketResult = {
      id: Date.now().toString(),
      market,
      date: new Date().toLocaleDateString('en-IN'),
      openResult: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`,
      closeResult: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`,
      jodi: `${Math.floor(Math.random() * 90) + 10}`,
      panel: `${Math.floor(Math.random() * 900) + 100}`,
      status: Math.random() > 0.8 ? 'confirmed' : 'pending',
      timestamp: new Date()
    }

    this.results.unshift(mockResult)

    // Keep only last 50 results
    if (this.results.length > 50) {
      this.results = this.results.slice(0, 50)
    }

    this.emitUpdate({
      type: 'result_update',
      data: mockResult,
      timestamp: new Date()
    })
  }

  // Get current results
  getCurrentResults(): MarketResult[] {
    return this.results.slice(0, 10) // Return latest 10 results
  }

  // Get market status
  getMarketStatus(market: string) {
    return {
      market,
      isActive: true,
      nextResultTime: this.getNextResultTime(market),
      lastUpdate: new Date()
    }
  }

  private getNextResultTime(market: string): string {
    const now = new Date()
    const marketTimes: Record<string, string> = {
      'Kalyan Morning': '13:30',
      'Milan Day': '19:00',
      'Rajdhani Night': '23:59',
      'Starline Morning': '10:30',
      'Starline Day': '18:30'
    }

    return marketTimes[market] || '14:00'
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()

// React hooks will be implemented in separate component files
// This service provides the core real-time functionality