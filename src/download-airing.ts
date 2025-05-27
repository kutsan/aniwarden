import { type UserAnimeEntry, getUserAnimeList } from './anilist/index.ts'
import { downloadPath, username } from './config.ts'
import {
  getDownloadedEpisodes,
  getFansubGroupName,
  saveDownloadedEpisode,
  saveFansubGroup,
} from './database/index.ts'
import { checkNewEpisodes } from './nyaa/index.ts'
import { getEpisodesToDownload } from './utils/anime-list.ts'
import { downloadFile } from './utils/download-file.ts'

export async function downloadAiringEpisodes(): Promise<void> {
  const animelist = await getUserAnimeList(username)

  const airedEpisodesToDownload: Array<{
    entry: UserAnimeEntry
    episodes: number[]
    fansubGroupName: string | null
  }> = []

  for (const item of animelist) {
    if (item.media.status !== 'RELEASING') {
      continue
    }

    const downloadedEpisodes = await getDownloadedEpisodes(item.media.id)

    const { totalEpisodes, nextAiringEpisode } = item.media
    const lastWatchedEpisode = item.progress
    const lastAiredEpisode =
      nextAiringEpisode !== null ? nextAiringEpisode - 1 : null

    const lastAiredEpisodeParameter = (() => {
      if (lastAiredEpisode !== null) {
        if (lastWatchedEpisode < lastAiredEpisode) {
          return lastAiredEpisode
        }

        return null
      }

      if (totalEpisodes !== null && lastWatchedEpisode < totalEpisodes) {
        return totalEpisodes
      }

      return null
    })()

    if (lastAiredEpisodeParameter === null) {
      continue
    }

    const fansubGroupName = await getFansubGroupName(item.media.id)

    const episodesToDownload = getEpisodesToDownload({
      downloadedEpisodes,
      lastAiredEpisode: lastAiredEpisodeParameter,
      lastWatchedEpisode,
    })

    if (episodesToDownload.length > 0) {
      airedEpisodesToDownload.push({
        entry: item,
        episodes: episodesToDownload,
        fansubGroupName,
      })
    }
  }

  if (airedEpisodesToDownload.length === 0) {
    console.log('No new episodes to download')
    return
  }

  console.log(
    `Found ${airedEpisodesToDownload.length} anime with new episodes to download`,
  )

  const matches = await checkNewEpisodes({
    animelist: airedEpisodesToDownload,
  })

  if (matches.length === 0) {
    console.log('No new episodes found')
    return
  }

  console.log(
    `Downloading ${matches.length} anime matching the list`,
    JSON.stringify(matches, null, 2),
  )

  for (const match of matches) {
    const fileName = `${match.match.title}.torrent`

    await downloadFile({
      url: match.match.link,
      folderPath: downloadPath,
      fileName,
    })

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
