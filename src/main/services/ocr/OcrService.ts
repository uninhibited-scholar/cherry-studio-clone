import path from 'node:path'
import { loggerService } from '@logger'

const logger = loggerService.withContext('OcrService')

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif'])

export class OcrService {
  async extractText(imagePath: string): Promise<string> {
    const ext = path.extname(imagePath).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported image format: ${ext}`)
    }

    logger.info(`OCR start: ${imagePath}`)

    // Dynamic import to avoid loading tesseract at startup
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          logger.info(`OCR progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })

    try {
      const { data } = await worker.recognize(imagePath)
      logger.info(`OCR complete: ${imagePath} (${data.text.length} chars)`)
      return data.text
    } finally {
      await worker.terminate()
    }
  }
}

export const ocrService = new OcrService()
