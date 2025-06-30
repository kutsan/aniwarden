import { drizzle } from 'drizzle-orm/better-sqlite3'

import { databasePath } from '../config.ts'
import { logger } from '../utils/logger.ts'

export const db = drizzle({
  connection: {
    source: databasePath,
    verbose: (message) => {
      logger.info(`Running database query: "${String(message)}"`)
    },
  },
})
