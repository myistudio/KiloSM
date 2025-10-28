import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/auth-server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  await requireAuth()
  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'newPassword must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id: user!.id } })
    if (!existing) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }

    const ok = await bcrypt.compare(currentPassword, existing.password)
    if (!ok) {
      return NextResponse.json({ error: 'current password is incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: existing.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}