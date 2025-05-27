import { z } from 'zod'

export const UserIdSchema = z.object({
  User: z.object({
    id: z.number(),
  }),
})

export const MediaStatusSchema = z.enum([
  'FINISHED',
  'RELEASING',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS',
])

export const MediaListCollectionSchema = z.object({
  MediaListCollection: z.object({
    lists: z.array(
      z.object({
        name: z.string(),
        entries: z.array(
          z.object({
            progress: z.number(),
            media: z.object({
              id: z.number(),
              status: MediaStatusSchema,
              episodes: z.number().nullable(),
              nextAiringEpisode: z
                .object({
                  episode: z.number(),
                })
                .nullable(),
              title: z.object({
                romaji: z.string(),
                english: z.string().nullable(),
              }),
            }),
          }),
        ),
      }),
    ),
  }),
})
