/**
 * Payment service for bias detection subscriptions
 * Handles integration with backend payment processing endpoints
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export class PaymentService {
  /**
   * Create a new subscription payment
   * @param {Object} subscriptionData - Subscription details
   * @returns {Promise<Object>} Payment response with payment_url
   */
  static async createSubscription(subscriptionData) {
    const response = await fetch(`${API_BASE_URL}/api/bias-payment/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': subscriptionData.token ? `Bearer ${subscriptionData.token}` : undefined
      },
      body: JSON.stringify({
        user_id: subscriptionData.user_id,
        tier: subscriptionData.tier,
        payment_method: subscriptionData.payment_method,
        return_url: subscriptionData.return_url,
        cancel_url: subscriptionData.cancel_url
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Payment initiation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get subscription status for a user
   * @param {string} userId - User ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Subscription status
   */
  static async getSubscriptionStatus(userId, token) {
    const response = await fetch(`${API_BASE_URL}/api/bias-payment/subscription/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscription status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a subscription
   * @param {string} userId - User ID
   * @param {string} subscriptionId - Subscription ID
   * @param {string} token - Auth token
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  static async cancelSubscription(userId, subscriptionId, token, reason = '') {
    const response = await fetch(`${API_BASE_URL}/api/bias-payment/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        subscription_id: subscriptionId,
        reason: reason
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get pricing information for all tiers
   * @returns {Object} Pricing structure
   */
  static getPricingTiers() {
    return {
      free: {
        name: 'Free',
        bitcoin_price: 0,
        cashapp_price: 0,
        usage_limit: 3,
        billing_cycle: 'daily',
        features: ['3 analyses per day', 'Basic bias detection', 'IP-based tracking']
      },
      monthly: {
        name: 'Monthly Plan',
        bitcoin_price: 10,
        cashapp_price: 20,
        usage_limit: 10,
        billing_cycle: 'monthly',
        features: ['10 daily analyses', 'Analysis history', 'Priority support', 'Email notifications']
      },
      annual: {
        name: 'Annual Plan',
        bitcoin_price: 100,
        cashapp_price: 150,
        usage_limit: -1, // Unlimited
        billing_cycle: 'yearly',
        features: ['Unlimited analyses', 'Analysis history', 'Priority support', 'Advanced insights', 'White-label options']
      }
    };
  }

  /**
   * Calculate savings for Bitcoin payments
   * @param {string} tier - Subscription tier
   * @returns {Object} Savings information
   */
  static calculateBitcoinSavings(tier) {
    const pricing = this.getPricingTiers()[tier];
    if (!pricing) return null;

    const savings = pricing.cashapp_price - pricing.bitcoin_price;
    const savingsPercentage = Math.round((savings / pricing.cashapp_price) * 100);

    return {
      amount: savings,
      percentage: savingsPercentage,
      monthly_savings: tier === 'annual' ? Math.round(savings / 12 * 100) / 100 : savings,
      yearly_savings: tier === 'monthly' ? savings * 12 : savings
    };
  }

  /**
   * Validate payment data before processing
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  static validatePaymentData(paymentData) {
    const errors = [];

    if (!paymentData.user_id) {
      errors.push('User ID is required');
    }

    if (!['monthly', 'annual'].includes(paymentData.tier)) {
      errors.push('Invalid subscription tier');
    }

    if (!['bitcoin', 'cashapp'].includes(paymentData.payment_method)) {
      errors.push('Invalid payment method');
    }

    if (!paymentData.return_url || !paymentData.cancel_url) {
      errors.push('Return and cancel URLs are required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export default PaymentService;