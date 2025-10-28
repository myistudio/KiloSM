import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  try {
    const { id } = await context.params
    const body = await req.json()
    const { password } = body as { password?: string }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting user password:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}