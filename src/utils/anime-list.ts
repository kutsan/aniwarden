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
