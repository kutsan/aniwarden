import { getUserAnimeList } from './anilist/index.ts'
import { downloadPath, username } from './config.ts'
import {
  getDownloadedEpisodes,
  getFansubGroupName,
  saveDownloadedEpisode,
  saveFansubGroup,
} from './database/index.ts'
import { searchAnimeEpisodes } from './nyaa/index.ts'
import {
  getEpisodesToDownload,
  getLastEpisodeNumberToDownload,
} from './utils/anime-list.ts'
import { downloadFile } from './utils/download-file.ts'
import { logger } from './utils/logger.ts'

export async function downloadMissingEpisodes(): Promise<void> {
  logger.info('Checking for missing episodes to download...')

  const animelist = await getUserAnimeList(username)

  // const airedEpisodesToDownload: Array<{
  //   entry: UserAnimeEntry
  //   episodes: number[]
  // }> = []

  for (const item of animelist) {
    if (
      item.media.status !== 'RELEASING' &&
      item.progress <
        (item.media.totalEpisodes ?? item.media.nextAiringEpisode ?? 0) - 1
    ) {
      logger.info(
        `Skipping anime ${item.media.title.english} as it is not currently airing.`,
      )
      continue
    }

    const downloadedEpisodes = await getDownloadedEpisodes(item.media.id)

    const lastWatchedEpisode = item.progress
    const lastAiredEpisode = getLastEpisodeNumberToDownload({ item })

    if (lastAiredEpisode === null) {
      logger.info(
        `Skipping anime ${item.media.title.english} as it has no aired episodes.`,
      )
      continue
    }

    const episodesToDownload = getEpisodesToDownload({
      downloadedEpisodes,
      lastAiredEpisode,
      lastWatchedEpisode,
    })

    if (episodesToDownload.length === 0) {
      continue
    }

    logger.info(
      `Found missing episodes to download for anime ${item.media.title.english}`,
    )

    const fansubGroupName = await getFansubGroupName(item.media.id)

    const matches = await searchAnimeEpisodes({
      anime: {
        entry: item,
        episodes: episodesToDownload,
        fansubGroupName,
      },
    })

    if (matches.length === 0) {
      logger.info('No matches found for missing episodes.')
      return
    }

    for (const match of matches) {
      const fileName = `${match.match.title}.torrent`

      const downloadResult = await downloadFile({
        url: match.match.link,
        folderPath: downloadPath,
        fileName,
      })

      if (!downloadResult) {
        logger.error(
          `Failed to download episode ${match.episode} of ${match.anime.media.title.romaji}`,
        )
        continue
      }

      logger.info(
        `Downloaded episode ${match.episode} of ${match.anime.media.title.romaji}`,
        downloadResult,
      )

      await saveDownloadedEpisode({
        animeId: match.anime.media.id,
        episodeNumber: match.episode,
      })

      const fansubGroupName = await getFansubGroupName(match.anime.media.id)

      if (fansubGroupName === null && match.fansubGroupName !== null) {
        await saveFansubGroup({
          animeId: match.anime.media.id,
          groupName: match.fansubGroupName,
        })
      }
    }
  }
}
