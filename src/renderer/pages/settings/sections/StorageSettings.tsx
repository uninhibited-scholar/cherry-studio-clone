import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type StorageInfo = {
  dbPath: string
  dbSize: number
  userData: string
}

export function StorageSettings(): React.ReactElement {
  const [info, setInfo] = useState<StorageInfo | null>(null)
  const [cacheSize, setCacheSize] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)

  const loadInfo = useCallback(async () => {
    const [storageRes, cacheBytes] = await Promise.all([
      window.api.invoke(IpcChannel.STORAGE_INFO),
      window.api.invoke(IpcChannel.APP_CACHE_SIZE)
    ])
    setInfo(storageRes as StorageInfo)
    setCacheSize(cacheBytes as number)
  }, [])

  useEffect(() => { loadInfo() }, [loadInfo])

  const clearCache = async () => {
    setClearing(true)
    try {
      await window.api.invoke(IpcChannel.APP_CACHE_CLEAR)
      setCacheSize(0)
    } finally {
      setClearing(false)
    }
  }

  const fmt = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const openFolder = (p: string) => window.api.invoke(IpcChannel.OPEN_PATH, p)

  return (
    <div>
      <h2 className="text-[16px] font-semibold mb-4 text-[#fafafa]">Storage</h2>

      {info ? (
        <div className="flex flex-col gap-3">
          <Row label="App Data Folder">
            <span className="text-[12px] text-[#a1a1aa] font-mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {info.userData}
            </span>
            <button onClick={() => openFolder(info.userData)} className={btnCls}>Open</button>
          </Row>
          <Row label="Database">
            <span className="text-[12px] text-[#a1a1aa] font-mono flex-1">
              {info.dbPath.split('/').pop()} — {fmt(info.dbSize)}
            </span>
            <button onClick={() => openFolder(info.userData)} className={btnCls}>Open Folder</button>
          </Row>
          <Row label="Browser Cache">
            <span className="text-[12px] text-[#a1a1aa] flex-1">
              {cacheSize !== null ? fmt(cacheSize) : '…'}
            </span>
            <button
              onClick={clearCache}
              disabled={clearing || cacheSize === 0}
              className={`${btnCls} ${clearing ? 'text-[#52525b] border-[#27272a]' : 'text-[#f87171] border-[#7f1d1d]'}`}
            >
              {clearing ? 'Clearing…' : 'Clear Cache'}
            </button>
          </Row>
        </div>
      ) : (
        <p className="text-[#52525b] text-[13px]">Loading…</p>
      )}
    </div>
  )
}

const btnCls = 'bg-none border border-[#3f3f46] rounded-[6px] text-[#a1a1aa] cursor-pointer text-[12px] px-3 py-1 shrink-0'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-[14px] py-[10px] bg-[#18181b] rounded-lg border border-[#27272a]">
      <span className="text-[13px] text-[#71717a] w-[130px] shrink-0">{label}</span>
      {children}
    </div>
  )
}
