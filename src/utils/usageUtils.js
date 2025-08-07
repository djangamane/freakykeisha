/**
 * Utility functions for usage tracking and enforcement
 */

/**
 * Check if it's a new day and usage should be reset
 */
export const shouldResetUsage = (lastResetDate) => {
  if (!lastResetDate) return true;
  
  const today = new Date().toDateString();
  const lastReset = new Date(lastResetDate).toDateString();
  
  return today !== lastReset;
};

/**
 * Get usage limit based on subscription tier
 */
export const getUsageLimitForTier = (tier) => {
  switch (tier) {
    case 'guest':
    case 'free':
      return 3;
    case 'monthly':
      return 10;
    case 'annual':
      return Infinity;
    default:
      return 0;
  }
};

/**
 * Check if user can perform analysis based on current usage and tier
 */
export const canUserAnalyze = (user) => {
  if (!user) return false;
  
  const { daily_usage_count, subscription_tier } = user;
  const limit = getUsageLimitForTier(subscription_tier);
  
  return daily_usage_count < limit;
};

/**
 * Get remaining uses for a user
 */
export const getRemainingUsesForUser = (user) => {
  if (!user) return 0;
  
  const { daily_usage_count, subscription_tier } = user;
  const limit = getUsageLimitForTier(subscription_tier);
  
  if (limit === Infinity) return 'unlimited';
  
  return Math.max(0, limit - daily_usage_count);
};

/**
 * Format usage display text
 */
export const formatUsageDisplay = (current, limit) => {
  if (limit === Infinity) return `${current} / ∞`;
  return `${current} / ${limit}`;
};

/**
 * Get tier display information
 */
export const getTierInfo = (tier) => {
  const tierMap = {
    guest: {
      name: 'Guest',
      color: 'var(--matrix-green)',
      description: 'IP-based tracking'
    },
    free: {
      name: 'Free',
      color: 'var(--accent-color)',
      description: 'Basic account'
    },
    monthly: {
      name: 'Monthly',
      color: 'var(--primary-color)',
      description: 'Monthly subscription'
    },
    annual: {
      name: 'Annual',
      color: '#ffa500',
      description: 'Annual subscription'
    }
  };
  
  return tierMap[tier] || {
    name: 'Unknown',
    color: 'var(--text-color)',
    description: 'Unknown tier'
  };
};

/**
 * Calculate usage percentage for progress bars
 */
export const getUsagePercentage = (current, limit) => {
  if (limit === Infinity) return 0;
  if (limit === 0) return 100;
  
  return Math.min((current / limit) * 100, 100);
};

/**
 * Determine if user should see upgrade prompts
 */
export const shouldShowUpgradePrompt = (user) => {
  if (!user) return false;
  
  const { subscription_tier, daily_usage_count } = user;
  const limit = getUsageLimitForTier(subscription_tier);
  
  // Show upgrade prompt for free/guest users who are close to or at limit
  if ((subscription_tier === 'guest' || subscription_tier === 'free') && 
      daily_usage_count >= limit * 0.8) {
    return true;
  }
  
  return false;
};

/**
 * Get next tier recommendation
 */
export const getRecommendedUpgrade = (currentTier) => {
  switch (currentTier) {
    case 'guest':
    case 'free':
      return 'monthly';
    case 'monthly':
      return 'annual';
    default:
      return null;
  }
};

/**
 * Validate usage data integrity
 */
export const validateUsageData = (user) => {
  if (!user) return false;
  
  const { daily_usage_count, subscription_tier } = user;
  
  // Check if usage count is valid
  if (typeof daily_usage_count !== 'number' || daily_usage_count < 0) {
    return false;
  }
  
  // Check if tier is valid
  const validTiers = ['guest', 'free', 'monthly', 'annual'];
  if (!validTiers.includes(subscription_tier)) {
    return false;
  }
  
  return true;
};

/**
 * Get time until usage reset (midnight)
 */
export const getTimeUntilReset = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilReset = tomorrow.getTime() - now.getTime();
  const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours: hoursUntilReset,
    minutes: minutesUntilReset,
    totalMs: msUntilReset
  };
};