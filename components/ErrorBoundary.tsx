import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Enhanced error logging with more details
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    console.error('Unhandled UI error captured by ErrorBoundary:', errorDetails);
    
    // Try to log to backend if available
    try {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorDetails)
      }).catch(() => {
        // Silently fail if backend logging fails
      });
    } catch (e) {
      // Silently fail if fetch fails
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">An unexpected error occurred in the UI. Please refresh the page. If the problem persists, check the browser console and backend logs.</p>
            <pre className="text-xs text-left overflow-auto max-h-40 bg-slate-100 p-2 rounded">
              {String(this.state.error || '')}
            </pre>
            <div className="mt-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-500 text-white rounded">Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
