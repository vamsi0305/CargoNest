import { Component, type ErrorInfo, type ReactNode } from 'react'

import { reportFrontendError } from '../../lib/monitoring'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportFrontendError({
      source: 'react_error_boundary',
      message: error.message || 'React render error',
      stack: error.stack ?? '',
      componentStack: info.componentStack ?? '',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-canvas">
          <section className="form-sheet">
            Something went wrong while rendering this screen. Please refresh the page and try again.
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
