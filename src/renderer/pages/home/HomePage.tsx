import React from 'react'

/**
 * Main chat page.
 *
 * Structure (to be built):
 *   ├── AssistantSidebar   — assistant list + topic list
 *   ├── ChatContent        — message thread + streaming
 *   └── InputBar           — user input, file attach, model picker
 */
export function HomePage(): React.ReactElement {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Assistant + topic sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: '1px solid #27272a',
          padding: 16,
          background: '#09090b',
          color: '#fafafa'
        }}
      >
        <p style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>ASSISTANTS</p>
        <div style={{ color: '#71717a', fontSize: 13 }}>No assistants yet</div>
      </aside>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#71717a'
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
        <p style={{ fontSize: 16 }}>Select an assistant to start chatting</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Chat · Multi-model · Streaming — <em>coming soon</em>
        </p>
      </div>
    </div>
  )
}
