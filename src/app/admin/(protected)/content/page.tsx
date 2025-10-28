import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Settings, Edit, Eye, EyeOff, Save, Plus } from 'lucide-react'
import { ContentEditor } from '@/components/admin/content/ContentEditor'
import { SectionManager } from '@/components/admin/content/SectionManager'
import { getCurrentUser } from '@/lib/auth-server'

async function getContentStats() {
  // Mock data - will be replaced with actual database queries
  return {
    totalSections: 23,
    activeSections: 18,
    totalContentBlocks: 45,
    recentUpdates: 12,
  }
}

export default async function ContentPage() {
  const user = await getCurrentUser()
  const stats = await getContentStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage all 20+ website sections, content blocks, and dynamic content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSections}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSections} active sections
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Content Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContentBlocks}</div>
            <p className="text-xs text-muted-foreground">
              Text, HTML, and media blocks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recentUpdates}</div>
            <p className="text-xs text-muted-foreground">
              Changes this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((stats.activeSections / stats.totalSections) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sections currently enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="content">Content Blocks</TabsTrigger>
          <TabsTrigger value="games">Games & Tips</TabsTrigger>
          <TabsTrigger value="faq">FAQ & Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Management</CardTitle>
              <CardDescription>
                Toggle sections on/off and manage their display order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Blocks</CardTitle>
              <CardDescription>
                Edit text content, headings, links, and media blocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Starline Games</CardTitle>
                <CardDescription>
                  Manage Starline game results and schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Starline Morning</p>
                      <p className="text-sm text-muted-foreground">Daily game</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Starline Day</p>
                      <p className="text-sm text-muted-foreground">Daily game</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>36/48 Bazar</CardTitle>
                <CardDescription>
                  Manage 36 and 48 Bazar results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">36 Bazar</p>
                      <p className="text-sm text-muted-foreground">Daily bazar game</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">48 Bazar</p>
                      <p className="text-sm text-muted-foreground">Daily bazar game</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FAQ & Q&A Management</CardTitle>
              <CardDescription>
                Manage frequently asked questions and answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">FAQ Sections</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { question: 'What is Satta Matka?', status: 'Active' },
                    { question: 'How to play Kalyan Matka?', status: 'Active' },
                    { question: 'When are results declared?', status: 'Active' },
                  ].map((faq, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{faq.question}</p>
                        <p className="text-sm text-muted-foreground">FAQ item</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{faq.status}</Badge>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}