import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import bcrypt from 'bcryptjs'
import { UserRole, AccountStatus } from '@/generated/prisma'

export async function GET(req: Request) {
  // Ensure only admins can access
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const pageParam = Number(searchParams.get('page') || '1')
  const pageSizeParam = Number(searchParams.get('pageSize') || '20')
  const search = (searchParams.get('search') || '').trim()

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 && pageSizeParam <= 100 ? pageSizeParam : 20
  const skip = (page - 1) * pageSize

  const where: any = {}
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({ users, total, page, pageSize })
}

export async function POST(req: Request) {
  await requireAdmin()
  try {
    const body = await req.json()
    const { email, password, name, role, status } = body as {
      email: string
      password: string
      name?: string
      role?: keyof typeof UserRole | string
      status?: keyof typeof AccountStatus | string
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    let roleEnum = UserRole.ADMIN
    if (role && typeof role === 'string' && (role.toUpperCase() in UserRole)) {
      roleEnum = (UserRole as any)[role.toUpperCase()]
    }

    let statusEnum = AccountStatus.ACTIVE
    if (status && typeof status === 'string' && (status.toUpperCase() in AccountStatus)) {
      statusEnum = (AccountStatus as any)[status.toUpperCase()]
    }

    const created = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        role: roleEnum,
        status: statusEnum,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}