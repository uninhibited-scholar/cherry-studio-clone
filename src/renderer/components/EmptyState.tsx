import React from 'react'

interface EmptyStateAction {
  label: string
  onClick(): void
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: EmptyStateAction
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
        textAlign: 'center'
      }}
    >
      {icon && (
        <div style={{ fontSize: '40px', lineHeight: 1 }}>{icon}</div>
      )}
      <div
        style={{
          fontWeight: 600,
          fontSize: '15px',
          color: 'var(--color-text, #1a1a1a)'
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary, #888)',
            maxWidth: '320px',
            lineHeight: 1.5
          }}
        >
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '8px',
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--color-primary, #6366f1)',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
