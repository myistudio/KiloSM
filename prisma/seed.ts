import { PrismaClient } from '../src/generated/prisma'
import { UserRole, MarketStatus, SectionType, ContentBlockType, ThemeComponent, AccountStatus, DayOfWeek, ResultFormat } from '../src/generated/prisma'
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

  // Custom colors for each section's top bar and text
  const sectionColors: Record<SectionType, { showTopBar: boolean; headerBgColor: string; headingColor: string; textColor: string; backgroundColor: string }> = {
    [SectionType.LIVE_RESULTS]: { showTopBar: true, headerBgColor: '#0f766e', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.LATEST_RESULTS]: { showTopBar: true, headerBgColor: '#92400e', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.NOTICE_BOARD]: { showTopBar: true, headerBgColor: '#7f1d1d', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.INFO_MARQUEE]: { showTopBar: true, headerBgColor: '#a16207', headingColor: '#ffffff', textColor: '#fde68a', backgroundColor: '#0f172a' },
    [SectionType.ASTROLOGY_LUCK]: { showTopBar: true, headerBgColor: '#6d28d9', headingColor: '#ffffff', textColor: '#e9d5ff', backgroundColor: '#0f172a' },
    [SectionType.MARKET_TIMETABLE]: { showTopBar: true, headerBgColor: '#1e40af', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.STARLINE_GAMES]: { showTopBar: true, headerBgColor: '#b45309', headingColor: '#ffffff', textColor: '#ffedd5', backgroundColor: '#0f172a' },
    [SectionType.BAZAR_36]: { showTopBar: true, headerBgColor: '#065f46', headingColor: '#ffffff', textColor: '#d1fae5', backgroundColor: '#0f172a' },
    [SectionType.BAZAR_48]: { showTopBar: true, headerBgColor: '#7c2d12', headingColor: '#ffffff', textColor: '#ffedd5', backgroundColor: '#0f172a' },
    [SectionType.LINK_SECTION_1]: { showTopBar: true, headerBgColor: '#6d28d9', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.LINK_SECTION_2]: { showTopBar: true, headerBgColor: '#a21caf', headingColor: '#ffffff', textColor: '#f5d0fe', backgroundColor: '#0f172a' },
    [SectionType.KEYWORD_SEO]: { showTopBar: true, headerBgColor: '#0891b2', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.ONLINE_PLAY]: { showTopBar: true, headerBgColor: '#059669', headingColor: '#ffffff', textColor: '#d1fae5', backgroundColor: '#0f172a' },
    [SectionType.MARKET_ARTICLES]: { showTopBar: true, headerBgColor: '#0369a1', headingColor: '#ffffff', textColor: '#e0f2fe', backgroundColor: '#0f172a' },
    [SectionType.USER_CONTENT]: { showTopBar: true, headerBgColor: '#334155', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.CHARTS]: { showTopBar: true, headerBgColor: '#1e293b', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.QA_SECTION]: { showTopBar: true, headerBgColor: '#7c3aed', headingColor: '#ffffff', textColor: '#ede9fe', backgroundColor: '#0f172a' },
    [SectionType.FAQ]: { showTopBar: true, headerBgColor: '#475569', headingColor: '#ffffff', textColor: '#e2e8f0', backgroundColor: '#0f172a' },
    [SectionType.DISCLAIMER]: { showTopBar: true, headerBgColor: '#111827', headingColor: '#ffffff', textColor: '#9ca3af', backgroundColor: '#0f172a' },
    [SectionType.WEEKLY_TIPS_PATTI]: { showTopBar: true, headerBgColor: '#6b21a8', headingColor: '#ffffff', textColor: '#e9d5ff', backgroundColor: '#0f172a' },
    [SectionType.WEEKLY_TIPS_LINE]: { showTopBar: true, headerBgColor: '#4c1d95', headingColor: '#ffffff', textColor: '#ddd6fe', backgroundColor: '#0f172a' },
    [SectionType.WEEKLY_TIPS_JODI]: { showTopBar: true, headerBgColor: '#5b21b6', headingColor: '#ffffff', textColor: '#e9d5ff', backgroundColor: '#0f172a' },
    [SectionType.FREE_GAME_ZONE]: { showTopBar: true, headerBgColor: '#0ea5e9', headingColor: '#ffffff', textColor: '#e0f2fe', backgroundColor: '#0f172a' },
  }

  for (const sectionData of sectionsData) {
    await prisma.section.upsert({
      where: { type: sectionData.type },
      update: { settings: sectionColors[sectionData.type] },
      create: { ...sectionData, settings: sectionColors[sectionData.type] },
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
      // Highlight Kalyan with a demo message
      isHighlighted: true,
      highlightMessage: 'Demo message',
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
      update: marketData.name === 'KALYAN'
        ? {
            isHighlighted: true,
            highlightMessage: 'Demo message',
          }
        : {},
      create: marketData,
    })
  }

  console.log('✅ Created sample markets')

  // Seed 7 days of dummy results for all markets
  const allMarkets = await prisma.market.findMany()
  const dowMap: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ]

  function randTriple() {
    return String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  }
  function sumDigitsMod10(triple: string) {
    const s = triple.split('').reduce((acc, d) => acc + Number(d), 0)
    return String(s % 10)
  }
  function panna(): string {
    const t = randTriple()
    const s = sumDigitsMod10(t)
    return `${t}-${s}`
  }

  for (const market of allMarkets) {
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const dow = dowMap[d.getDay()]
      if (!market.operatingDays || !market.operatingDays.includes(dow)) continue
      const openRes = panna()
      const closeRes = panna()
      await prisma.marketResult.upsert({
        where: {
          marketId_date: {
            marketId: market.id,
            date: d,
          },
        },
        update: {},
        create: {
          marketId: market.id,
          date: d,
          openResult: openRes,
          closeResult: closeRes,
          status: ResultFormat.SINGLE,
          isPublished: true,
        },
      })
    }
  }
  console.log('✅ Seeded 7 days of results for all markets')

  // Create sample content blocks for key sections
  const contentBlocksData: Array<{ sectionType: SectionType; key: string; title?: string; content: string; type: ContentBlockType; metadata?: any }> = [
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
    // User pages: Privacy Policy, Terms & Conditions, Contact Us
    {
      sectionType: SectionType.USER_CONTENT,
      key: 'PRIVACY_POLICY_1',
      title: 'Privacy Overview',
      content: '<p>We value your privacy and explain what data we collect and how we use it.</p>',
      type: ContentBlockType.HTML,
    },
    {
      sectionType: SectionType.USER_CONTENT,
      key: 'TERMS_AND_CONDITIONS_1',
      title: 'Terms of Use',
      content: '<p>By using this website, you agree to follow our terms of service and rules.</p>',
      type: ContentBlockType.HTML,
    },
    {
      sectionType: SectionType.USER_CONTENT,
      key: 'CONTACT_US_1',
      title: 'Contact Details',
      content: 'Reach us via the details below.',
      type: ContentBlockType.TEXT,
      metadata: { email: 'support@sattamatka.com', phone: '+91-9876543210', url: 'https://sattamatka.com' },
    },
    // Homepage hero defaults
    {
      sectionType: SectionType.USER_CONTENT,
      key: 'HOME_HERO_TITLE',
      title: 'Homepage Hero Title',
      content: 'Fastest Live Results',
      type: ContentBlockType.TEXT,
    },
    {
      sectionType: SectionType.USER_CONTENT,
      key: 'HOME_HERO_SUBTITLE',
      title: 'Homepage Hero Subtitle',
      content: 'Get instant Satta Matka results, predictions, and tips',
      type: ContentBlockType.TEXT,
    },
  ]

  // Additional demo content for various sections
  const sampleBlocks: Array<{ sectionType: SectionType; key: string; title?: string; content: string; type: ContentBlockType }> = [
    { sectionType: SectionType.NOTICE_BOARD, key: 'notice_1', title: 'Server Upgrade', content: 'We will perform a scheduled upgrade tonight at 11:30 PM.', type: ContentBlockType.TEXT },
    { sectionType: SectionType.NOTICE_BOARD, key: 'notice_2', title: 'New Features', content: 'Live chat has been added to the website.', type: ContentBlockType.TEXT },
    { sectionType: SectionType.INFO_MARQUEE, key: 'marquee_1', title: 'Important', content: 'Play responsibly • Latest results updated in real-time • Follow us on Telegram', type: ContentBlockType.TEXT },
    { sectionType: SectionType.ASTROLOGY_LUCK, key: 'luck_numbers', title: 'Lucky Numbers', content: JSON.stringify(['12', '34', '56', '78', '90']), type: ContentBlockType.JSON },
    { sectionType: SectionType.MARKET_TIMETABLE, key: 'timetable_1', title: 'Daily Schedule', content: JSON.stringify([{ name:'Kalyan Morning', open:'11:30', close:'12:30' }, { name:'Milan Day', open:'15:00', close:'17:00' }, { name:'Rajdhani Night', open:'21:30', close:'23:30' }]), type: ContentBlockType.JSON },
    { sectionType: SectionType.LINK_SECTION_1, key: 'link_1', title: 'How to Play', content: 'https://example.com/how-to-play', type: ContentBlockType.LINK },
    { sectionType: SectionType.LINK_SECTION_1, key: 'link_2', title: 'Responsible Gaming', content: 'https://example.com/responsible-gaming', type: ContentBlockType.LINK },
    { sectionType: SectionType.LINK_SECTION_2, key: 'link_3', title: 'Market Glossary', content: 'https://example.com/market-glossary', type: ContentBlockType.LINK },
    { sectionType: SectionType.MARKET_ARTICLES, key: 'article_1', title: 'Understanding Patti', content: 'Patti is a three-digit number with its sum used as the last digit...', type: ContentBlockType.TEXT },
    { sectionType: SectionType.QA_SECTION, key: 'qa_1', title: 'How to read results?', content: JSON.stringify({ q: 'How to read results?', a: 'Results are shown as Open (AAA-B) and Close (CCC-D). Combined jodi is BD.' }), type: ContentBlockType.JSON },
    { sectionType: SectionType.USER_CONTENT, key: 'user_post_1', title: 'Tips from Community', content: 'Always manage bankroll and avoid chasing losses.', type: ContentBlockType.TEXT },
    { sectionType: SectionType.ONLINE_PLAY, key: 'online_play_1', title: 'Play Safely', content: 'Use verified platforms and avoid sharing OTPs.', type: ContentBlockType.TEXT },
    { sectionType: SectionType.STARLINE_GAMES, key: 'starline_schedule', title: 'Starline Schedule', content: JSON.stringify([{ name: 'Starline 10:00', open: '10:00', close: '10:30' }, { name: 'Starline 11:00', open: '11:00', close: '11:30' }]), type: ContentBlockType.JSON },
    { sectionType: SectionType.BAZAR_36, key: 'bazar36_schedule', title: '36 Bazar', content: JSON.stringify([{ name: 'Bazar 36 A', open: '12:00', close: '12:30' }]), type: ContentBlockType.JSON },
    { sectionType: SectionType.BAZAR_48, key: 'bazar48_schedule', title: '48 Bazar', content: JSON.stringify([{ name: 'Bazar 48 X', open: '14:00', close: '14:30' }]), type: ContentBlockType.JSON },
    { sectionType: SectionType.WEEKLY_TIPS_PATTI, key: 'weekly_patti', title: 'Weekly Patti Tips', content: '127, 389, 456, 780', type: ContentBlockType.TEXT },
    { sectionType: SectionType.WEEKLY_TIPS_LINE, key: 'weekly_line', title: 'Weekly Line Tips', content: '12-34-56-78', type: ContentBlockType.TEXT },
    { sectionType: SectionType.WEEKLY_TIPS_JODI, key: 'weekly_jodi', title: 'Weekly Jodi Tips', content: '12, 23, 34, 45, 56', type: ContentBlockType.TEXT },
    { sectionType: SectionType.FREE_GAME_ZONE, key: 'free_game_zone_1', title: 'Free Games', content: 'Try your luck with free games.', type: ContentBlockType.TEXT },
  ]

  const allBlockData: Array<{ sectionType: SectionType; key: string; title?: string; content: string; type: ContentBlockType; metadata?: any }> = [...contentBlocksData, ...sampleBlocks]

  for (const blockData of allBlockData) {
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
          metadata: blockData.metadata,
        },
      })
    }
  }

  // Seed dummy content for all sections
  const allSections = await prisma.section.findMany()
  for (const section of allSections) {
    await prisma.contentBlock.upsert({
      where: {
        sectionId_key: {
          sectionId: section.id,
          key: 'demo_content',
        },
      },
      update: {},
      create: {
        sectionId: section.id,
        type: ContentBlockType.TEXT,
        key: 'demo_content',
        title: `${section.title} Demo Content`,
        content: `This is demo content for the ${section.name} section.`,
        sortOrder: 1,
      },
    })
  }
  console.log('✅ Seeded dummy content for all sections')
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