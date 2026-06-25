/**
 * FileParserService — extract plain text from common file types.
 *
 * Supported: .txt, .md, .json, .csv
 * Not supported: .pdf (requires heavy native deps — skipped for now)
 * All other types are returned as-is.
 */

import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

export class FileParserService {
  /**
   * Parse a file at `filePath` and return its text content.
   * Throws if the file cannot be read.
   */
  async parse(filePath: string): Promise<string> {
    const ext = extname(filePath).toLowerCase()
    const raw = await readFile(filePath, 'utf-8')

    switch (ext) {
      case '.txt':
      case '.md':
        return raw

      case '.json':
        try {
          return JSON.stringify(JSON.parse(raw), null, 2)
        } catch {
          // Not valid JSON — return raw so the content is not lost
          return raw
        }

      case '.csv':
        // Keep CSV as-is; BM25 tokenisation handles comma-separated values well
        return raw

      default:
        // .pdf and binary formats are not supported — return raw string
        // (caller should validate extension before calling parse)
        return raw
    }
  }
}

export const fileParserService = new FileParserService()
