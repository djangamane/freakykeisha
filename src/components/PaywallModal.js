import React, { useState, useEffect } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import PaymentService from '../utils/paymentService';
import AnalyticsService from '../utils/analyticsService';
import './LandingPage.css';

const PaywallModal = ({ isOpen, onClose, onUpgrade }) => {
  const { user, getRemainingUses } = useBiasAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const remaining = getRemainingUses();
  const isGuest = user?.isGuest;
  const tierName = user?.subscription_tier || 'unknown';

  // Track paywall modal display for analytics
  useEffect(() => {
    if (isOpen) {
      window.paywallDisplayTime = Date.now();
      AnalyticsService.trackPaywallEvent('displayed', {
        user_type: isGuest ? 'guest' : 'registered',
        current_tier: tierName,
        remaining_uses: remaining,
        trigger_source: 'usage_limit_reached'
      });
    }
  }, [isOpen, isGuest, tierName, remaining]);

  if (!isOpen) return null;

  if (!isOpen) return null;
  
  // Get pricing tiers from service with Bitcoin savings calculation
  const pricingTiers = Object.values(PaymentService.getPricingTiers()).filter(tier => 
    tier.name !== 'Free'
  ).map(tier => {
    const tierKey = tier.billing_cycle === 'monthly' ? 'monthly' : 'annual';
    const savings = PaymentService.calculateBitcoinSavings(tierKey);
    
    return {
      name: tier.name,
      bitcoinPrice: tier.bitcoin_price === 0 ? 'Free' : `$${tier.bitcoin_price}/${tier.billing_cycle === 'monthly' ? 'month' : 'year'}`,
      cashappPrice: tier.cashapp_price === 0 ? 'Free' : `$${tier.cashapp_price}/${tier.billing_cycle === 'monthly' ? 'month' : 'year'}`,
      dailyLimit: tier.usage_limit === -1 ? 'Unlimited analyses' : `${tier.usage_limit} analyses/day`,
      features: tier.features,
      recommended: tier.name === 'Annual Plan',
      tier: tierKey,
      savings: savings
    };
  });

  const handleUpgradeClick = async (plan, paymentMethod) => {
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // Track paywall conversion attempt
      AnalyticsService.trackPaywallEvent('upgrade_clicked', {
        plan: plan.name,
        payment_method: paymentMethod,
        user_type: isGuest ? 'guest' : 'registered',
        current_tier: tierName,
        source: 'paywall_modal',
        savings_amount: plan.savings?.amount || 0,
        savings_percentage: plan.savings?.percentage || 0
      });

      const planTier = plan.tier;
      
      // If user is authenticated, attempt direct payment processing
      if (user && !user.isGuest) {
        const paymentData = await PaymentService.createSubscription({
          user_id: user.id,
          tier: planTier,
          payment_method: paymentMethod,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`,
          token: user.token
        });
        
        if (paymentData.payment_url) {
          // Track successful payment initiation
          AnalyticsService.trackPaywallEvent('payment_initiated', {
            plan: planTier,
            payment_method: paymentMethod,
            amount: paymentData.amount,
            currency: paymentData.currency,
            subscription_id: paymentData.subscription_id,
            payment_provider: paymentMethod === 'bitcoin' ? 'coinbase' : 'cashapp'
          });
          
          // Redirect to payment provider
          window.location.href = paymentData.payment_url;
          return;
        }
      }
      
      // Fallback: redirect to pricing page with pre-selected options
      const params = new URLSearchParams({
        plan: planTier,
        source: 'paywall',
        payment: paymentMethod,
        user_type: isGuest ? 'guest' : 'registered'
      });
      
      // Track fallback redirect
      AnalyticsService.trackPaywallEvent('pricing_redirect', {
        plan: planTier,
        payment_method: paymentMethod,
        reason: 'payment_service_unavailable'
      });
      
      window.location.href = `/pricing?${params.toString()}`;
      onClose();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentError('Failed to initiate payment. Please try again or contact support.');
      
      // Track payment error
      AnalyticsService.trackPaywallEvent('payment_failed', {
        plan: plan.name,
        payment_method: paymentMethod,
        error: error.message,
        source: 'paywall_modal',
        error_type: 'payment_initiation_failed'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleClose = () => {
    // Track paywall dismissal with engagement time
    const displayTime = window.paywallDisplayTime || Date.now();
    const engagementTime = Date.now() - displayTime;
    
    AnalyticsService.trackPaywallEvent('dismissed', {
      user_type: isGuest ? 'guest' : 'registered',
      current_tier: tierName,
      time_displayed: engagementTime,
      source: 'close_button',
      remaining_uses: remaining
    });
    
    onClose();
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal" style={{
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '2vh auto'
      }}>
        <div className="login-modal-header">
          <h2 style={{ color: 'var(--primary-color)' }}>
            Fragile News Decoder AI
          </h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          {/* Usage Limit Alert */}
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #ff4444',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              color: '#ff6666', 
              margin: '0 0 0.5rem 0',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              {isGuest ? 'Guest Limit Reached' : 'Daily Limit Reached'}
            </h3>
            <p style={{ 
              color: 'var(--text-color)', 
              margin: 0,
              fontSize: '0.9rem'
            }}>
              {isGuest 
                ? 'You\'ve used all 3 free daily analyses. Upgrade to continue analyzing articles.'
                : `You've reached your daily limit of ${user?.usage_limit || 0} analyses.`
              }
            </p>
            {remaining !== 'unlimited' && (
              <p style={{ 
                color: 'var(--accent-color)', 
                margin: '0.5rem 0 0 0',
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}>
                Usage resets at midnight
              </p>
            )}
          </div>

          {/* Payment Error Display */}
          {paymentError && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #ff4444',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ 
                color: '#ff6666', 
                margin: 0,
                fontSize: '0.9rem'
              }}>
                {paymentError}
              </p>
            </div>
          )}

          <h3 style={{
            textAlign: 'center',
            color: 'var(--accent-color)',
            fontFamily: 'Orbitron, sans-serif',
            marginBottom: '1.5rem'
          }}>
            Upgrade for More Analyses
          </h3>

          {/* Pricing Tiers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem'
          }}>
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                style={{
                  background: tier.recommended
                    ? 'rgba(255, 165, 0, 0.1)'
                    : 'rgba(0, 255, 255, 0.1)',
                  border: tier.recommended
                    ? '2px solid #ffa500'
                    : '2px solid var(--accent-color)',
                  borderRadius: '15px',
                  padding: '1rem',
                  position: 'relative',
                  textAlign: 'center'
                }}
              >
                {tier.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ffa500',
                    color: 'var(--background-color)',
                    padding: '0.3rem 1rem',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    fontFamily: 'Orbitron, sans-serif'
                  }}>
                    RECOMMENDED
                  </div>
                )}

                <h4 style={{
                  color: tier.recommended ? '#ffa500' : 'var(--accent-color)',
                  fontFamily: 'Orbitron, sans-serif',
                  margin: '0 0 0.8rem 0',
                  fontSize: '1.1rem'
                }}>
                  {tier.name}
                </h4>

                {/* Pricing Display with Bitcoin Incentive */}
                <div style={{ marginBottom: '0.8rem' }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'var(--matrix-green)',
                    marginBottom: '0.3rem'
                  }}>
                    {tier.bitcoinPrice}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-color)',
                    opacity: 0.8,
                    textDecoration: 'line-through'
                  }}>
                    {tier.cashappPrice}
                  </div>
                  {tier.savings && tier.savings.amount > 0 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--matrix-green)',
                      fontStyle: 'italic',
                      marginTop: '0.3rem'
                    }}>
                      Save ${tier.savings.amount} ({tier.savings.percentage}%) with Bitcoin!
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  color: tier.recommended ? '#ffa500' : 'var(--accent-color)',
                  marginBottom: '0.8rem',
                  fontFamily: 'Orbitron, sans-serif'
                }}>
                  {tier.dailyLimit}
                </div>

                {/* Features List */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1rem 0',
                  fontSize: '0.85rem'
                }}>
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} style={{
                      color: 'var(--text-color)',
                      marginBottom: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ 
                        color: 'var(--matrix-green)', 
                        marginRight: '0.5rem' 
                      }}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Payment Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleUpgradeClick(tier, 'bitcoin')}
                    disabled={isProcessingPayment}
                    style={{
                      background: isProcessingPayment
                        ? 'rgba(128, 128, 128, 0.5)'
                        : 'linear-gradient(135deg, var(--matrix-green), #00cc88)',
                      color: 'var(--background-color)',
                      border: 'none',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '15px',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      opacity: isProcessingPayment ? 0.6 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isProcessingPayment) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isProcessingPayment) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isProcessingPayment ? 'Processing...' : `💰 Pay with Bitcoin - ${tier.bitcoinPrice}`}
                  </button>
                  
                  <button
                    onClick={() => handleUpgradeClick(tier, 'cashapp')}
                    disabled={isProcessingPayment}
                    style={{
                      background: isProcessingPayment
                        ? 'rgba(128, 128, 128, 0.5)'
                        : tier.recommended
                          ? 'linear-gradient(135deg, #ffa500, #ff8c00)'
                          : 'linear-gradient(135deg, var(--accent-color), #0099cc)',
                      color: 'var(--background-color)',
                      border: 'none',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '15px',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      opacity: isProcessingPayment ? 0.6 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isProcessingPayment) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = tier.recommended
                          ? '0 4px 15px rgba(255, 165, 0, 0.3)'
                          : '0 4px 15px rgba(0, 255, 255, 0.3)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isProcessingPayment) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {isProcessingPayment ? 'Processing...' : `💳 Pay with Cash App - ${tier.cashappPrice}`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guest User Call-to-Action */}
          {isGuest && (
            <div style={{
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid var(--accent-color)',
              borderRadius: '10px',
              padding: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-color)'
            }}>
              <p style={{ margin: '0 0 1rem 0' }}>
                <strong style={{ color: 'var(--accent-color)' }}>
                  Create an account to get started!
                </strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                Free accounts get 3 analyses per day. Paid plans offer more usage and features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;