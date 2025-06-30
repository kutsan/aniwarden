import path from 'node:path'
import { pino } from 'pino'
import pretty from 'pino-pretty'

import { logsPath } from '../config.ts'

const rollTransport = pino.transport({
  target: 'pino-roll',
  options: {
    file: path.join(logsPath, 'aniwarden'),
    extension: '.log',
    dateFormat: 'yyyy-MM-dd',
    mkdir: true,
    frequency: 'daily',
    limit: { count: 7 },
    symlink: true,
    compress: 'gzip',
  },
}) as pino.DestinationStream

export const logger = pino(
  {
    level: 'debug',
  },
  pino.multistream([
    {
      stream: pretty(),
    },
    {
      stream: rollTransport,
    },
  ]),
)

logger.info('Initialized logger.')
