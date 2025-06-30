import anitomy from 'anitomy-js'
import Fuse from 'fuse.js'

import type { UserAnimeEntry } from '../anilist/index.ts'
import { fansubGroups, onlyUseSpecifiedFansubGroups } from '../config.ts'
import { logger } from '../utils/logger.ts'
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

  logger.info(`Check new episodes on: ${searchUrl}`)

  const response = await fetch(searchUrl)
  const textContent = await response.text()
  const items = parseRssFeed(textContent)

  // Filter out items with no seeders and sort by seeders
  const sortedItems = items
    .filter((item) => item.seeders > 0)
    .sort((a, b) => b.seeders - a.seeders)

  const animeSearch = new Fuse(animelist, {
    keys: ['entry.media.title.romaji', 'entry.media.title.english'],
    // threshold: 0.4,
    // includeScore: true,
  })

  const fansubGroupsSet = new Set(fansubGroups)
  const foundAnimeEpisodes: Record<UserAnimeEntry['media']['id'], number[]> = {}
  const matchedAnimeEpisodes: AnimeEpisodeMatch[] = []

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
        { parsedEntry, config: { onlyUseSpecifiedFansubGroups, fansubGroups } },
        'Skipping RSS entry due to missing or invalid fansub group.',
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
    //     `Low match score for "${parsedEntry.anime_title}": ${result.score} "${matchingAnime.entry.media.title.romaji}"`,
    //   )
    //   continue
    // }

    if (
      animeMatch.fansubGroupName !== null &&
      animeMatch.fansubGroupName !== parsedEntry.release_group
    ) {
      logger.info(
        { parsedEntry, animeMatch },
        'Skipping RSS entry due to fansub group mismatch.',
      )
      continue
    }

    const animeId = animeMatch.entry.media.id

    const previouslyFoundEpisodes = new Set(foundAnimeEpisodes[animeId] ?? [])

    if (previouslyFoundEpisodes.has(Number(parsedEntry.episode_number))) {
      logger.info(
        { parsedEntry, previouslyFoundEpisodes },
        'Skipping RSS entry due to already found episode.',
      )
      continue
    }

    const episodeSet = new Set(animeMatch.episodes)

    const episodeMatch = episodeSet.has(Number(parsedEntry.episode_number))

    if (!episodeMatch) {
      logger.info(
        { parsedEntry, animeMatch, episodeMatch },
        'Skipping RSS entry due to episode mismatch.',
      )
      continue
    }

    foundAnimeEpisodes[animeId] ??= []
    foundAnimeEpisodes[animeId].push(Number(parsedEntry.episode_number))

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

  return matchedAnimeEpisodes
}
