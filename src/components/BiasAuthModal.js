import React, { useState } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import { AuthLoadingState } from './LoadingState';
import NetworkError from './NetworkError';
import ErrorBoundary from './ErrorBoundary';
import './LandingPage.css'; // Reuse existing styling

const BiasAuthModal = ({ isOpen, onClose, onAuthSuccess, onGuestMode }) => {
  const { login, register, enterGuestMode, isLoading, error } = useBiasAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation (only for registration)
    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general auth error
    if (authError) {
      setAuthError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setAuthError('');

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password);
      }

      if (result.success) {
        onAuthSuccess();
      } else {
        setAuthError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError(error.message || 'Authentication failed. Please try again.');
    }
  };

  const handleRetryAuth = () => {
    setAuthError('');
    // Clear form errors as well
    setErrors({});
  };

  const handleGuestMode = () => {
    const result = enterGuestMode();
    if (result.success) {
      onGuestMode();
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setAuthError('');
  };

  return (
    <ErrorBoundary>
      <div className="login-modal-overlay" style={{ position: 'fixed' }}>
        {/* Matrix Background Video */}
        <video autoPlay loop muted playsInline className="matrix-bg-video">
          <source src="/matrix.mp4" type="video/mp4" />
        </video>

        {/* Modal Content */}
        <div className="login-modal matrix-bg-overlay">
          <div className="login-modal-header">
            <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <AuthLoadingState isLogin={isLogin} />
          )}

          {/* Network Error Display */}
          {(authError || error) && authError?.includes('connect') && (
            <NetworkError
              error={{ message: authError || (typeof error === 'string' ? error : error?.message || 'Connection error') }}
              onRetry={handleRetryAuth}
              className="auth-network-error"
            />
          )}

          {/* General Error Display */}
          {(authError || error) && !authError?.includes('connect') && (
            <div className="error-message">
              {authError || (typeof error === 'string' ? error : error?.message || 'An error occurred')}
            </div>
          )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={handleGuestMode}
            style={{
              background: 'linear-gradient(135deg, var(--matrix-green), #00aa00)',
              color: 'var(--background-color)',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '25px',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Continue as Guest (3 free uses/day)
          </button>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderRadius: '10px',
          border: '1px solid var(--accent-color)',
          fontSize: '0.85rem',
          color: 'var(--text-color)',
          textAlign: 'center'
        }}>
          <strong style={{ color: 'var(--accent-color)' }}>Guest Mode:</strong> Try our bias detection service with 3 free analyses per day.
          No account required - we track usage by IP address.
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default BiasAuthModal;