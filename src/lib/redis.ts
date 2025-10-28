import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

function isValidUrl(u?: string) {
  return !!u && /^https:\/\//.test(u)
}

// Minimal interface used across the app
type RedisClient = {
  get<T>(key: string): Promise<T | null>
  incr(key: string): Promise<number>
}

let client: RedisClient

if (isValidUrl(url) && !!token) {
  // Properly configured Redis client
  const real = new Redis({ url: url!, token: token! })
  client = {
    async get<T>(key: string) {
      return real.get<T>(key)
    },
    async incr(key: string) {
      return real.incr(key)
    },
  }
} else {
  // No-op fallback to avoid build/runtime crashes when Redis is not configured
  let warned = false
  const warnOnce = () => {
    if (!warned) {
      warned = true
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Redis is not configured (UPSTASH_REDIS_REST_URL/TOKEN). Using no-op client.')
      }
    }
  }
  client = {
    async get<T>(_key: string) {
      warnOnce()
      return null
    },
    async incr(_key: string) {
      warnOnce()
      return 0
    },
  }
}

export const redis: RedisClient = client