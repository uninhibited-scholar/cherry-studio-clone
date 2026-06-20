import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type StorageInfo = {
  dbPath: string
  dbSize: number
  userData: string
}

export function StorageSettings(): React.ReactElement {
  const [info, setInfo] = useState<StorageInfo | null>(null)

  useEffect(() => {
    window.api.invoke(IpcChannel.STORAGE_INFO).then((res) => setInfo(res as StorageInfo))
  }, [])

  const fmt = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const openFolder = (p: string) => window.api.invoke(IpcChannel.OPEN_PATH, p)

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fafafa' }}>Storage</h2>

      {info ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="App Data Folder">
            <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {info.userData}
            </span>
            <button onClick={() => openFolder(info.userData)} style={btnStyle}>Open</button>
          </Row>
          <Row label="Database">
            <span style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace', flex: 1 }}>
              {info.dbPath.split('/').pop()} — {fmt(info.dbSize)}
            </span>
            <button onClick={() => openFolder(info.userData)} style={btnStyle}>Open Folder</button>
          </Row>
        </div>
      ) : (
        <p style={{ color: '#52525b', fontSize: 13 }}>Loading…</p>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #3f3f46', borderRadius: 6,
  color: '#a1a1aa', cursor: 'pointer', fontSize: 12, padding: '4px 12px', flexShrink: 0
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#18181b', borderRadius: 8, border: '1px solid #27272a' }}>
      <span style={{ fontSize: 13, color: '#71717a', width: 130, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}
