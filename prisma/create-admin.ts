import { PrismaClient, UserRole, AccountStatus } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@sattamatka.com'
  const plainPassword = 'password123'

  console.log('🔐 Setting default admin credentials:', email)
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.SUPER_ADMIN,
      name: 'Super Admin',
    },
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  })

  console.log('✅ Admin user upserted successfully')
}

main()
  .catch((e) => {
    console.error('❌ Failed to set admin credentials:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })