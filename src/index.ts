import { downloadAiringEpisodes } from './download-airing.ts'
import { downloadMissingEpisodes } from './download-missing.ts'

await downloadAiringEpisodes()

await downloadMissingEpisodes()

console.log('All downloads completed.')
