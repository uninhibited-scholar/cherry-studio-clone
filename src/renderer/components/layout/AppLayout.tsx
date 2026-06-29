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
      <aside className="w-16 bg-[#18181b] flex flex-col items-center pt-4 gap-1 shrink-0">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xl no-underline transition-colors duration-150 ${isActive ? 'bg-white/12' : 'bg-transparent hover:bg-white/6'}`
            }
          >
            {icon}
          </NavLink>
        ))}

        {/* Settings pinned at bottom */}
        <div className="flex-1" />
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            `flex items-center justify-center w-12 h-12 rounded-xl text-xl no-underline mb-3 transition-colors duration-150 ${isActive ? 'bg-white/12' : 'bg-transparent hover:bg-white/6'}`
          }
        >
          ⚙️
        </NavLink>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />

        {/* Find in page bar */}
        {findOpen && (
          <div className="absolute top-2 right-4 z-[100] bg-[#18181b] border border-[#3f3f46] rounded-lg flex items-center gap-1.5 px-2.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
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
              className="bg-transparent border-0 outline-none text-[#fafafa] text-sm w-[200px]"
            />
            <span className="text-[10px] text-[#52525b]">Enter↵ · Esc</span>
            <button onClick={closeFindBar} className="bg-transparent border-0 text-[#71717a] cursor-pointer p-0.5">✕</button>
          </div>
        )}
      </main>
    </div>
  )
}
