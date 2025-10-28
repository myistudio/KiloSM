import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

export async function GET() {
  // Ensure only admins can access
  await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ users })
}