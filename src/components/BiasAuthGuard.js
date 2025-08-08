import React, { useState, useEffect } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import BiasAuthModal from './BiasAuthModal';

/**
 * Authentication guard component for bias detection features
 * Ensures user is authenticated before allowing access to protected content
 */
const BiasAuthGuard = ({ children, requireAuth = true, fallback = null }) => {
  const {
    isAuthenticated,
    sessionRestored,
    user,
    checkDailyReset
  } = useBiasAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check daily reset when component mounts or user changes
  useEffect(() => {
    if (user) {
      checkDailyReset();
    }
  }, [user, checkDailyReset]);

  // Show loading while session is being restored
  if (!sessionRestored) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: 'var(--text-color)',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  // If authentication is not required, render children directly
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If user is not authenticated, show auth modal or fallback
  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }

    return (
      <div style={{ position: 'relative', minHeight: '60vh', overflow: 'hidden' }}>
        {/* Matrix Video Background */}
        <video autoPlay loop muted playsInline className="matrix-bg-video">
          <source src="/matrix.mp4" type="video/mp4" />
        </video>

        {/* Foreground Content */}
        <div className="matrix-bg-overlay" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          textAlign: 'center',
          color: 'var(--text-color)',
          padding: '2rem'
        }}>
          <h2 style={{
            fontFamily: 'Orbitron, sans-serif',
            color: 'var(--primary-color)',
            marginBottom: '1rem'
          }}>
            Authentication Required
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            Please sign in or continue as a guest to use the bias detection service.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              background: 'linear-gradient(135deg, var(--accent-color), #0099cc)',
              color: 'var(--background-color)',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '25px',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Sign In / Get Started
          </button>
        </div>

        <BiasAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => setShowAuthModal(false)}
          onGuestMode={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

/**
 * Higher-order component for protecting routes/components
 */
export const withBiasAuth = (WrappedComponent, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <BiasAuthGuard {...options}>
        <WrappedComponent {...props} />
      </BiasAuthGuard>
    );
  };
};

/**
 * Hook for checking authentication status and usage limits
 */
export const useBiasAuthGuard = () => {
  const { 
    isAuthenticated, 
    user, 
    canPerformAnalysis, 
    getRemainingUses,
    requireAuth 
  } = useBiasAuth();

  const checkUsageLimit = () => {
    if (!isAuthenticated) {
      return {
        canProceed: false,
        reason: 'authentication_required',
        message: 'Please sign in to continue'
      };
    }

    if (!canPerformAnalysis()) {
      const remaining = getRemainingUses();
      return {
        canProceed: false,
        reason: 'usage_limit_exceeded',
        message: `Daily limit reached. ${remaining === 'unlimited' ? 'Unlimited' : remaining} uses remaining.`,
        remaining
      };
    }

    return {
      canProceed: true,
      remaining: getRemainingUses()
    };
  };

  const executeWithAuth = (callback) => {
    return requireAuth(callback);
  };

  return {
    isAuthenticated,
    user,
    canPerformAnalysis,
    getRemainingUses,
    checkUsageLimit,
    executeWithAuth
  };
};

export default BiasAuthGuard;