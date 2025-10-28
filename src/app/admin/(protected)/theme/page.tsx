'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Palette,
  RotateCcw,
  Save,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Upload
} from 'lucide-react'

// Theme color components enum (matching database schema)
const ThemeComponents = {
  PRIMARY: { name: 'Primary', description: 'Main brand color' },
  SECONDARY: { name: 'Secondary', description: 'Secondary brand color' },
  ACCENT: { name: 'Accent', description: 'Accent and highlight color' },
  BACKGROUND: { name: 'Background', description: 'Main background color' },
  SURFACE: { name: 'Surface', description: 'Card and surface backgrounds' },
  TEXT_PRIMARY: { name: 'Text Primary', description: 'Primary text color' },
  TEXT_SECONDARY: { name: 'Text Secondary', description: 'Secondary text color' },
  SUCCESS: { name: 'Success', description: 'Success state color' },
  WARNING: { name: 'Warning', description: 'Warning state color' },
  ERROR: { name: 'Error', description: 'Error state color' },
  INFO: { name: 'Info', description: 'Info state color' },
}

// Default theme colors
const defaultTheme = {
  PRIMARY: '#7c3aed',
  SECONDARY: '#06b6d4',
  ACCENT: '#10b981',
  BACKGROUND: '#0f172a',
  SURFACE: '#1e293b',
  TEXT_PRIMARY: '#f1f5f9',
  TEXT_SECONDARY: '#94a3b8',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
}

// Color presets for quick selection
const colorPresets = [
  {
    name: 'Default Purple',
    colors: { ...defaultTheme }
  },
  {
    name: 'Ocean Blue',
    colors: {
      ...defaultTheme,
      PRIMARY: '#2563eb',
      SECONDARY: '#0891b2',
      ACCENT: '#10b981',
    }
  },
  {
    name: 'Forest Green',
    colors: {
      ...defaultTheme,
      PRIMARY: '#16a34a',
      SECONDARY: '#0891b2',
      ACCENT: '#f59e0b',
    }
  },
  {
    name: 'Sunset Orange',
    colors: {
      ...defaultTheme,
      PRIMARY: '#ea580c',
      SECONDARY: '#f59e0b',
      ACCENT: '#ef4444',
    }
  },
  {
    name: 'Dark Mode',
    colors: {
      ...defaultTheme,
      BACKGROUND: '#000000',
      SURFACE: '#111111',
      TEXT_PRIMARY: '#ffffff',
      TEXT_SECONDARY: '#888888',
    }
  },
]

export default function ThemePage() {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme)
  const [selectedComponent, setSelectedComponent] = useState<keyof typeof ThemeComponents>('PRIMARY')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isLoading, setIsLoading] = useState(false)

  // Apply theme to CSS custom properties for live preview
  useEffect(() => {
    const root = document.documentElement
    Object.entries(currentTheme).forEach(([key, value]) => {
      root.style.setProperty(`--${key.toLowerCase()}`, value)
    })
  }, [currentTheme])

  const handleColorChange = (component: keyof typeof ThemeComponents, value: string) => {
    setCurrentTheme(prev => ({
      ...prev,
      [component]: value
    }))
  }

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setCurrentTheme(preset.colors)
  }

  const handleReset = () => {
    setCurrentTheme(defaultTheme)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Here you would make an API call to save the theme
      console.log('Saving theme:', currentTheme)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Show success message
      console.log('Theme saved successfully')
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDeviceClasses = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-md mx-auto'
      case 'desktop':
        return 'max-w-full'
      default:
        return 'max-w-full'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Customization</h1>
          <p className="text-muted-foreground">
            Customize the complete color palette with live preview
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Color Picker Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Color Presets</CardTitle>
              <CardDescription>
                Quick start with predefined color schemes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="flex gap-1">
                      {Object.entries(preset.colors).slice(0, 5).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Components */}
          <Card>
            <CardHeader>
              <CardTitle>Color Components</CardTitle>
              <CardDescription>
                Customize individual color components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(ThemeComponents).map(([key, config]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{config.name}</Label>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={currentTheme[key as keyof typeof currentTheme]}
                        onChange={(e) => handleColorChange(key as keyof typeof ThemeComponents, e.target.value)}
                        className="w-16 h-8 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={currentTheme[key as keyof typeof currentTheme]}
                        onChange={(e) => handleColorChange(key as keyof typeof ThemeComponents, e.target.value)}
                        className="w-24 text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Light</span>
                      <span>Dark</span>
                    </div>
                    <Slider
                      value={[parseInt(currentTheme[key as keyof typeof currentTheme].slice(1), 16)]}
                      onValueChange={(values) => {
                        const value = values[0]
                        const hex = value.toString(16).padStart(6, '0')
                        handleColorChange(key as keyof typeof ThemeComponents, `#${hex}`)
                      }}
                      max={0xffffff}
                      step={0x1000}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-6">
          {/* Device Preview Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Device</CardTitle>
              <CardDescription>
                Select device size for preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See your changes in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`border rounded-lg p-4 ${getDeviceClasses()} transition-all duration-300`}>
                <div className="space-y-4">
                  {/* Header Preview */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      Satta Matka
                    </h2>
                    <Badge style={{ backgroundColor: 'var(--primary)', color: 'var(--text-primary)' }}>
                      Live
                    </Badge>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                      <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Market Results
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Kalyan Morning</span>
                          <span style={{ color: 'var(--text-primary)' }}>123-45-678</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Milan Day</span>
                          <span style={{ color: 'var(--text-primary)' }}>234-56-789</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--primary)'
                      }}
                    >
                      View All Results
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette Display */}
          <Card>
            <CardHeader>
              <CardTitle>Current Palette</CardTitle>
              <CardDescription>
                Your selected colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(currentTheme).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{ThemeComponents[key as keyof typeof ThemeComponents]?.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}