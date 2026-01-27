import React, { Component, ErrorBoundary as ReactErrorBoundary, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: Component<{ error: Error; errorInfo: React.ErrorInfo }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in component tree and displays a fallback UI
 * Logs errors for debugging and monitoring
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(
    error: Error,
    errorInfo: React.ErrorInfo
  ): ErrorBoundaryState {
    // Log the error with context
    logger.error('React ErrorBoundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    return {
      hasError: true,
      error,
      errorInfo,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // Call custom onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo!} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <svg
                className="h-12 w-12 text-red-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h8m-4-4v4m0 4H4m6 16h.01M12 2a2 2 0 110-2 2 012 2z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    Error Details (Click to expand)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-auto text-gray-700">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {/* Show component stack if available */}
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    Component Stack (Click to expand)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-auto text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Error ID: {Date.now()} • {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} Mode
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary Higher Order Component
 * Wraps components with error boundary handling
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: Component<{ error: Error; errorInfo: React.ErrorInfo }>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * AsyncErrorBoundary Component
 * Handles asynchronous errors (e.g., in useEffect, event handlers)
 */
export class AsyncErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // Log the error
    logger.error('Async ErrorBoundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} errorInfo={this.state.errorInfo!} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <svg
                className="h-12 w-12 text-orange-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2a1 1 0 011-1 1 012 2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12h-4v-2a2 2 0 011-2 2 012 2z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Async Operation Failed</h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                {this.state.error?.message || 'An async operation encountered an error'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    Stack Trace (Click to expand)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-auto text-gray-700">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                The system encountered an asynchronous error. This has been logged for investigation.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
