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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            gap: '16px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '40px' }}>⚠️</div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text, #1a1a1a)' }}>
            Something went wrong
          </div>
          {this.state.error && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary, #666)',
                maxWidth: '400px',
                wordBreak: 'break-word'
              }}
            >
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleRetry}
            style={{
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
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
