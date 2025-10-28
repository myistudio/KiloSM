import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/auth-server'
import { UserRole, AccountStatus } from '@/generated/prisma'

function parseRole(role?: string) {
  if (!role) return undefined
  const key = role.toUpperCase()
  return (key in UserRole) ? (UserRole as any)[key] : undefined
}

function parseStatus(status?: string) {
  if (!status) return undefined
  const key = status.toUpperCase()
  return (key in AccountStatus) ? (AccountStatus as any)[key] : undefined
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, role, status } = body as { name?: string; role?: string; status?: string }

    const data: any = {}
    if (typeof name === 'string') data.name = name || null

    if (role) {
      const r = parseRole(role)
      if (!r) return NextResponse.json({ error: 'invalid role' }, { status: 400 })
      data.role = r
    }

    if (status) {
      const s = parseStatus(status)
      if (!s) return NextResponse.json({ error: 'invalid status' }, { status: 400 })
      data.status = s
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser()
  await requireAdmin()
  try {
    const { id } = await context.params

    if (current?.id === id) {
      return NextResponse.json({ error: 'cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}