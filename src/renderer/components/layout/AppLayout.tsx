import React from 'react'
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
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
