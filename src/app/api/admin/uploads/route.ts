import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
])

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: Request) {
  await requireAdmin()
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const kind = (form.get('kind') as string | null) || 'logo'

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = (() => {
      const original = file.name.toLowerCase()
      const idx = original.lastIndexOf('.')
      if (idx !== -1) return original.slice(idx)
      if (file.type === 'image/x-icon') return '.ico'
      if (file.type === 'image/png') return '.png'
      if (file.type === 'image/svg+xml') return '.svg'
      if (file.type === 'image/webp') return '.webp'
      if (file.type === 'image/jpeg') return '.jpg'
      return ''
    })()

    const baseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ''))
    const stamp = Date.now().toString()
    const filename = `${kind}-${stamp}-${baseName}${ext}`

    const dir = path.join(process.cwd(), 'public', 'branding')
    await mkdir(dir, { recursive: true })
    const dest = path.join(dir, filename)
    await writeFile(dest, buffer)

    const urlPath = `/branding/${filename}`
    return NextResponse.json({ url: urlPath })
  } catch (e) {
    console.error('Upload error', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}