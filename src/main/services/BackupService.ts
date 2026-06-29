import { dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'

const APP_VERSION = app.getVersion()

export class BackupService {
  private getUserDataPath(): string {
    return app.getPath('userData')
  }

  async export(): Promise<{ success: boolean; path?: string; error?: string }> {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `cherry-studio-backup-${new Date().toISOString().slice(0, 10)}.cherry`,
      filters: [{ name: 'Cherry Studio Backup', extensions: ['cherry'] }]
    })
    if (canceled || !filePath) return { success: false, error: 'Cancelled' }

    try {
      const zip = new AdmZip()
      const userDataPath = this.getUserDataPath()

      // Add manifest
      const manifest = {
        version: APP_VERSION,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        platform: process.platform
      }
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'))

      // Add db file
      const dbPath = path.join(userDataPath, 'cherry-clone.db')
      if (fs.existsSync(dbPath)) {
        zip.addLocalFile(dbPath, '', 'cherry-clone.db')
      }

      // Add paintings directory
      const paintingsDir = path.join(userDataPath, 'paintings')
      if (fs.existsSync(paintingsDir)) {
        zip.addLocalFolder(paintingsDir, 'paintings')
      }

      // Add notes directory
      const notesDir = path.join(userDataPath, 'notes')
      if (fs.existsSync(notesDir)) {
        zip.addLocalFolder(notesDir, 'notes')
      }

      zip.writeZip(filePath)
      return { success: true, path: filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async import(): Promise<{ success: boolean; error?: string }> {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'Cherry Studio Backup', extensions: ['cherry'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths[0]) return { success: false, error: 'Cancelled' }

    try {
      const zip = new AdmZip(filePaths[0])

      // Read and validate manifest
      const manifestEntry = zip.getEntry('manifest.json')
      if (!manifestEntry) return { success: false, error: 'Invalid backup: missing manifest.json' }

      const manifest = JSON.parse(manifestEntry.getData().toString('utf8')) as {
        version: string
        schemaVersion: number
      }

      if (manifest.schemaVersion !== 1) {
        return { success: false, error: `Unsupported backup schema version: ${manifest.schemaVersion}` }
      }

      const userDataPath = this.getUserDataPath()

      // Restore db file
      const dbEntry = zip.getEntry('cherry-clone.db')
      if (dbEntry) {
        const dbPath = path.join(userDataPath, 'cherry-clone.db')
        // Back up existing db first
        if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, dbPath + '.bak')
        }
        zip.extractEntryTo(dbEntry, userDataPath, false, true)
      }

      // Restore paintings
      const paintingsDir = path.join(userDataPath, 'paintings')
      if (!fs.existsSync(paintingsDir)) fs.mkdirSync(paintingsDir, { recursive: true })
      const paintingEntries = zip.getEntries().filter((e) => e.entryName.startsWith('paintings/') && !e.isDirectory)
      for (const entry of paintingEntries) {
        const destPath = path.join(userDataPath, entry.entryName)
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
        fs.writeFileSync(destPath, entry.getData())
      }

      // Restore notes
      const notesDir = path.join(userDataPath, 'notes')
      if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true })
      const notesEntries = zip.getEntries().filter((e) => e.entryName.startsWith('notes/') && !e.isDirectory)
      for (const entry of notesEntries) {
        const destPath = path.join(userDataPath, entry.entryName)
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
        fs.writeFileSync(destPath, entry.getData())
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}

export const backupService = new BackupService()
