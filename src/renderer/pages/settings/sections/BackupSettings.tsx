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

  const btn: React.CSSProperties = {
    padding: '9px 20px', borderRadius: 6, border: 'none',
    cursor: 'pointer', fontSize: 13, fontWeight: 500
  }

  return (
    <div>
      <h2 style={{ color: '#fafafa', fontSize: 18, marginBottom: 4 }}>Backup & Restore</h2>
      <p style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>
        Export your providers, assistants, topics, messages, and notes to a JSON file; restore them from any backup.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '20px 24px' }}>
          <p style={{ color: '#fafafa', fontWeight: 500, margin: '0 0 6px' }}>Export Backup</p>
          <p style={{ color: '#71717a', fontSize: 12, margin: '0 0 16px' }}>
            All your data will be saved to a single JSON file you can keep as a snapshot or transfer to another machine.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ ...btn, background: '#2563eb', color: 'white', opacity: exporting ? 0.6 : 1 }}
          >
            {exporting ? 'Exporting…' : '↓ Export Backup'}
          </button>
        </div>

        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '20px 24px' }}>
          <p style={{ color: '#fafafa', fontWeight: 500, margin: '0 0 6px' }}>Restore from Backup</p>
          <p style={{ color: '#71717a', fontSize: 12, margin: '0 0 6px' }}>
            Imports providers, assistants, and notes from a previously exported JSON file. Existing data is not erased.
          </p>
          <p style={{ color: '#ef4444', fontSize: 11, margin: '0 0 16px' }}>
            ⚠ Restart the app after importing to see all changes reflected.
          </p>
          <button
            onClick={handleImport}
            disabled={importing}
            style={{ ...btn, background: '#18181b', color: '#fafafa', border: '1px solid #3f3f46', opacity: importing ? 0.6 : 1 }}
          >
            {importing ? 'Importing…' : '↑ Import Backup…'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          marginTop: 20, padding: '10px 16px', borderRadius: 8,
          background: message.ok ? '#14532d' : '#450a0a',
          border: `1px solid ${message.ok ? '#16a34a' : '#dc2626'}`,
          color: message.ok ? '#4ade80' : '#f87171', fontSize: 13
        }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
