'use client'

import { useState, useEffect } from 'react'
import { realtimeService, MarketResult, LiveUpdate } from '@/lib/realtime'

// Hook for using real-time updates
export function useRealtimeUpdates(eventType: string) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([])

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(eventType, (update: LiveUpdate) => {
      setUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
    })

    return unsubscribe
  }, [eventType])

  return updates
}

// Hook for current results
export function useCurrentResults() {
  const [results, setResults] = useState<MarketResult[]>([])

  useEffect(() => {
    // Initial load
    setResults(realtimeService.getCurrentResults())

    // Subscribe to updates
    const unsubscribe = realtimeService.subscribe('result_update', (update: LiveUpdate) => {
      if (update.type === 'result_update') {
        setResults(prev => [update.data as MarketResult, ...prev.slice(0, 9)])
      }
    })

    // Connect to real-time service
    realtimeService.connect()

    return () => {
      unsubscribe()
      realtimeService.disconnect()
    }
  }, [])

  return results
}

// Hook for market status
export function useMarketStatus(market: string) {
  const [status, setStatus] = useState(() => realtimeService.getMarketStatus(market))

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe('market_status', (update: LiveUpdate) => {
      if (update.type === 'market_status' && update.data.market === market) {
        setStatus(update.data as any)
      }
    })

    return unsubscribe
  }, [market])

  return status
}

// Hook for connection status
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(true) // Simulated connection
    }

    const interval = setInterval(checkConnection, 1000)
    checkConnection()

    return () => clearInterval(interval)
  }, [])

  return isConnected
}