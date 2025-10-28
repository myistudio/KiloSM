import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export default async function DatabasePage() {
  await getCurrentUser()

  const [userCount, marketCount, sectionCount, contentBlockCount, resultCount] = await Promise.all([
    prisma.user.count(),
    prisma.market.count(),
    prisma.section.count(),
    prisma.contentBlock.count(),
    prisma.marketResult.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Overview</h1>
        <p className="text-muted-foreground">Summary of key records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Markets</CardTitle>
            <CardDescription>Total markets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Website sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sectionCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Blocks</CardTitle>
            <CardDescription>Structured content records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentBlockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Results</CardTitle>
            <CardDescription>Total result entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}