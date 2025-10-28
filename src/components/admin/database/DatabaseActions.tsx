"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DatabaseActions() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  async function runAction(action: string, confirmText?: string) {
    setMessage("")
    setError("")

    if (confirmText) {
      const ok = typeof window !== 'undefined' ? window.confirm(confirmText) : true
      if (!ok) return
    }

    setLoadingAction(action)
    try {
      const res = await fetch(`/api/admin/database?action=${encodeURIComponent(action)}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || `Action failed: ${action}`)
      }
      setMessage(data?.message || `Action completed: ${action}`)
    } catch (err: any) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoadingAction(null)
    }
  }

  const isLoading = Boolean(loadingAction)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          variant="destructive"
          disabled={isLoading}
          onClick={() => runAction('reset_results', 'Reset all results? This will delete ALL MarketResult records.')}>
          {loadingAction === 'reset_results' ? 'Resetting Results...' : 'Reset Results'}
        </Button>

        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={() => runAction('seed_results_6_months_and_clear_charts')}
        >
          {loadingAction === 'seed_results_6_months_and_clear_charts' ? 'Seeding 6 Months...' : 'Seed Results (6 months) & Clear Charts'}
        </Button>

        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={() => runAction('seed_results_30_weeks')}>
          {loadingAction === 'seed_results_30_weeks' ? 'Seeding 30 Weeks...' : 'Seed Results (30 weeks)'}
        </Button>

        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={() => runAction('seed_weekly_jodi')}>
          {loadingAction === 'seed_weekly_jodi' ? 'Seeding Weekly Jodi...' : 'Seed Weekly Jodi Content'}
        </Button>

        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={() => runAction('seed_date_fix')}>
          {loadingAction === 'seed_date_fix' ? 'Seeding Date Fix...' : 'Seed Date Fix Content'}
        </Button>

        <Button
          variant="destructive"
          disabled={isLoading}
          onClick={() => runAction('reset_and_seed_all', 'Reset ALL results and seed content? This will delete MarketResult records then seed demo data.')}>
          {loadingAction === 'reset_and_seed_all' ? 'Resetting & Seeding...' : 'Reset & Seed All'}
        </Button>
      </div>

      {(message || error) && (
        <div className="text-sm">
          {message && <p className="text-green-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}

      {isLoading && (
        <p className="text-xs text-muted-foreground">Please wait... This may take a few seconds depending on the amount of data.</p>
      )}
    </div>
  )
}