import { int, sqliteTable } from 'drizzle-orm/sqlite-core'

export const downloadsTable = sqliteTable('downloads', {
  id: int().primaryKey({ autoIncrement: true }),
  animeId: int('anime_id').notNull(),
  episodeNumber: int('episode_number').notNull(),
})
