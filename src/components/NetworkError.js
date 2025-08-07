import React, { useState, useEffect } from 'react';
import { getNetworkStatus, addNetworkListener, testConnectivity } from '../utils/networkUtils';
import './LandingPage.css';

const NetworkError = ({ 
  error, 
  onRetry, 
  showConnectivityTest = true,
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastConnectivityTest, setLastConnectivityTest] = useState(null);

  useEffect(() => {
    const removeListener = addNetworkListener(setIsOnline);
    return removeListener;
  }, []);

  const handleConnectivityTest = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await testConnectivity();
      setLastConnectivityTest({
        timestamp: Date.now(),
        result: isConnected
      });
    } catch (error) {
      console.error('Connectivity test failed:', error);
      setLastConnectivityTest({
        timestamp: Date.now(),
        result: false
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const getErrorMessage = () => {
    if (!isOnline) {
      return "You appear to be offline. Please check your internet connection and try again.";
    }

    if (error?.message?.includes('timeout')) {
      return "The request timed out. This might be due to a slow connection or server issues.";
    }

    if (error?.message?.includes('fetch')) {
      return "Unable to connect to our servers. Please check your connection and try again.";
    }

    return error?.message || "A network error occurred. Please check your connection and try again.";
  };

  const getHelpText = () => {
    if (!isOnline) {
      return [
        "Check your WiFi or mobile data connection",
        "Try moving to an area with better signal",
        "Restart your router if using WiFi",
        "Contact your internet service provider if issues persist"
      ];
    }

    return [
      "Refresh the page and try again",
      "Check if other websites are working",
      "Try again in a few minutes",
      "Contact support if the problem continues"
    ];
  };

  return (
    <div className={`network-error-container ${className}`}>
      <div className="network-error-icon">
        {isOnline ? '🌐' : '📡'}
      </div>
      
      <h3 className="network-error-title">
        {isOnline ? 'Connection Problem' : 'No Internet Connection'}
      </h3>
      
      <p className="network-error-message">
        {getErrorMessage()}
      </p>

      {/* Network Status Indicator */}
      <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
        <span className="status-indicator">
          {isOnline ? '🟢' : '🔴'}
        </span>
        {isOnline ? 'Online' : 'Offline'}
      </div>

      {/* Connectivity Test Results */}
      {lastConnectivityTest && (
        <div className="connectivity-test-result">
          <small>
            Last connectivity test: {' '}
            <span style={{ 
              color: lastConnectivityTest.result ? 'var(--matrix-green)' : '#ff6666' 
            }}>
              {lastConnectivityTest.result ? 'Success' : 'Failed'}
            </span>
            {' '}({new Date(lastConnectivityTest.timestamp).toLocaleTimeString()})
          </small>
        </div>
      )}

      {/* Action Buttons */}
      <div className="network-error-actions">
        <button 
          className="retry-network-button"
          onClick={handleRetry}
          disabled={!isOnline}
        >
          Try Again
        </button>

        {showConnectivityTest && (
          <button 
            className="retry-network-button"
            onClick={handleConnectivityTest}
            disabled={isTestingConnection}
            style={{ 
              background: isTestingConnection 
                ? 'rgba(128, 128, 128, 0.5)' 
                : 'linear-gradient(135deg, var(--accent-color), #0099cc)' 
            }}
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="network-error-help">
        <p><strong>Try these steps:</strong></p>
        <ul>
          {getHelpText().map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>

      {/* Technical Details (for debugging) */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="network-error-details">
          <summary>Technical Details (Development)</summary>
          <pre>{JSON.stringify({
            message: error.message,
            name: error.name,
            stack: error.stack,
            isNetworkError: error.isNetworkError,
            attempts: error.attempts,
            navigator: {
              onLine: navigator.onLine,
              connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
              } : 'Not available'
            }
          }, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

// Higher-order component to wrap components with network error handling
export const withNetworkErrorHandling = (WrappedComponent) => {
  return function NetworkErrorWrapper(props) {
    const [networkError, setNetworkError] = useState(null);

    const handleNetworkError = (error) => {
      setNetworkError(error);
    };

    const handleRetry = () => {
      setNetworkError(null);
      if (props.onRetry) {
        props.onRetry();
      }
    };

    if (networkError) {
      return (
        <NetworkError 
          error={networkError}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <WrappedComponent 
        {...props}
        onNetworkError={handleNetworkError}
      />
    );
  };
};

export default NetworkError;