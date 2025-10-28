'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Eye, EyeOff, GripVertical, Save } from 'lucide-react'

// Mock sections data based on the 20+ sections from requirements
const mockSections = [
  {
    id: '1',
    type: 'KEYWORD_SEO',
    name: 'Keyword/SEO Section',
    title: 'SEO Keywords',
    isEnabled: true,
    sortOrder: 1,
    contentBlocks: 3,
  },
  {
    id: '2',
    type: 'ASTROLOGY_LUCK',
    name: 'Astrology Luck Numbers',
    title: 'Astrology & Luck Numbers',
    isEnabled: true,
    sortOrder: 2,
    contentBlocks: 5,
  },
  {
    id: '3',
    type: 'ONLINE_PLAY',
    name: 'Online Play',
    title: 'Play Online',
    isEnabled: true,
    sortOrder: 3,
    contentBlocks: 2,
  },
  {
    id: '4',
    type: 'LIVE_RESULTS',
    name: 'Live Results',
    title: 'Live Results',
    isEnabled: true,
    sortOrder: 4,
    contentBlocks: 1,
  },
  {
    id: '5',
    type: 'NOTICE_BOARD',
    name: 'Notice Board',
    title: 'Notice Board',
    isEnabled: false,
    sortOrder: 5,
    contentBlocks: 4,
  },
  {
    id: '6',
    type: 'MARKET_ARTICLES',
    name: 'Market Articles',
    title: 'Market Articles',
    isEnabled: true,
    sortOrder: 6,
    contentBlocks: 8,
  },
  {
    id: '7',
    type: 'LATEST_RESULTS',
    name: 'Latest Results',
    title: 'Latest Results',
    isEnabled: true,
    sortOrder: 7,
    contentBlocks: 2,
  },
  {
    id: '8',
    type: 'INFO_MARQUEE',
    name: 'Info Marquee',
    title: 'Information Marquee',
    isEnabled: true,
    sortOrder: 8,
    contentBlocks: 1,
  },
  {
    id: '9',
    type: 'STARLINE_GAMES',
    name: 'Starline Games',
    title: 'Starline Games',
    isEnabled: true,
    sortOrder: 9,
    contentBlocks: 6,
  },
  {
    id: '10',
    type: 'BAZAR_36',
    name: '36 Bazar',
    title: '36 Bazar',
    isEnabled: true,
    sortOrder: 10,
    contentBlocks: 3,
  },
  {
    id: '11',
    type: 'BAZAR_48',
    name: '48 Bazar',
    title: '48 Bazar',
    isEnabled: true,
    sortOrder: 11,
    contentBlocks: 3,
  },
  {
    id: '12',
    type: 'WEEKLY_TIPS_PATTI',
    name: 'Weekly Tips Patti',
    title: 'Weekly Patti Tips',
    isEnabled: true,
    sortOrder: 14,
    contentBlocks: 7,
  },
  {
    id: '13',
    type: 'WEEKLY_TIPS_LINE',
    name: 'Weekly Tips Line',
    title: 'Weekly Line Tips',
    isEnabled: true,
    sortOrder: 15,
    contentBlocks: 7,
  },
  {
    id: '14',
    type: 'WEEKLY_TIPS_JODI',
    name: 'Weekly Tips Jodi',
    title: 'Weekly Jodi Tips',
    isEnabled: true,
    sortOrder: 16,
    contentBlocks: 7,
  },
  {
    id: '15',
    type: 'FREE_GAME_ZONE',
    name: 'Free Game Zone',
    title: 'Free Game Zone',
    isEnabled: true,
    sortOrder: 17,
    contentBlocks: 4,
  },
  {
    id: '16',
    type: 'FAQ',
    name: 'FAQ Section',
    title: 'Frequently Asked Questions',
    isEnabled: true,
    sortOrder: 20,
    contentBlocks: 12,
  },
  {
    id: '17',
    type: 'MARKET_TIMETABLE',
    name: 'Market Time Table',
    title: 'Market Timings',
    isEnabled: true,
    sortOrder: 21,
    contentBlocks: 1,
  },
  {
    id: '18',
    type: 'DISCLAIMER',
    name: 'Disclaimer',
    title: 'Disclaimer',
    isEnabled: true,
    sortOrder: 23,
    contentBlocks: 1,
  },
]

export function SectionManager() {
  const [sections, setSections] = useState(mockSections)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleSection = (id: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, isEnabled: !section.isEnabled }
        : section
    ))
  }

  const handleSortOrderChange = (id: string, newOrder: string) => {
    setSections(sections.map(section =>
      section.id === id
        ? { ...section, sortOrder: parseInt(newOrder) }
        : section
    ))
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      // Here you would make an API call to save section changes
      console.log('Saving section changes:', sections)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Show success message
      console.log('Sections saved successfully')
    } catch (error) {
      console.error('Error saving sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSections = sections.filter(s => s.isEnabled).length
  const totalSections = sections.length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{activeSections}</div>
          <div className="text-sm text-muted-foreground">Active Sections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{totalSections - activeSections}</div>
          <div className="text-sm text-muted-foreground">Disabled Sections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round((activeSections / totalSections) * 100)}%</div>
          <div className="text-sm text-muted-foreground">Active Rate</div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.id} className={`transition-colors ${!section.isEnabled ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={section.isEnabled}
                    onCheckedChange={() => handleToggleSection(section.id)}
                  />
                  {section.isEnabled ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Display Order:</span>
                  <Select
                    value={section.sortOrder.toString()}
                    onValueChange={(value) => handleSortOrderChange(section.id, value)}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: totalSections }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Blocks:</span>
                  <Badge variant="outline">{section.contentBlocks}</Badge>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Content
                  </Button>
                  <Button size="sm" variant="ghost" className="px-2">
                    <GripVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={handleSaveChanges} disabled={isLoading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving Changes...' : 'Save Section Changes'}
        </Button>
      </div>
    </div>
  )
}