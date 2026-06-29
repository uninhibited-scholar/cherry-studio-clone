import React, { useEffect, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

interface UpdateInfo {
  version: string
}

interface DownloadProgress {
  percent: number
}

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded'

export function UpdateBanner(): React.ReactElement | null {
  const [state, setState] = useState<UpdateState>('idle')
  const [version, setVersion] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const offAvailable = window.api.on(IpcChannel.UPDATE_AVAILABLE, (...args) => {
      const info = args[0] as UpdateInfo
      setVersion(info.version)
      setState('available')
    })

    const offProgress = window.api.on(IpcChannel.UPDATE_DOWNLOAD_PROGRESS, (...args) => {
      const prog = args[0] as DownloadProgress
      setProgress(prog.percent)
      setState('downloading')
    })

    const offDownloaded = window.api.on(IpcChannel.UPDATE_DOWNLOADED, (...args) => {
      const info = args[0] as UpdateInfo
      setVersion(info.version)
      setState('downloaded')
    })

    return () => {
      offAvailable()
      offProgress()
      offDownloaded()
    }
  }, [])

  if (state === 'idle' || dismissed) return null

  const handleDownload = () => {
    window.api.invoke(IpcChannel.UPDATE_DOWNLOAD)
  }

  const handleInstall = () => {
    window.api.invoke(IpcChannel.UPDATE_INSTALL)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[var(--accent,#7c3aed)] text-white px-4 py-2 flex items-center gap-3 text-[13px]">
      {state === 'available' && (
        <>
          <span>Update available: v{version}</span>
          <button
            onClick={handleDownload}
            className="bg-white/20 border-none rounded text-white px-[10px] py-[2px] cursor-pointer"
          >
            Download
          </button>
        </>
      )}
      {state === 'downloading' && (
        <>
          <span>Downloading update… {Math.round(progress)}%</span>
          <div className="flex-1 max-w-[200px] h-1 bg-white/30 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
      {state === 'downloaded' && (
        <>
          <span>v{version} ready to install</span>
          <button
            onClick={handleInstall}
            className="bg-white/20 border-none rounded text-white px-[10px] py-[2px] cursor-pointer"
          >
            Restart to install
          </button>
        </>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto bg-transparent border-none text-white cursor-pointer text-[16px] leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
