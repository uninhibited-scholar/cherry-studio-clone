import React, { useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

export function BackupSettings(): React.ReactElement {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  function flash(text: string, ok: boolean) {
    setMessage({ text, ok })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const path = await window.api.invoke(IpcChannel.BACKUP_EXPORT) as string | null
      if (path) flash(`Saved to ${path}`, true)
    } catch (err) {
      flash(String(err), false)
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    setImporting(true)
    try {
      const result = await window.api.invoke(IpcChannel.BACKUP_IMPORT) as { success: boolean; reason?: string }
      if (result.success) flash('Import successful. Restart the app to see all changes.', true)
      else if (result.reason !== 'Cancelled') flash(`Import failed: ${result.reason}`, false)
    } catch (err) {
      flash(String(err), false)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <h2 className="text-[#fafafa] text-[18px] mb-1">Backup & Restore</h2>
      <p className="text-[#71717a] text-[13px] mb-7">
        Export your providers, assistants, topics, messages, and notes to a JSON file; restore them from any backup.
      </p>

      <div className="flex flex-col gap-4">
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] px-6 py-5">
          <p className="text-[#fafafa] font-medium mb-[6px]">Export Backup</p>
          <p className="text-[#71717a] text-[12px] mb-4">
            All your data will be saved to a single JSON file you can keep as a snapshot or transfer to another machine.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-5 py-[9px] rounded-[6px] border-none bg-[#2563eb] text-white cursor-pointer text-[13px] font-medium ${exporting ? 'opacity-60' : ''}`}
          >
            {exporting ? 'Exporting…' : '↓ Export Backup'}
          </button>
        </div>

        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] px-6 py-5">
          <p className="text-[#fafafa] font-medium mb-[6px]">Restore from Backup</p>
          <p className="text-[#71717a] text-[12px] mb-[6px]">
            Imports providers, assistants, and notes from a previously exported JSON file. Existing data is not erased.
          </p>
          <p className="text-[#ef4444] text-[11px] mb-4">
            ⚠ Restart the app after importing to see all changes reflected.
          </p>
          <button
            onClick={handleImport}
            disabled={importing}
            className={`px-5 py-[9px] rounded-[6px] border border-[rgba(240,171,252,0.15)] bg-[rgba(255,255,255,0.04)] text-[#fafafa] cursor-pointer text-[13px] font-medium ${importing ? 'opacity-60' : ''}`}
          >
            {importing ? 'Importing…' : '↑ Import Backup…'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-5 px-4 py-[10px] rounded-lg text-[13px] border ${message.ok ? 'bg-[#14532d] border-[#16a34a] text-[#4ade80]' : 'bg-[#450a0a] border-[#dc2626] text-[#f87171]'}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
