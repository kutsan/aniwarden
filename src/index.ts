import { downloadAiringEpisodes } from './download-airing.ts'
import { downloadMissingEpisodes } from './download-missing.ts'
import { logger } from './utils/logger.ts'

await downloadAiringEpisodes()

await downloadMissingEpisodes()

logger.info('Process completed.')
