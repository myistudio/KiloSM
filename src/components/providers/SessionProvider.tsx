'use client'

import type { Session } from 'next-auth'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}