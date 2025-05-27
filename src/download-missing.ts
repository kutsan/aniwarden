import { getUserAnimeList } from './anilist/index.ts'
import { downloadPath, username } from './config.ts'
import {
  getDownloadedEpisodes,
  getFansubGroupName,
  saveDownloadedEpisode,
  saveFansubGroup,
} from './database/index.ts'
import { searchAnimeEpisodes } from './nyaa/index.ts'
import { getEpisodesToDownload } from './utils/anime-list.ts'
import { downloadFile } from './utils/download-file.ts'

export async function downloadMissingEpisodes(): Promise<void> {
  const animelist = await getUserAnimeList(username)

  // const airedEpisodesToDownload: Array<{
  //   entry: UserAnimeEntry
  //   episodes: number[]
  // }> = []

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

    const episodesToDownload = getEpisodesToDownload({
      downloadedEpisodes,
      lastAiredEpisode: lastAiredEpisodeParameter,
      lastWatchedEpisode,
    })

    if (episodesToDownload.length === 0) {
      continue
    }

    console.log(
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
}
