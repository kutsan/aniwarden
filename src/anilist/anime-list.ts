import { client } from './client.ts'
import { MediaListCollectionDocument } from './queries.ts'
import { MediaListCollectionSchema } from './schemas.ts'
import type { UserAnimeEntry } from './types.ts'

export async function getCurrentAnimeList(
  userId: number,
): Promise<UserAnimeEntry[]> {
  const result = await client.request({
    document: MediaListCollectionDocument,
    variables: {
      type: 'ANIME',
      statuses: ['CURRENT'],
      userId,
    },
  })

  const parsedResult = MediaListCollectionSchema.safeParse(result)

  if (!parsedResult.success) {
    throw new Error('Invalid response from Anilist API')
  }

  const { lists } = parsedResult.data.MediaListCollection

  return lists.flatMap((list) =>
    list.entries.map(
      (entry) =>
        ({
          progress: entry.progress,
          media: {
            id: entry.media.id,
            title: {
              romaji: entry.media.title.romaji,
              english: entry.media.title.english,
            },
            status: entry.media.status,
            totalEpisodes: entry.media.episodes,
            nextAiringEpisode: entry.media.nextAiringEpisode?.episode ?? null,
          },
        }) satisfies UserAnimeEntry,
    ),
  )
}
