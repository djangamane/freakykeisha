import React, { useState } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';

/**
 * Development component to test authentication and paywall fixes
 */
const AuthTestPanel = () => {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    syncUsageWithBackend,
    canPerformAnalysis,
    getRemainingUses 
  } = useBiasAuth();
  
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (test, result, details = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, {
      timestamp,
      test,
      result,
      details
    }]);
  };

  const testTokenValidation = async () => {
    setIsLoading(true);
    try {
      // Check if user is guest first
      if (user?.isGuest) {
        addTestResult('Token Validation', 'SKIP', 'Guest user - no token needed');
        return;
      }

      const token = localStorage.getItem('bias_auth_token');
      if (!token) {
        addTestResult('Token Validation', 'FAIL', 'No token found in localStorage');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bias-auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult('Token Validation', 'PASS', `User: ${data.user.email}, Tier: ${data.user.subscription_tier}`);
      } else {
        addTestResult('Token Validation', 'FAIL', (typeof data.error === 'string' ? data.error : data.error?.message || JSON.stringify(data.error)) || 'Unknown error');
      }
    } catch (error) {
      addTestResult('Token Validation', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testUsageSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncUsageWithBackend();

      if (result.success) {
        const message = result.message ?
          `${result.message} - Can analyze: ${result.canAnalyze}` :
          `Can analyze: ${result.canAnalyze}, User tier: ${result.user?.subscription_tier}`;
        addTestResult('Usage Sync', 'PASS', message);
      } else {
        addTestResult('Usage Sync', 'FAIL', typeof result.error === 'string' ? result.error : result.error?.message || JSON.stringify(result.error));
      }
    } catch (error) {
      addTestResult('Usage Sync', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      // Test with demo credentials - replace with actual test account
      const result = await login('test@example.com', 'password123');
      
      if (result.success) {
        addTestResult('Login Test', 'PASS', 'Successfully logged in');
      } else {
        addTestResult('Login Test', 'FAIL', 'Login failed');
      }
    } catch (error) {
      addTestResult('Login Test', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid var(--accent-color)',
      borderRadius: '10px',
      padding: '1rem',
      color: 'var(--text-color)',
      fontSize: '0.8rem',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--accent-color)',
        paddingBottom: '0.5rem'
      }}>
        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>Auth Test Panel</h3>
        <button 
          onClick={clearResults}
          style={{
            background: 'transparent',
            border: '1px solid var(--accent-color)',
            color: 'var(--accent-color)',
            padding: '2px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem'
          }}
        >
          Clear
        </button>
      </div>

      {/* User Status */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0, 255, 255, 0.1)', borderRadius: '5px' }}>
        <strong>Current Status:</strong><br/>
        Authenticated: {isAuthenticated ? '✅' : '❌'}<br/>
        User: {user?.email || 'None'}<br/>
        Tier: {user?.subscription_tier || 'None'}<br/>
        Usage: {user?.daily_usage_count || 0}/{user?.usage_limit || 0}<br/>
        Can Analyze: {canPerformAnalysis() ? '✅' : '❌'}<br/>
        Remaining: {getRemainingUses()}
      </div>

      {/* Test Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testTokenValidation}
          disabled={isLoading}
          style={{
            background: 'var(--accent-color)',
            color: 'black',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '5px',
            marginBottom: '5px',
            fontSize: '0.7rem'
          }}
        >
          Test Token
        </button>
        <button 
          onClick={testUsageSync}
          disabled={isLoading}
          style={{
            background: 'var(--accent-color)',
            color: 'black',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '5px',
            marginBottom: '5px',
            fontSize: '0.7rem'
          }}
        >
          Test Sync
        </button>
        {!isAuthenticated && (
          <button 
            onClick={testLogin}
            disabled={isLoading}
            style={{
              background: 'var(--accent-color)',
              color: 'black',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '5px',
              fontSize: '0.7rem'
            }}
          >
            Test Login
          </button>
        )}
        {isAuthenticated && (
          <button 
            onClick={logout}
            disabled={isLoading}
            style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '5px',
              fontSize: '0.7rem'
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Test Results */}
      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '5px',
        padding: '0.5rem'
      }}>
        <strong>Test Results:</strong>
        {testResults.length === 0 ? (
          <div style={{ fontStyle: 'italic', opacity: 0.7 }}>No tests run yet</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              marginBottom: '0.5rem',
              padding: '0.3rem',
              background: result.result === 'PASS' ? 'rgba(0, 255, 0, 0.1)' : 
                         result.result === 'FAIL' ? 'rgba(255, 0, 0, 0.1)' : 
                         'rgba(255, 255, 0, 0.1)',
              borderRadius: '3px',
              fontSize: '0.7rem'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                [{result.timestamp}] {result.test}: {result.result}
              </div>
              {result.details && (
                <div style={{ opacity: 0.8, marginTop: '2px' }}>
                  {typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuthTestPanel;
