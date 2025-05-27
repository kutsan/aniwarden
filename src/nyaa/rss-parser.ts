import { XMLParser } from 'fast-xml-parser'

import { NyaaRssFeedSchema } from './schemas.ts'
import type { NyaaEntry } from './types.ts'

const parser = new XMLParser()

export function parseRssFeed(textContent: string): NyaaEntry[] {
  try {
    const parsedRss: unknown = parser.parse(textContent)
    const parsedResult = NyaaRssFeedSchema.safeParse(parsedRss)

    if (!parsedResult.success) {
      throw new Error('Invalid RSS feed format')
    }

    if (parsedResult.data.rss.channel.item === undefined) {
      console.log('No items found in RSS feed')
      return []
    }

    if (!Array.isArray(parsedResult.data.rss.channel.item)) {
      parsedResult.data.rss.channel.item = [parsedResult.data.rss.channel.item]
    }

    return parsedResult.data.rss.channel.item.map((item) => ({
      title: item.title,
      link: item.link,
      seeders: item['nyaa:seeders'],
    }))
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    throw new Error('Failed to parse RSS feed')
  }
}
