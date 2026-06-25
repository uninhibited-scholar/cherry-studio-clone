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

const pulseStyle: React.CSSProperties = {
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  background: 'var(--color-skeleton, rgba(128,128,128,0.15))',
  borderRadius: '6px'
}

interface SkeletonTextProps {
  lines?: number
  width?: string | number
}

export function SkeletonText({ lines = 3, width }: SkeletonTextProps): React.ReactElement {
  const ref = useRef(false)
  if (!ref.current) { ensurePulseKeyframe(); ref.current = true }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...pulseStyle,
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
      style={{
        ...pulseStyle,
        width,
        height
      }}
    />
  )
}

export function MessageSkeleton(): React.ReactElement {
  useEffect(() => { ensurePulseKeyframe() }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ ...pulseStyle, width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
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
    <div
      style={{
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid var(--color-border, rgba(128,128,128,0.2))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ ...pulseStyle, width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
        <SkeletonBlock width="160px" height="16px" />
      </div>
      <SkeletonText lines={2} />
      <SkeletonBlock width="100px" height="28px" />
    </div>
  )
}
