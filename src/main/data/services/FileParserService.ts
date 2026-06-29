import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import AdmZip from 'adm-zip'

export class FileParserService {
  async parse(filePath: string): Promise<string> {
    const ext = extname(filePath).toLowerCase()

    switch (ext) {
      case '.txt':
      case '.md':
        return readFile(filePath, 'utf-8')

      case '.json': {
        const raw = await readFile(filePath, 'utf-8')
        try {
          return JSON.stringify(JSON.parse(raw), null, 2)
        } catch {
          return raw
        }
      }

      case '.csv':
        return readFile(filePath, 'utf-8')

      case '.pdf':
        return this.parsePdf(filePath)

      case '.docx':
      case '.doc':
        return this.parseDocx(filePath)

      default:
        return readFile(filePath, 'utf-8').catch(() => '[Binary file — cannot extract text]')
    }
  }

  private async parsePdf(filePath: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
    pdfjsLib.GlobalWorkerOptions.workerSrc = false
    const data = await readFile(filePath)
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise
    const pages: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item: { str: string }) => item.str).join(' ')
      pages.push(text)
    }
    return pages.join('\n\n')
  }

  private async parseDocx(filePath: string): Promise<string> {
    const zip = new AdmZip(filePath)
    const entry = zip.getEntry('word/document.xml')
    if (!entry) return '[Could not read DOCX: word/document.xml not found]'
    const xml = entry.getData().toString('utf-8')
    // Strip XML tags, collapse whitespace, decode common entities
    return xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()
  }
}

export const fileParserService = new FileParserService()
