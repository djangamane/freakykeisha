import React from 'react';
import './LandingPage.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to analytics service if available
    if (window.AnalyticsService) {
      window.AnalyticsService.trackError('component_error', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        retry_count: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const { fallback: CustomFallback, showDetails = false } = this.props;

      // If a custom fallback is provided, use it
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            
            <h2 className="error-title">Something went wrong</h2>
            
            <p className="error-message">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>

            {showDetails && error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <div className="error-stack">
                  <strong>Error:</strong> {error.message}
                  <br />
                  <strong>Stack:</strong>
                  <pre>{error.stack}</pre>
                  {errorInfo && (
                    <>
                      <strong>Component Stack:</strong>
                      <pre>{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={this.handleRetry}
                disabled={retryCount >= 3}
              >
                {retryCount >= 3 ? 'Max Retries Reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
              </button>
              
              <button 
                className="reload-button"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            {retryCount >= 3 && (
              <div className="error-help">
                <p>If the problem persists, try:</p>
                <ul>
                  <li>Refreshing the page</li>
                  <li>Clearing your browser cache</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;