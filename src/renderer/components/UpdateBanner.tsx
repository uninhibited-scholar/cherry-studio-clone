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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--accent, #7c3aed)',
        color: '#fff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px'
      }}
    >
      {state === 'available' && (
        <>
          <span>Update available: v{version}</span>
          <button
            onClick={handleDownload}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '2px 10px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
        </>
      )}
      {state === 'downloading' && (
        <>
          <span>Downloading update… {Math.round(progress)}%</span>
          <div
            style={{
              flex: 1,
              maxWidth: '200px',
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#fff',
                transition: 'width 0.2s'
              }}
            />
          </div>
        </>
      )}
      {state === 'downloaded' && (
        <>
          <span>v{version} ready to install</span>
          <button
            onClick={handleInstall}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '2px 10px',
              cursor: 'pointer'
            }}
          >
            Restart to install
          </button>
        </>
      )}
      <button
        onClick={() => setDismissed(true)}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
