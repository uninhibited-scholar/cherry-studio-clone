import React from 'react'

const isMac = navigator.platform.toLowerCase().includes('mac')
const mod = isMac ? '⌘' : 'Ctrl'
const shift = isMac ? '⇧' : 'Shift'

const SHORTCUTS: Array<{ shortcut: string; action: string }> = [
  { shortcut: `${mod}+N`, action: 'New topic' },
  { shortcut: `${mod}+K`, action: 'Command palette' },
  { shortcut: `${mod}+,`, action: 'Settings' },
  { shortcut: `${mod}+F`, action: 'Find in page' },
  { shortcut: `${mod}+${shift}+Space`, action: 'Quick assistant' },
  { shortcut: `${mod}+${shift}+A`, action: 'Selection assistant' },
  { shortcut: `${mod}+=`, action: 'Zoom in' },
  { shortcut: `${mod}+-`, action: 'Zoom out' },
  { shortcut: `${mod}+0`, action: 'Reset zoom' },
  { shortcut: 'Escape', action: 'Close / dismiss' }
]

export function KeyboardSettings() {
  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Keyboard Shortcuts</h2>
      <p style={{ marginBottom: 20, opacity: 0.6, fontSize: 13 }}>
        Shortcuts are fixed and cannot be customized in this version.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', opacity: 0.5, fontWeight: 500 }}>
              Shortcut
            </th>
            <th style={{ textAlign: 'left', padding: '8px 12px', opacity: 0.5, fontWeight: 500 }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map(({ shortcut, action }) => (
            <tr key={shortcut} style={{ borderTop: '1px solid rgba(128,128,128,0.15)' }}>
              <td style={{ padding: '10px 12px' }}>
                <kbd
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(128,128,128,0.12)',
                    fontFamily: 'monospace',
                    fontSize: 13
                  }}>
                  {shortcut}
                </kbd>
              </td>
              <td style={{ padding: '10px 12px' }}>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
