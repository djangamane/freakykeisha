import React from 'react';
import './LandingPage.css';

const LoadingState = ({ 
  message = 'Loading...', 
  subMessage = null,
  size = 'medium',
  showSpinner = true,
  className = ''
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  return (
    <div className={`loading-container ${sizeClasses[size]} ${className}`}>
      {showSpinner && <div className="loading-spinner" />}
      
      <div className="loading-text">{message}</div>
      
      {subMessage && (
        <div className="loading-subtext">{subMessage}</div>
      )}
    </div>
  );
};

// Specialized loading components for different contexts
export const AuthLoadingState = ({ isLogin = true }) => (
  <LoadingState
    message={isLogin ? 'Signing in...' : 'Creating account...'}
    subMessage="Please wait while we authenticate you"
    size="medium"
  />
);

export const AnalysisLoadingState = ({ stage = 'analyzing' }) => {
  const messages = {
    analyzing: {
      message: 'AI is analyzing your article...',
      subMessage: 'Examining content for bias patterns and generating translation (this may take up to 30 seconds)'
    },
    translating: {
      message: 'Processing results...',
      subMessage: 'Finalizing analysis and translation'
    },
    processing: {
      message: 'Processing results...',
      subMessage: 'Finalizing analysis and preparing display'
    }
  };

  const { message, subMessage } = messages[stage] || messages.analyzing;

  return (
    <LoadingState
      message={message}
      subMessage={subMessage}
      size="large"
    />
  );
};

export const PaymentLoadingState = () => (
  <LoadingState
    message="Processing payment..."
    subMessage="Redirecting to payment provider"
    size="medium"
  />
);

export const UsageLoadingState = () => (
  <LoadingState
    message="Checking usage limits..."
    subMessage="Validating your subscription status"
    size="small"
  />
);

// Skeleton loading component for content placeholders
export const SkeletonLoader = ({ 
  lines = 3, 
  width = '100%', 
  height = '1rem',
  className = '' 
}) => (
  <div className={`skeleton-container ${className}`}>
    {Array.from({ length: lines }, (_, index) => (
      <div
        key={index}
        className="skeleton-line"
        style={{
          width: index === lines - 1 ? '70%' : width,
          height: height,
          marginBottom: '0.5rem'
        }}
      />
    ))}
  </div>
);

// Loading overlay for full-screen loading states
export const LoadingOverlay = ({ 
  isVisible, 
  message = 'Loading...', 
  subMessage = null,
  onCancel = null 
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <LoadingState
          message={message}
          subMessage={subMessage}
          size="large"
        />
        
        {onCancel && (
          <button 
            className="loading-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingState;