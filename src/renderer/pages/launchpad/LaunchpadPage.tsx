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
    <div className="h-full bg-[rgba(10,0,20,0.60)] flex flex-col items-center justify-center p-10 overflow-auto">
      <h1 className="text-[#fafafa] text-[28px] font-bold mb-2">🍒 Cherry Studio</h1>
      <p className="text-[#71717a] text-[14px] mb-12">Quick launch</p>

      <div
        className="grid gap-6 justify-center"
        style={{ gridTemplateColumns: 'repeat(5, 120px)' }}
      >
        {APPS.map(({ path, icon, label, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-[10px] px-2 py-5 rounded-2xl border-none cursor-pointer transition-[transform,background] duration-[120ms]"
            style={{ background: `${color}22` }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = `${color}44`
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = `${color}22`
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
            }}
          >
            <span className="text-[36px]">{icon}</span>
            <span className="text-[#e4e4e7] text-[12px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
