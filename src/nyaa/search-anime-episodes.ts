import anitomy from 'anitomy-js'
import Fuse from 'fuse.js'

import type { UserAnimeEntry } from '../anilist/types.ts'
import { fansubGroups, onlyUseSpecifiedFansubGroups } from '../config.ts'
import { categories, filters } from './constants.ts'
import { parseRssFeed } from './rss-parser.ts'
import type { AnimeEpisodeMatch } from './types.ts'
import { getAnimeSearchQuery, getNyaaSearchUrl } from './utils.ts'

export async function searchAnimeEpisodes({
  anime,
  fansub,
}: {
  anime: {
    entry: UserAnimeEntry
    episodes: number[]
    fansubGroupName: string | null
  }
  fansub: string | null
}): Promise<AnimeEpisodeMatch[]> {
  const animeSearch = new Fuse([anime], {
    keys: ['entry.media.title.romaji', 'entry.media.title.english'],
  })

  const fansubGroupsSet = new Set(fansubGroups)
  const foundAnimeEpisodes = new Set<number>()
  const matchedAnimeEpisodes: AnimeEpisodeMatch[] = []
  let fansubGroupNameToCheck: string | null = anime.fansubGroupName

  for (const episode of anime.episodes) {
    const query = getAnimeSearchQuery({
      title: anime.entry.media.title.romaji,
      episode,
      fansub,
      quality: '1080p',
    })

    const searchUrl = getNyaaSearchUrl({
      query,
      category: categories.animeEng,
      filter: filters.none,
    })

    console.log('Episode Search URL:', searchUrl)

    const response = await fetch(searchUrl)
    const textContent = await response.text()
    const items = parseRssFeed(textContent)

    // Filter out items with no seeders and sort by seeders
    const sortedItems = items
      .filter((item) => item.seeders > 0)
      .sort((a, b) => b.seeders - a.seeders)

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

      if (
        fansubGroupNameToCheck !== null &&
        fansubGroupNameToCheck !== parsedEntry.release_group
      ) {
        continue
      }

      if (foundAnimeEpisodes.has(Number(parsedEntry.episode_number))) {
        continue
      }

      const [result] = animeSearch.search(parsedEntry.anime_title)

      if (result === undefined) {
        continue
      }

      const episodeSet = new Set(
        result.item.episodes.map((episode) => String(episode).padStart(2, '0')),
      )

      const episodeMatch = episodeSet.has(parsedEntry.episode_number)
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
        fansubGroupNameToCheck ??= parsedEntry.release_group
        foundAnimeEpisodes.add(Number(parsedEntry.episode_number))

        matchedAnimeEpisodes.push({
          anime: result.item.entry,
          match: item,
          episode: Number(parsedEntry.episode_number),
          fansubGroupName: parsedEntry.release_group,
        })
      }
    }
  }

  return matchedAnimeEpisodes
}
