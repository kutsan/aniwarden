import { eq } from 'drizzle-orm'

import { db } from './db.ts'
import { downloadsTable } from './schema.ts'

export async function saveDownloadedEpisode({
  animeId,
  episodeNumber,
}: {
  animeId: number
  episodeNumber: number
}): Promise<void> {
  await db.insert(downloadsTable).values({
    animeId,
    episodeNumber,
  })
}

export async function getDownloadedEpisodes(
  animeId: number,
): Promise<number[]> {
  const episodes = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.animeId, animeId))
  return episodes.map((episode) => episode.episodeNumber)
}
