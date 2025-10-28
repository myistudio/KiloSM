import { PrismaClient } from '../src/generated/prisma'
import { UserRole, MarketStatus, SectionType, ContentBlockType, ThemeComponent, AccountStatus, DayOfWeek } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Generate secure hash for default admin password
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create or update default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sattamatka.com' },
    update: {
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: 'admin@sattamatka.com',
      name: 'Super Admin',
      password: hashedPassword, // "password123"
      role: UserRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
    },
  })

  console.log('✅ Created admin user')

  // Create all 20 sections
  const sectionsData = [
    { type: SectionType.KEYWORD_SEO, name: 'Keyword/SEO Section', title: 'SEO Keywords', sortOrder: 1 },
    { type: SectionType.ASTROLOGY_LUCK, name: 'Astrology Luck Numbers', title: 'Astrology & Luck Numbers', sortOrder: 2 },
    { type: SectionType.ONLINE_PLAY, name: 'Online Play', title: 'Play Online', sortOrder: 3 },
    { type: SectionType.LIVE_RESULTS, name: 'Live Results', title: 'Live Results', sortOrder: 4 },
    { type: SectionType.NOTICE_BOARD, name: 'Notice Board', title: 'Notice Board', sortOrder: 5 },
    { type: SectionType.MARKET_ARTICLES, name: 'Market Articles', title: 'Market Articles', sortOrder: 6 },
    { type: SectionType.LATEST_RESULTS, name: 'Latest Results', title: 'Latest Results', sortOrder: 7 },
    { type: SectionType.INFO_MARQUEE, name: 'Info Marquee', title: 'Information Marquee', sortOrder: 8 },
    { type: SectionType.STARLINE_GAMES, name: 'Starline Games', title: 'Starline Games', sortOrder: 9 },
    { type: SectionType.BAZAR_36, name: '36 Bazar', title: '36 Bazar', sortOrder: 10 },
    { type: SectionType.BAZAR_48, name: '48 Bazar', title: '48 Bazar', sortOrder: 11 },
    { type: SectionType.LINK_SECTION_1, name: 'Link Section 1', title: 'Important Links', sortOrder: 12 },
    { type: SectionType.LINK_SECTION_2, name: 'Link Section 2', title: 'Quick Links', sortOrder: 13 },
    { type: SectionType.WEEKLY_TIPS_PATTI, name: 'Weekly Tips Patti', title: 'Weekly Patti Tips', sortOrder: 14 },
    { type: SectionType.WEEKLY_TIPS_LINE, name: 'Weekly Tips Line', title: 'Weekly Line Tips', sortOrder: 15 },
    { type: SectionType.WEEKLY_TIPS_JODI, name: 'Weekly Tips Jodi', title: 'Weekly Jodi Tips', sortOrder: 16 },
    { type: SectionType.FREE_GAME_ZONE, name: 'Free Game Zone', title: 'Free Game Zone', sortOrder: 17 },
    { type: SectionType.USER_CONTENT, name: 'User Content Area', title: 'User Content', sortOrder: 18 },
    { type: SectionType.CHARTS, name: 'Charts Section', title: 'Charts & Analytics', sortOrder: 19 },
    { type: SectionType.FAQ, name: 'FAQ Section', title: 'Frequently Asked Questions', sortOrder: 20 },
    { type: SectionType.MARKET_TIMETABLE, name: 'Market Time Table', title: 'Market Timings', sortOrder: 21 },
    { type: SectionType.QA_SECTION, name: 'Q&A Section', title: 'Questions & Answers', sortOrder: 22 },
    { type: SectionType.DISCLAIMER, name: 'Disclaimer', title: 'Disclaimer', sortOrder: 23 },
  ]

  for (const sectionData of sectionsData) {
    await prisma.section.upsert({
      where: { type: sectionData.type },
      update: {},
      create: sectionData,
    })
  }

  console.log('✅ Created all sections')

  // Create default theme settings
  const themeSettings = [
    { component: ThemeComponent.PRIMARY, value: '#7c3aed' },
    { component: ThemeComponent.SECONDARY, value: '#06b6d4' },
    { component: ThemeComponent.ACCENT, value: '#10b981' },
    { component: ThemeComponent.BACKGROUND, value: '#0f172a' },
    { component: ThemeComponent.SURFACE, value: '#1e293b' },
    { component: ThemeComponent.TEXT_PRIMARY, value: '#f1f5f9' },
    { component: ThemeComponent.TEXT_SECONDARY, value: '#94a3b8' },
    { component: ThemeComponent.SUCCESS, value: '#22c55e' },
    { component: ThemeComponent.WARNING, value: '#f59e0b' },
    { component: ThemeComponent.ERROR, value: '#ef4444' },
    { component: ThemeComponent.INFO, value: '#3b82f6' },
  ]

  for (const theme of themeSettings) {
    await prisma.themeSetting.upsert({
      where: { component: theme.component },
      update: {},
      create: theme,
    })
  }

  console.log('✅ Created theme settings')

  // Create sample markets
  const marketsData = [
    {
      name: 'KALYAN',
      displayName: 'Kalyan Morning',
      openTime: '11:30',
      closeTime: '12:30',
      resultTime: '13:30',
      operatingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
      sortOrder: 1,
    },
    {
      name: 'MILAN_DAY',
      displayName: 'Milan Day',
      openTime: '15:00',
      closeTime: '17:00',
      resultTime: '19:00',
      operatingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
      sortOrder: 2,
    },
    {
      name: 'RAJDHANI_NIGHT',
      displayName: 'Rajdhani Night',
      openTime: '21:30',
      closeTime: '23:30',
      resultTime: '23:59',
      operatingDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
      sortOrder: 3,
    },
  ]

  for (const marketData of marketsData) {
    await prisma.market.upsert({
      where: { name: marketData.name },
      update: {},
      create: marketData,
    })
  }

  console.log('✅ Created sample markets')

  // Create sample content blocks for key sections
  const contentBlocksData = [
    {
      sectionType: SectionType.KEYWORD_SEO,
      key: 'main_keywords',
      title: 'Main Keywords',
      content: 'satta matka, kalyan matka, matka result, satta king, matka guessing',
      type: ContentBlockType.TEXT,
    },
    {
      sectionType: SectionType.DISCLAIMER,
      key: 'disclaimer_text',
      title: 'Disclaimer',
      content: 'This website is for entertainment purposes only. Please play responsibly.',
      type: ContentBlockType.HTML,
    },
    {
      sectionType: SectionType.FAQ,
      key: 'faq_1',
      title: 'What is Satta Matka?',
      content: 'Satta Matka is a popular lottery game that originated in India.',
      type: ContentBlockType.TEXT,
    },
  ]

  for (const blockData of contentBlocksData) {
    const section = await prisma.section.findUnique({
      where: { type: blockData.sectionType }
    })

    if (section) {
      await prisma.contentBlock.upsert({
        where: {
          sectionId_key: {
            sectionId: section.id,
            key: blockData.key,
          }
        },
        update: {},
        create: {
          sectionId: section.id,
          type: blockData.type,
          key: blockData.key,
          title: blockData.title,
          content: blockData.content,
        },
      })
    }
  }

  console.log('✅ Created sample content blocks')
  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })