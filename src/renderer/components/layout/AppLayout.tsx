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
  { to: '/search',     icon: '🔎', label: 'Search' },
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-16 flex flex-col items-center pt-4 gap-1 shrink-0 relative z-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          borderRight: '1px solid rgba(240,171,252,0.09)',
        }}
      >
        {/* App logo mark */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3d0f6e, #9333ea)',
            boxShadow: '0 0 14px rgba(196,132,252,0.40)',
          }}
        >
          🌸
        </div>

        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className="relative flex flex-col items-center justify-center w-11 h-11 rounded-xl text-xl no-underline transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(147,51,234,0.20)' : 'transparent',
              boxShadow: isActive ? '0 0 0 1px rgba(196,132,252,0.25)' : 'none',
              opacity: isActive ? 1 : 0.72,
              filter: isActive ? 'none' : 'brightness(1.1)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #c084fc, #e879f9)' }}
                  />
                )}
                {icon}
              </>
            )}
          </NavLink>
        ))}

        {/* Settings pinned at bottom */}
        <div className="flex-1" />
        <NavLink
          to="/settings"
          title="Settings"
          className="relative flex items-center justify-center w-11 h-11 rounded-xl text-xl no-underline mb-3 transition-all duration-150"
          style={({ isActive }) => ({
            background: isActive ? 'rgba(147,51,234,0.20)' : 'transparent',
            boxShadow: isActive ? '0 0 0 1px rgba(196,132,252,0.25)' : 'none',
            opacity: isActive ? 1 : 0.72,
            filter: isActive ? 'none' : 'brightness(1.1)',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #c084fc, #e879f9)' }}
                />
              )}
              ⚙️
            </>
          )}
        </NavLink>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />

        {/* Find in page bar */}
        {findOpen && (
          <div
            className="absolute top-2 right-4 z-[100] rounded-xl flex items-center gap-1.5 px-3 py-2"
            style={{
              background: 'rgba(20,5,40,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(196,132,252,0.22)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                if (e.target.value) (window as unknown as Record<string, unknown>).find?.(e.target.value, false, false, true, false, true, false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeFindBar()
                if (e.key === 'Enter') (window as unknown as Record<string, unknown>).find?.(findText, e.shiftKey, false, true, false, true, false)
              }}
              placeholder="Find in page…"
              className="bg-transparent border-0 outline-none text-sm w-[200px]"
              style={{ color: '#fafafa' }}
            />
            <span className="text-[10px]" style={{ color: '#52525b' }}>Enter↵ · Esc</span>
            <button
              onClick={closeFindBar}
              className="bg-transparent border-0 cursor-pointer p-0.5"
              style={{ color: '#71717a' }}
            >✕</button>
          </div>
        )}
      </main>
    </div>
  )
}
