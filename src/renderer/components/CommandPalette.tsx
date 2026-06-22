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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20vh'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#18181b',
          borderRadius: 12,
          border: '1px solid #27272a',
          width: '90%',
          maxWidth: 500,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(0) }}
            placeholder="Type a command…"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fafafa',
              fontSize: 16
            }}
          />
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#52525b', fontSize: 13 }}>
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => { cmd.onSelect(); onClose() }}
                onMouseEnter={() => setSelected(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  border: 'none',
                  background: idx === selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: '#fafafa',
                  cursor: 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderBottom: '1px solid #27272a'
                }}
              >
                {cmd.icon && <span style={{ fontSize: 14 }}>{cmd.icon}</span>}
                <div>
                  <div style={{ fontWeight: 500 }}>{cmd.label}</div>
                  {cmd.description && <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{cmd.description}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
