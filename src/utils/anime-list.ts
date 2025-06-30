import type { UserAnimeEntry } from '../anilist/types.ts'

export function getEpisodesToDownload({
  downloadedEpisodes,
  lastWatchedEpisode,
  lastAiredEpisode,
}: {
  downloadedEpisodes: number[]
  lastWatchedEpisode: number
  lastAiredEpisode: number
}): number[] {
  const episodesToDownload: number[] = []

  const downloadedSet = new Set(downloadedEpisodes)

  for (let i = lastWatchedEpisode + 1; i <= lastAiredEpisode; i++) {
    if (downloadedSet.has(i)) {
      continue
    }

    episodesToDownload.push(i)
  }
  return episodesToDownload
}

export function getLastEpisodeNumberToDownload({
  item,
}: {
  item: UserAnimeEntry
}): number | null {
  const { totalEpisodes, nextAiringEpisode } = item.media
  const lastWatchedEpisode = item.progress
  const lastAiredEpisode =
    nextAiringEpisode !== null ? nextAiringEpisode - 1 : null

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
}
