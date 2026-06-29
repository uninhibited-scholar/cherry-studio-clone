import React, { useEffect, useRef } from 'react'

// Inject keyframe animation once
function ensurePulseKeyframe(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('skeleton-pulse-style')) return
  const style = document.createElement('style')
  style.id = 'skeleton-pulse-style'
  style.textContent = `
    @keyframes skeleton-pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
  `
  document.head.appendChild(style)
}

const pulseCls = '[animation:skeleton-pulse_1.5s_ease-in-out_infinite] bg-[var(--color-skeleton,rgba(128,128,128,0.15))] rounded-[6px]'

interface SkeletonTextProps {
  lines?: number
  width?: string | number
}

export function SkeletonText({ lines = 3, width }: SkeletonTextProps): React.ReactElement {
  const ref = useRef(false)
  if (!ref.current) { ensurePulseKeyframe(); ref.current = true }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={pulseCls}
          style={{
            height: '14px',
            width: width ?? (i === lines - 1 ? '65%' : '100%'),
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

interface SkeletonBlockProps {
  width?: string | number
  height?: string | number
}

export function SkeletonBlock({ width = '100%', height = '40px' }: SkeletonBlockProps): React.ReactElement {
  useEffect(() => { ensurePulseKeyframe() }, [])
  return (
    <div
      className={pulseCls}
      style={{ width, height }}
    />
  )
}

export function MessageSkeleton(): React.ReactElement {
  useEffect(() => { ensurePulseKeyframe() }, [])
  return (
    <div className="flex flex-col gap-4 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className={`${pulseCls} w-8 h-8 rounded-full shrink-0`} />
          <div className="flex-1">
            <SkeletonText lines={i === 1 ? 1 : 3} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProviderCardSkeleton(): React.ReactElement {
  useEffect(() => { ensurePulseKeyframe() }, [])
  return (
    <div className="p-4 rounded-[10px] border border-[var(--color-border,rgba(128,128,128,0.2))] flex flex-col gap-3">
      <div className="flex gap-3 items-center">
        <div className={`${pulseCls} w-9 h-9 rounded-lg shrink-0`} />
        <SkeletonBlock width="160px" height="16px" />
      </div>
      <SkeletonText lines={2} />
      <SkeletonBlock width="100px" height="28px" />
    </div>
  )
}
