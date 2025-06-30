import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { logger } from './logger.ts'

export async function downloadFile({
  url,
  folderPath,
  fileName,
}: {
  url: string
  folderPath: string
  fileName: string
}): Promise<boolean> {
  try {
    if (!fs.existsSync(folderPath)) {
      logger.info(`Creating directory: ${folderPath}`)
      fs.mkdirSync(folderPath, { recursive: true })
    }

    const filePath = path.join(folderPath, fileName)

    logger.info(`Workspaceing file from: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`,
      )
    }

    if (response.body === null) {
      throw new Error('Response body is null.')
    }

    logger.info(`Saving file to: ${filePath}`)

    const fileStream = fs.createWriteStream(filePath)
    await pipeline(response.body, fileStream)

    logger.info(`File downloaded successfully to ${filePath}`)
    return true
  } catch (error) {
    logger.error('Error downloading file:', error)

    if (fs.existsSync(path.join(folderPath, fileName))) {
      try {
        fs.unlinkSync(path.join(folderPath, fileName))
        logger.info(
          `Cleaned up partially downloaded file: ${path.join(folderPath, fileName)}`,
        )
      } catch (cleanupError) {
        logger.error('Error cleaning up file:', cleanupError)
      }
    }

    return false
  }
}
