import anitomy from 'anitomy-js'
import Fuse from 'fuse.js'

import type { UserAnimeEntry } from '../anilist/types.ts'
import { fansubGroups, onlyUseSpecifiedFansubGroups } from '../config.ts'
import { logger } from '../utils/logger.ts'
import { categories, filters } from './constants.ts'
import { parseRssFeed } from './rss-parser.ts'
import type { AnimeEpisodeMatch, NyaaEntry } from './types.ts'
import { getAnimeSearchQuery, getNyaaSearchUrl } from './utils.ts'

async function searchAnimeTitle({
  title,
  episode,
  fansubGroupName,
}: {
  title: string
  episode: number | null
  fansubGroupName: string | null
}): Promise<NyaaEntry[]> {
  const query = getAnimeSearchQuery({
    title,
    episode,
    fansub: fansubGroupName,
    quality: '1080p',
  })

  const searchUrl = getNyaaSearchUrl({
    query,
    category: categories.animeEng,
    filter: filters.none,
  })

  logger.info(`Episode Search URL: ${searchUrl}`)

  const response = await fetch(searchUrl)
  const textContent = await response.text()
  const items = parseRssFeed(textContent)

  return items
}

export async function searchAnimeEpisodes({
  anime,
}: {
  anime: {
    entry: UserAnimeEntry
    episodes: number[]
    fansubGroupName: string | null
  }
}): Promise<AnimeEpisodeMatch[]> {
  logger.info({ anime }, 'Searching for anime episodes…')

  const animeSearch = new Fuse([anime], {
    keys: ['entry.media.title.romaji', 'entry.media.title.english'],
    // threshold: 0.4,
    // includeScore: true,
  })

  const fansubGroupsSet = new Set(fansubGroups)
  const foundAnimeEpisodes = new Set<number>()
  const matchedAnimeEpisodes: AnimeEpisodeMatch[] = []
  let fansubGroupNameToCheck: string | null = anime.fansubGroupName

  const nonEpisodeRomajiItems = await searchAnimeTitle({
    title: anime.entry.media.title.romaji,
    episode: null,
    fansubGroupName: fansubGroupNameToCheck,
  })

  const nonEpisodeEnglishItems =
    anime.entry.media.title.english !== null
      ? await searchAnimeTitle({
          title: anime.entry.media.title.english,
          episode: null,
          fansubGroupName: fansubGroupNameToCheck,
        })
      : []

  for (const episode of anime.episodes) {
    const romajiItems = await searchAnimeTitle({
      title: anime.entry.media.title.romaji,
      episode,
      fansubGroupName: fansubGroupNameToCheck,
    })

    const englishItems =
      anime.entry.media.title.english !== null
        ? await searchAnimeTitle({
            title: anime.entry.media.title.english,
            episode,
            fansubGroupName: fansubGroupNameToCheck,
          })
        : []

    const items = [
      ...romajiItems,
      ...englishItems,
      ...nonEpisodeRomajiItems,
      ...nonEpisodeEnglishItems,
    ]

    if (items.length === 0) {
      logger.info(
        `No results found for "${anime.entry.media.title.romaji}" episode ${episode} fansub "${fansubGroupNameToCheck}".`,
      )
      continue
    }

    // Filter out items with no seeders and sort by seeders
    const sortedItems = items
      .filter((item) => item.seeders > 0)
      .sort((a, b) => b.seeders - a.seeders)

    for (const item of sortedItems) {
      const parsedEntry = anitomy.parseSync(item.title)

      logger.info(
        {
          rssEntry: item,
          parsedEntry,
        },
        'Checking RSS entry…',
      )

      if (
        parsedEntry.anime_title === undefined ||
        parsedEntry.episode_number === undefined ||
        Array.isArray(parsedEntry.episode_number) ||
        parsedEntry.video_resolution !== '1080p'
      ) {
        logger.info(
          { parsedEntry },
          'Skipping RSS entry due to missing or invalid fields.',
        )
        continue
      }

      if (
        parsedEntry.release_group === undefined ||
        (onlyUseSpecifiedFansubGroups &&
          !fansubGroupsSet.has(parsedEntry.release_group))
      ) {
        logger.info(
          {
            parsedEntry,
            config: { onlyUseSpecifiedFansubGroups, fansubGroups },
          },
          'Skipping RSS entry due to missing or invalid fansub group.',
        )
        continue
      }

      if (
        fansubGroupNameToCheck !== null &&
        fansubGroupNameToCheck !== parsedEntry.release_group
      ) {
        logger.info(
          { parsedEntry, fansubGroupNameToCheck },
          'Skipping RSS entry due to fansub group mismatch.',
        )
        continue
      }

      if (foundAnimeEpisodes.has(Number(parsedEntry.episode_number))) {
        logger.info(
          {
            parsedEntry,
            previouslyFoundEpisodes: Array.from(foundAnimeEpisodes),
          },
          'Skipping RSS entry due to already found episode.',
        )
        continue
      }

      const [result] = animeSearch.search(parsedEntry.anime_title)

      if (result === undefined) {
        logger.info('Skipping RSS entry due to no anime match found.')
        continue
      }

      const animeMatch = result.item

      // if (result.score === undefined || result.score > 0.4) {
      //   logger.info(
      //     `Low match score for "${parsedEntry.anime_title}": ${result.score} "${animeMatch.entry.media.title.romaji}"`,
      //   )
      //   continue
      // }

      const episodeSet = new Set(
        animeMatch.episodes.map((episode) => String(episode).padStart(2, '0')),
      )

      const episodeMatch = episodeSet.has(parsedEntry.episode_number)

      if (!episodeMatch) {
        logger.info(
          { parsedEntry, animeMatch, episodeMatch },
          'Skipping RSS entry due to episode mismatch.',
        )
        continue
      }

      fansubGroupNameToCheck ??= parsedEntry.release_group
      foundAnimeEpisodes.add(Number(parsedEntry.episode_number))

      matchedAnimeEpisodes.push({
        anime: animeMatch.entry,
        match: item,
        episode: Number(parsedEntry.episode_number),
        fansubGroupName: parsedEntry.release_group,
      })

      logger.info(
        {
          rssEntry: item,
          animeMatch,
          episode: Number(parsedEntry.episode_number),
          fansubGroupName: parsedEntry.release_group,
        },
        `Found matching episode ${parsedEntry.episode_number} of "${animeMatch.entry.media.title.romaji}" with fansub group "${parsedEntry.release_group}".`,
      )
    }
  }

  return matchedAnimeEpisodes
}
