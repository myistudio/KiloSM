'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MaintenancePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Well be back soon</h1>
        <p className="text-muted-foreground">
          Our website is undergoing scheduled maintenance to improve your experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance in Progress</CardTitle>
          <CardDescription>
            Thank you for your patience. Please check back in a little while.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Were performing updates and enhancements. During this time, some features may be
              temporarily unavailable.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/">Go to Homepage</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/login">Admin Login</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}