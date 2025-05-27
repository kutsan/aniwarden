import anitomy from 'anitomy-js'
import Fuse from 'fuse.js'

import type { UserAnimeEntry } from '../anilist/index.ts'
import { fansubGroups, onlyUseSpecifiedFansubGroups } from '../config.ts'
import { categories, filters } from './constants.ts'
import { parseRssFeed } from './rss-parser.ts'
import type { AnimeEpisodeMatch } from './types.ts'
import { getNyaaSearchUrl } from './utils.ts'

export async function checkNewEpisodes({
  animelist,
}: {
  animelist: Array<{
    entry: UserAnimeEntry
    episodes: number[]
    fansubGroupName: string | null
  }>
}): Promise<AnimeEpisodeMatch[]> {
  const searchUrl = getNyaaSearchUrl({
    query: '',
    category: categories.animeEng,
    filter: filters.none,
  })

  console.log('Search URL:', searchUrl)

  const response = await fetch(searchUrl)
  const textContent = await response.text()
  const items = parseRssFeed(textContent)

  // Filter out items with no seeders and sort by seeders
  const sortedItems = items
    .filter((item) => item.seeders > 0)
    .sort((a, b) => b.seeders - a.seeders)

  const animeSearch = new Fuse(animelist, {
    keys: ['entry.media.title.romaji', 'entry.media.title.english'],
  })

  const fansubGroupsSet = new Set(fansubGroups)
  const foundAnimeEpisodes: Record<UserAnimeEntry['media']['id'], number[]> = {}
  const matchedAnimeEpisodes: AnimeEpisodeMatch[] = []

  for (const item of sortedItems) {
    const parsedEntry = anitomy.parseSync(item.title)

    if (
      parsedEntry.anime_title === undefined ||
      parsedEntry.episode_number === undefined ||
      Array.isArray(parsedEntry.episode_number) ||
      parsedEntry.video_resolution !== '1080p'
    ) {
      continue
    }

    if (
      parsedEntry.release_group === undefined ||
      (onlyUseSpecifiedFansubGroups &&
        !fansubGroupsSet.has(parsedEntry.release_group))
    ) {
      continue
    }

    const [result] = animeSearch.search(parsedEntry.anime_title)

    if (result === undefined) {
      continue
    }

    if (
      result.item.fansubGroupName !== null &&
      result.item.fansubGroupName !== parsedEntry.release_group
    ) {
      continue
    }

    const animeId = result.item.entry.media.id

    const previouslyFoundEpisodes = new Set(foundAnimeEpisodes[animeId] ?? [])

    if (previouslyFoundEpisodes.has(Number(parsedEntry.episode_number))) {
      continue
    }

    const episodeSet = new Set(result.item.episodes)

    const episodeMatch = episodeSet.has(Number(parsedEntry.episode_number))
    console.log(
      'Search:',
      JSON.stringify(
        {
          torrent: item.title,
          title: parsedEntry.anime_title,
          episodeNumber: parsedEntry.episode_number,
          videoResolution: parsedEntry.video_resolution,
          releaseInformation: parsedEntry.release_information,
          releaseGroup: parsedEntry.release_group,
          episodeMatch,
        },
        null,
        2,
      ),
    )

    if (episodeMatch) {
      foundAnimeEpisodes[animeId] ??= []
      foundAnimeEpisodes[animeId].push(Number(parsedEntry.episode_number))

      matchedAnimeEpisodes.push({
        anime: result.item.entry,
        match: item,
        episode: Number(parsedEntry.episode_number),
        fansubGroupName: parsedEntry.release_group,
      })
    }
  }

  return matchedAnimeEpisodes
}
