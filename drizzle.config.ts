import { defineConfig } from 'drizzle-kit'

import { databasePath } from './src/config.ts'

export default defineConfig({
  out: './drizzle',
  dialect: 'sqlite',
  schema: './src/database/schema.ts',
  dbCredentials: {
    url: databasePath,
  },
})
