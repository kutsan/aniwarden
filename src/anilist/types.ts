import type { z } from 'zod'

import type { MediaStatusSchema } from './schemas.ts'

export type MediaStatus = z.infer<typeof MediaStatusSchema>

export interface UserAnimeEntry {
  progress: number
  media: {
    id: number
    title: {
      romaji: string
      english: string | null
    }
    status: MediaStatus
    totalEpisodes: number | null
    nextAiringEpisode: number | null
  }
}
