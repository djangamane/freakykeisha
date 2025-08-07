import React, { useEffect } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import './LandingPage.css';

const UsageTracker = ({ showUpgradeModal }) => {
  const { user, getRemainingUses, canPerformAnalysis, checkDailyReset } = useBiasAuth();

  // Check for daily reset when component mounts or user changes
  useEffect(() => {
    if (user) {
      checkDailyReset();
    }
  }, [user, checkDailyReset]);

  if (!user) return null;

  const remaining = getRemainingUses();
  const isUnlimited = remaining === 'unlimited';
  const canAnalyze = canPerformAnalysis();

  const getTierDisplayName = (tier) => {
    switch (tier) {
      case 'guest':
        return 'Guest';
      case 'free':
        return 'Free';
      case 'monthly':
        return 'Monthly';
      case 'annual':
        return 'Annual';
      default:
        return 'Unknown';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'guest':
        return 'var(--matrix-green)';
      case 'free':
        return 'var(--accent-color)';
      case 'monthly':
        return 'var(--primary-color)';
      case 'annual':
        return '#ffa500';
      default:
        return 'var(--text-color)';
    }
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      border: `2px solid ${getTierColor(user.subscription_tier)}`,
      borderRadius: '15px',
      padding: '1.5rem',
      margin: '1rem 0',
      textAlign: 'center',
      boxShadow: `0 5px 15px rgba(${user.subscription_tier === 'annual' ? '255, 165, 0' : '0, 255, 255'}, 0.2)`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{
            fontFamily: 'Orbitron, sans-serif',
            color: getTierColor(user.subscription_tier),
            margin: '0 0 0.5rem 0',
            fontSize: '1.2rem',
            textShadow: `0 0 5px ${getTierColor(user.subscription_tier)}`
          }}>
            {getTierDisplayName(user.subscription_tier)} Plan
          </h3>
          {user.isGuest && (
            <p style={{
              color: 'var(--text-color)',
              fontSize: '0.8rem',
              margin: 0,
              opacity: 0.8
            }}>
              IP-based tracking
            </p>
          )}
        </div>

        <div style={{
          textAlign: 'right'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: canAnalyze ? 'var(--matrix-green)' : 'var(--primary-color)',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: `0 0 5px ${canAnalyze ? 'var(--matrix-green)' : 'var(--primary-color)'}`
          }}>
            {isUnlimited ? '∞' : remaining}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-color)',
            opacity: 0.8
          }}>
            {isUnlimited ? 'Unlimited' : 'uses left today'}
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: 'var(--text-color)', fontSize: '0.9rem' }}>
            Today's Usage:
          </span>
          <span style={{ 
            color: 'var(--accent-color)', 
            fontWeight: 'bold',
            fontFamily: 'Orbitron, sans-serif'
          }}>
            {user.daily_usage_count} / {isUnlimited ? '∞' : user.usage_limit}
          </span>
        </div>

        {!isUnlimited && (
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((user.daily_usage_count / user.usage_limit) * 100, 100)}%`,
              height: '100%',
              background: canAnalyze 
                ? 'linear-gradient(90deg, var(--matrix-green), var(--accent-color))'
                : 'linear-gradient(90deg, var(--primary-color), #ff6666)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {!canAnalyze && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid #ff4444',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{
            color: '#ff6666',
            margin: '0 0 1rem 0',
            fontSize: '0.9rem'
          }}>
            Daily limit reached! Upgrade for more analyses.
          </p>
          
          {showUpgradeModal && (
            <button
              onClick={showUpgradeModal}
              style={{
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                color: 'var(--text-color)',
                border: 'none',
                padding: '0.8rem 1.5rem',
                borderRadius: '20px',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {user.subscription_tier === 'guest' && canAnalyze && (
        <div style={{
          background: 'rgba(0, 255, 255, 0.1)',
          border: '1px solid var(--accent-color)',
          borderRadius: '10px',
          padding: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-color)'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong style={{ color: 'var(--accent-color)' }}>Guest Mode:</strong> 
            Create an account to save your analysis history and get more daily uses!
          </p>
        </div>
      )}

      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-color)',
        opacity: 0.6,
        marginTop: '1rem'
      }}>
        Usage resets daily at midnight
      </div>
    </div>
  );
};

export default UsageTracker;