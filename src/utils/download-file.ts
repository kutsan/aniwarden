import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

export async function downloadFile({
  url,
  folderPath,
  fileName,
}: {
  url: string
  folderPath: string
  fileName: string
}): Promise<void> {
  try {
    if (!fs.existsSync(folderPath)) {
      console.log(`Creating directory: ${folderPath}`)
      fs.mkdirSync(folderPath, { recursive: true })
    }

    const filePath = path.join(folderPath, fileName)

    console.log(`Workspaceing file from: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`,
      )
    }

    if (response.body === null) {
      throw new Error('Response body is null.')
    }

    console.log(`Saving file to: ${filePath}`)

    const fileStream = fs.createWriteStream(filePath)
    await pipeline(response.body, fileStream)

    console.log(`File downloaded successfully to ${filePath}`)
  } catch (error) {
    console.error('Error downloading file:', error)

    if (fs.existsSync(path.join(folderPath, fileName))) {
      try {
        fs.unlinkSync(path.join(folderPath, fileName))
        console.log(
          `Cleaned up partially downloaded file: ${path.join(folderPath, fileName)}`,
        )
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError)
      }
    }
  }
}
