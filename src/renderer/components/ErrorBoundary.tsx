import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
          <div className="text-[40px]">⚠️</div>
          <div className="font-semibold text-[16px] text-[var(--color-text,#1a1a1a)]">
            Something went wrong
          </div>
          {this.state.error && (
            <div className="text-[12px] text-[var(--color-text-secondary,#666)] max-w-[400px] break-words">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleRetry}
            className="px-5 py-2 rounded-lg border-none bg-[var(--color-primary,#6366f1)] text-white text-[14px] cursor-pointer font-medium"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
