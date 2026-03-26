import type { ContentType } from './types'

// ContentType values: 'tutorial' | 'article' | 'devlog' | 'guide'

export interface AffiliateItem {
  label: string
  description: string
  href: string      // Replace YOUR_AFFILIATE_ID with real tracking ID after applying
  cta: string
  contentTypes: ContentType[]
}

export const affiliates: AffiliateItem[] = [
  {
    label: 'Unity Asset Store',
    description: 'Browse 100k+ game dev assets, tools, and templates.',
    href: 'https://assetstore.unity.com/?aid=YOUR_AFFILIATE_ID',
    cta: 'Browse Assets',
    contentTypes: ['tutorial', 'devlog'],
  },
  {
    label: 'Unreal Marketplace',
    description: 'High-quality assets and plugins for Unreal Engine projects.',
    href: 'https://www.unrealengine.com/marketplace/en-US/store?pid=YOUR_AFFILIATE_ID',
    cta: 'View Marketplace',
    contentTypes: ['tutorial', 'devlog'],
  },
  {
    label: 'Udemy Game Dev Courses',
    description: 'Learn game development from industry professionals.',
    href: 'https://www.udemy.com/courses/development/game-development/?affcodes=YOUR_AFFILIATE_ID',
    cta: 'Browse Courses',
    contentTypes: ['guide', 'article'],
  },
  {
    label: 'Humble Bundle',
    description: 'Game dev software bundles at pay-what-you-want prices.',
    href: 'https://www.humblebundle.com/?partner=YOUR_AFFILIATE_ID',
    cta: 'View Bundles',
    contentTypes: ['article', 'guide'],
  },
  {
    label: 'Fanatical',
    description: 'Game dev software and asset bundles at discounted prices.',
    href: 'https://www.fanatical.com/?ref=YOUR_AFFILIATE_ID',
    cta: 'Browse Deals',
    contentTypes: ['guide'],
  },
]

export function getAffiliatesForType(type: ContentType): AffiliateItem[] {
  return affiliates.filter(a => a.contentTypes.includes(type))
}
