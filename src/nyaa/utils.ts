export function getAnimeSearchQuery({
  title,
  episode,
  fansub,
  quality,
}: {
  title: string
  episode: number
  fansub: string | null
  quality: string
}): string {
  return `${fansub ?? ''} ${title} ${String(episode).padStart(2, '0')} ${quality}`.trim()
}

export function getNyaaSearchUrl({
  query,
  category,
  filter,
}: {
  query: string
  category: string
  filter: string
}): string {
  const baseUrl = 'https://nyaa.si'

  const params = new URLSearchParams({
    page: 'rss',
    c: category,
    f: filter,
    q: query,
    // Not working
    // s: 'seeders', // sort by seeders
    // o: 'desc', // descending order
  })

  const url = new URL(baseUrl)

  url.search = params.toString()

  return url.toString()
}
