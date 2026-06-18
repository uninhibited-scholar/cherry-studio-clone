import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/chat',       icon: '💬', label: 'Chat' },
  { to: '/agents',     icon: '🤖', label: 'Agents' },
  { to: '/knowledge',  icon: '📚', label: 'Knowledge' },
  { to: '/paintings',  icon: '🎨', label: 'Paintings' },
  { to: '/translate',  icon: '🌐', label: 'Translate' },
  { to: '/notes',      icon: '📝', label: 'Notes' },
  { to: '/library',    icon: '📖', label: 'Library' },
  { to: '/history',    icon: '🕐', label: 'History' },
  { to: '/files',      icon: '📁', label: 'Files' },
  { to: '/mini-apps',  icon: '🧩', label: 'Mini Apps' },
  { to: '/launchpad',  icon: '🚀', label: 'Launchpad' },
] as const

export function AppLayout(): React.ReactElement {
  const [findOpen, setFindOpen] = useState(false)
  const [findText, setFindText] = useState('')
  const findInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => { setFindOpen(true); setTimeout(() => findInputRef.current?.focus(), 50) }
    window.addEventListener('app:find-in-page', handler)
    return () => window.removeEventListener('app:find-in-page', handler)
  }, [])

  const closeFindBar = () => { setFindOpen(false); setFindText('') }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 64,
          background: '#18181b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 4,
          flexShrink: 0
        }}
      >
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 10,
              fontSize: 20,
              textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition: 'background 0.15s'
            })}
          >
            {icon}
          </NavLink>
        ))}

        {/* Settings pinned at bottom */}
        <div style={{ flexGrow: 1 }} />
        <NavLink
          to="/settings"
          title="Settings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 10,
            fontSize: 20,
            textDecoration: 'none',
            marginBottom: 12,
            background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent'
          })}
        >
          ⚙️
        </NavLink>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Outlet />

        {/* Find in page bar */}
        {findOpen && (
          <div style={{
            position: 'absolute', top: 8, right: 16, zIndex: 100,
            background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                // Use browser's built-in find-in-page via window.find (Chrome/Electron)
                if (e.target.value) (window as unknown as Record<string, unknown>).find?.(e.target.value, false, false, true, false, true, false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeFindBar()
                if (e.key === 'Enter') (window as unknown as Record<string, unknown>).find?.(findText, e.shiftKey, false, true, false, true, false)
              }}
              placeholder="Find in page…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fafafa', fontSize: 13, width: 200 }}
            />
            <span style={{ fontSize: 10, color: '#52525b' }}>Enter↵ · Esc</span>
            <button onClick={closeFindBar} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 2 }}>✕</button>
          </div>
        )}
      </main>
    </div>
  )
}
