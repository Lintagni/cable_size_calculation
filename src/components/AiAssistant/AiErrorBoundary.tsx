import { Component } from 'react'
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class AiErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[AiErrorBoundary] caught:', error)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 32, textAlign: 'center',
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            AI Assistant encountered an error
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 380 }}>
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.reset}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--ink)', color: 'var(--bg)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
