import { eq } from 'drizzle-orm'

import { db } from './db.ts'
import { downloadsTable, fansubGroupsTable } from './schema.ts'

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

export async function saveFansubGroup({
  animeId,
  groupName,
}: {
  animeId: number
  groupName: string
}): Promise<void> {
  await db.insert(fansubGroupsTable).values({
    animeId,
    groupName,
  })
}

export async function getFansubGroupName(
  animeId: number,
): Promise<string | null> {
  const groups = await db
    .select()
    .from(fansubGroupsTable)
    .where(eq(fansubGroupsTable.animeId, animeId))
  const [group] = groups

  if (group === undefined) {
    return null
  }

  return group.groupName
}
