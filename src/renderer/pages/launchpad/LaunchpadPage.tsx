import React from 'react'
import { useNavigate } from 'react-router-dom'

const APPS = [
  { path: '/chat',      icon: '💬', label: 'Chat',       color: '#2563eb' },
  { path: '/agents',    icon: '🤖', label: 'Agents',     color: '#7c3aed' },
  { path: '/knowledge', icon: '📚', label: 'Knowledge',  color: '#059669' },
  { path: '/paintings', icon: '🎨', label: 'Paintings',  color: '#db2777' },
  { path: '/translate', icon: '🌐', label: 'Translate',  color: '#0891b2' },
  { path: '/notes',     icon: '📝', label: 'Notes',      color: '#d97706' },
  { path: '/library',   icon: '📖', label: 'Library',    color: '#65a30d' },
  { path: '/history',   icon: '🕐', label: 'History',    color: '#6b7280' },
  { path: '/mini-apps', icon: '🧩', label: 'Mini Apps',  color: '#9333ea' },
  { path: '/settings',  icon: '⚙️',  label: 'Settings',  color: '#374151' },
]

export function LaunchpadPage(): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div
      style={{
        height: '100%',
        background: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        overflow: 'auto'
      }}
    >
      <h1 style={{ color: '#fafafa', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>🍒 Cherry Studio</h1>
      <p style={{ color: '#71717a', fontSize: 14, marginBottom: 48 }}>Quick launch</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 120px)',
          gap: 24,
          justifyContent: 'center'
        }}
      >
        {APPS.map(({ path, icon, label, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '20px 8px',
              borderRadius: 16,
              border: 'none',
              background: `${color}22`,
              cursor: 'pointer',
              transition: 'transform 0.12s, background 0.12s'
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = `${color}44`
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = `${color}22`
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: 36 }}>{icon}</span>
            <span style={{ color: '#e4e4e7', fontSize: 12, fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
