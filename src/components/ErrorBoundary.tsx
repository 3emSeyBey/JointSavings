import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.tabName ? ` ${this.props.tabName}` : ''}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center">
          <p className="text-rose-600 font-bold mb-2">Something went wrong</p>
          <p className="text-slate-500 text-sm mb-4">Try another tab or refresh the page.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
