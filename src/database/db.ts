import { drizzle } from 'drizzle-orm/better-sqlite3'

import { databasePath } from '../config.ts'

export const db = drizzle({
  connection: { source: databasePath, verbose: console.log },
})
