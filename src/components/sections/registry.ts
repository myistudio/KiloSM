export type SectionKey =
  | 'KEYWORD_SEO'
  | 'ASTROLOGY_LUCK'
  | 'ONLINE_PLAY'
  | 'LIVE_RESULTS'
  | 'NOTICE_BOARD'
  | 'MARKET_ARTICLES'
  | 'LATEST_RESULTS'
  | 'INFO_MARQUEE'
  | 'STARLINE_GAMES'
  | 'BAZAR_36'
  | 'BAZAR_48'
  | 'LINK_SECTION_1'
  | 'LINK_SECTION_2'
  | 'WEEKLY_TIPS_PATTI'
  | 'WEEKLY_TIPS_LINE'
  | 'WEEKLY_TIPS_JODI'
  | 'FREE_GAME_ZONE'
  | 'USER_CONTENT'
  | 'CHARTS'
  | 'FAQ'
  | 'MARKET_TIMETABLE'
  | 'QA_SECTION'
  | 'DISCLAIMER'

export interface SectionMeta {
  key: SectionKey
  name: string
  description: string
}

export const SECTION_REGISTRY: SectionMeta[] = [
  { key: 'KEYWORD_SEO', name: 'Keyword SEO', description: 'SEO keyword block' },
  { key: 'ASTROLOGY_LUCK', name: 'Astrology Luck', description: 'Astrology-based tips' },
  { key: 'ONLINE_PLAY', name: 'Online Play', description: 'Links to online play' },
  { key: 'LIVE_RESULTS', name: 'Live Results', description: 'Live market results' },
  { key: 'NOTICE_BOARD', name: 'Notice Board', description: 'Announcements and notices' },
  { key: 'MARKET_ARTICLES', name: 'Market Articles', description: 'Articles and insights' },
  { key: 'LATEST_RESULTS', name: 'Latest Results', description: 'Recent market results' },
  { key: 'INFO_MARQUEE', name: 'Info Marquee', description: 'Scrolling info bar' },
  { key: 'STARLINE_GAMES', name: 'Starline Games', description: 'Starline market games' },
  { key: 'BAZAR_36', name: 'Bazar 36', description: 'Bazar 36 module' },
  { key: 'BAZAR_48', name: 'Bazar 48', description: 'Bazar 48 module' },
  { key: 'LINK_SECTION_1', name: 'Link Section 1', description: 'Link block 1' },
  { key: 'LINK_SECTION_2', name: 'Link Section 2', description: 'Link block 2' },
  { key: 'WEEKLY_TIPS_PATTI', name: 'Weekly Tips Patti', description: 'Weekly patti tips' },
  { key: 'WEEKLY_TIPS_LINE', name: 'Weekly Tips Line', description: 'Weekly line tips' },
  { key: 'WEEKLY_TIPS_JODI', name: 'Weekly Tips Jodi', description: 'Weekly jodi tips' },
  { key: 'FREE_GAME_ZONE', name: 'Free Game Zone', description: 'Free games showcase' },
  { key: 'USER_CONTENT', name: 'User Content', description: 'User-submitted content' },
  { key: 'CHARTS', name: 'Charts', description: 'Charts and analytics' },
  { key: 'FAQ', name: 'FAQ', description: 'Frequently asked questions' },
  { key: 'MARKET_TIMETABLE', name: 'Market Timetable', description: 'Timetable module' },
  { key: 'QA_SECTION', name: 'Q&A Section', description: 'Question & answer block' },
  { key: 'DISCLAIMER', name: 'Disclaimer', description: 'Legal and info disclaimer' },
]