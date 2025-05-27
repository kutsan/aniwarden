import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const downloadsTable = sqliteTable('downloads', {
  id: int().primaryKey({ autoIncrement: true }),
  animeId: int('anime_id').notNull(),
  episodeNumber: int('episode_number').notNull(),
})

export const fansubGroupsTable = sqliteTable('fansub_groups', {
  id: int().primaryKey({ autoIncrement: true }),
  animeId: int('anime_id').notNull().unique(),
  groupName: text('group_name').notNull(),
})
