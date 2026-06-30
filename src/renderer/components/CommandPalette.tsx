import React, { useState, useEffect } from 'react'

export type Command = {
  id: string
  label: string
  description?: string
  icon?: string
  onSelect: () => void
}

type Props = {
  commands: Command[]
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ commands, isOpen, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (isOpen) setSearch('')
    setSelected(0)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected((i) => Math.min(i + 1, filtered.length - 1))
      if (e.key === 'ArrowUp') setSelected((i) => Math.max(i - 1, 0))
      if (e.key === 'Enter') {
        filtered[selected]?.onSelect()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selected, search, onClose]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = commands.filter(
    (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1000] flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(240,171,252,0.10)] w-[90%] max-w-[500px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
      >
        <div className="px-4 py-3 border-b border-[#27272a]">
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(0) }}
            placeholder="Type a command…"
            className="w-full bg-transparent border-none outline-none text-[#fafafa] text-[16px]"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-5 text-center text-[#52525b] text-[13px]">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.onSelect(); onClose() }}
                onMouseEnter={() => setSelected(idx)}
                className={`w-full text-left px-4 py-[10px] border-none text-[#fafafa] cursor-pointer text-[13px] flex items-center gap-[10px] border-b border-[#27272a] ${idx === selected ? 'bg-white/8' : 'bg-transparent'}`}
              >
                {cmd.icon && <span className="text-[14px]">{cmd.icon}</span>}
                <div>
                  <div className="font-medium">{cmd.label}</div>
                  {cmd.description && <div className="text-[11px] text-[#71717a] mt-[2px]">{cmd.description}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
