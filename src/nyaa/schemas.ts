import { z } from 'zod'

const NyaaRssFeedItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  description: z.string(),
  guid: z.string(),
  'nyaa:seeders': z.number(),
  'nyaa:leechers': z.number(),
  'nyaa:downloads': z.number(),
  'nyaa:size': z.string(),
  'nyaa:trusted': z.string(),
})

export const NyaaRssFeedSchema = z.object({
  rss: z.object({
    channel: z.object({
      item: z.array(NyaaRssFeedItemSchema).or(NyaaRssFeedItemSchema).optional(),
    }),
  }),
})
