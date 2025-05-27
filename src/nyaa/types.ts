import type { UserAnimeEntry } from '../anilist/types.ts'

export interface NyaaEntry {
  title: string
  link: string
  seeders: number
}

export interface AnimeEpisodeMatch {
  anime: UserAnimeEntry
  episode: number
  match: NyaaEntry
  fansubGroupName: string | null
}
