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
    <div className="flex flex-col items-center justify-center px-6 py-12 gap-3 text-center">
      {icon && (
        <div className="text-[40px] leading-none">{icon}</div>
      )}
      <div className="font-semibold text-[15px] text-[var(--color-text,#1a1a1a)]">
        {title}
      </div>
      {description && (
        <div className="text-[13px] text-[var(--color-text-secondary,#888)] max-w-[320px] leading-[1.5]">
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-5 py-2 rounded-lg border-none bg-[var(--color-primary,#6366f1)] text-white text-[14px] cursor-pointer font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
