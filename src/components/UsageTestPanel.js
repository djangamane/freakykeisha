import React from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import { useUsageEnforcement } from '../hooks/useUsageEnforcement';
import './LandingPage.css';

/**
 * Testing panel for usage enforcement functionality
 * This component should be removed in production
 */
const UsageTestPanel = () => {
  const { user, updateUsage } = useBiasAuth();
  const { 
    getUsageStatus, 
    simulateUsage, 
    resetUsageForTesting, 
    showPaywallModal,
    executeWithUsageCheck 
  } = useUsageEnforcement();

  if (!user) return null;

  const usageStatus = getUsageStatus();

  const handleTestAnalysis = async () => {
    const result = await executeWithUsageCheck(async () => {
      // Simulate a successful analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: { message: 'Test analysis completed' }
      };
    });

    console.log('Test analysis result:', result);
  };

  const handleSetUsageToLimit = () => {
    if (user.usage_limit) {
      updateUsage(user.usage_limit);
    }
  };

  const handleSetUsageNearLimit = () => {
    if (user.usage_limit) {
      updateUsage(Math.max(0, user.usage_limit - 1));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid var(--accent-color)',
      borderRadius: '10px',
      padding: '1rem',
      minWidth: '300px',
      zIndex: 1000,
      fontSize: '0.8rem'
    }}>
      <h4 style={{
        color: 'var(--accent-color)',
        fontFamily: 'Orbitron, sans-serif',
        margin: '0 0 1rem 0',
        textAlign: 'center'
      }}>
        Usage Test Panel
      </h4>

      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ color: 'var(--matrix-green)' }}>Current Status:</strong>
        <div style={{ color: 'var(--text-color)', marginLeft: '1rem' }}>
          <div>Tier: {usageStatus.tierName}</div>
          <div>Usage: {usageStatus.usageCount}/{usageStatus.isUnlimited ? '∞' : usageStatus.usageLimit}</div>
          <div>Remaining: {usageStatus.remaining}</div>
          <div>Can Analyze: {usageStatus.canAnalyze ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={simulateUsage}
          style={{
            background: 'var(--matrix-green)',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Simulate Usage (+1)
        </button>

        <button
          onClick={resetUsageForTesting}
          style={{
            background: 'var(--accent-color)',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Reset Usage (0)
        </button>

        <button
          onClick={handleSetUsageNearLimit}
          style={{
            background: 'orange',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Set Near Limit
        </button>

        <button
          onClick={handleSetUsageToLimit}
          style={{
            background: 'var(--primary-color)',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Set To Limit
        </button>

        <button
          onClick={showPaywallModal}
          style={{
            background: '#ff6666',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Show Paywall
        </button>

        <button
          onClick={handleTestAnalysis}
          style={{
            background: 'var(--secondary-color)',
            color: 'var(--background-color)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Test Analysis Flow
        </button>
      </div>

      <div style={{
        marginTop: '1rem',
        fontSize: '0.7rem',
        color: 'var(--text-color)',
        opacity: 0.7,
        textAlign: 'center'
      }}>
        Development Testing Only
      </div>
    </div>
  );
};

export default UsageTestPanel;