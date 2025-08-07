import { useState, useCallback } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import { 
  canUserAnalyze, 
  validateUsageData, 
  shouldShowUpgradePrompt 
} from '../utils/usageUtils';

/**
 * Custom hook for enforcing usage limits and handling paywall logic
 */
export const useUsageEnforcement = () => {
  const {
    user,
    canPerformAnalysis,
    getRemainingUses,
    updateUsage,
    checkDailyReset,
    syncUsageWithBackend
  } = useBiasAuth();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Check if user can perform analysis and show paywall if needed
   */
  const checkUsageLimit = useCallback(() => {
    if (!user) {
      console.warn('No user found for usage check');
      return false;
    }

    // Validate user data integrity
    if (!validateUsageData(user)) {
      console.error('Invalid usage data detected:', user);
      return false;
    }

    // Ensure daily usage is reset if needed
    const wasReset = checkDailyReset();
    if (wasReset) {
      console.log('Daily usage was reset');
    }

    // Use utility function for consistent checking
    const canAnalyze = canUserAnalyze(user);

    if (!canAnalyze) {
      setShowPaywall(true);
      return false;
    }

    return true;
  }, [user, checkDailyReset]);

  /**
   * Execute analysis with usage limit enforcement
   */
  const executeWithUsageCheck = useCallback(async (analysisFunction) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First sync with backend to get latest user data and validate permissions
    const syncResult = await syncUsageWithBackend();
    if (!syncResult.success) {
      console.error('Backend sync failed:', syncResult.error);
      // Continue with local check as fallback
    }

    // Check usage limits before proceeding
    if (!checkUsageLimit()) {
      return {
        success: false,
        error: 'Usage limit exceeded',
        showPaywall: true
      };
    }

    setIsAnalyzing(true);

    try {
      // Execute the analysis function
      const result = await analysisFunction();
      console.log('useUsageEnforcement: Raw result from analysisFunction:', result);
      console.log('useUsageEnforcement: result keys:', result ? Object.keys(result) : 'null');
      console.log('useUsageEnforcement: result.analysis:', result?.analysis);
      console.log('useUsageEnforcement: result.translation:', result?.translation);

      // If analysis was successful, increment usage count
      if (result.success) {
        const newUsageCount = user.daily_usage_count + 1;
        updateUsage(newUsageCount);

        // Check if user has now reached their limit
        const updatedUser = { ...user, daily_usage_count: newUsageCount };
        const hasReachedLimit = !canUserAnalyze(updatedUser);
        const shouldPromptUpgrade = shouldShowUpgradePrompt(updatedUser);

        return {
          ...result,
          usageUpdated: true,
          newUsageCount,
          hasReachedLimit,
          shouldPromptUpgrade
        };
      }

      return result;
    } catch (error) {
      console.error('Analysis execution error:', error);

      // Check if this is a usage limit error from backend
      if (error.message && (
        error.message.includes('USAGE_LIMIT_EXCEEDED') ||
        error.message.includes('Usage limit exceeded') ||
        error.message.includes('Daily usage limit exceeded') ||
        error.message.includes('too many articles')
      )) {
        // Trigger paywall instead of showing error
        setShowPaywall(true);
        return {
          success: false,
          error: 'Usage limit exceeded',
          showPaywall: true
        };
      }

      return {
        success: false,
        error: error.message || 'Analysis failed'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, checkUsageLimit, updateUsage, syncUsageWithBackend]);

  /**
   * Execute real analysis (microfrag) with usage enforcement
   */
  const executeRealAnalysis = useCallback(async (articleText) => {
    // Import the real analysis function dynamically to avoid circular dependencies
    const { analyzeAndTranslateArticle } = await import('../components/microfrag/services/geminiService');

    return executeWithUsageCheck(async () => {
      try {
        const result = await analyzeAndTranslateArticle(articleText);

        // Transform the result to match expected format
        return {
          success: true,
          data: {
            analysis: result.analysis,
            translation: result.translation
          }
        };
      } catch (error) {
        // Re-throw to let executeWithUsageCheck handle it
        throw error;
      }
    });
  }, [executeWithUsageCheck]);

  /**
   * Get usage status information
   */
  const getUsageStatus = useCallback(() => {
    if (!user) {
      return {
        canAnalyze: false,
        remaining: 0,
        isUnlimited: false,
        usageCount: 0,
        usageLimit: 0,
        tierName: 'none'
      };
    }

    const remaining = getRemainingUses();
    const isUnlimited = remaining === 'unlimited';
    
    return {
      canAnalyze: canPerformAnalysis(),
      remaining: isUnlimited ? 'unlimited' : remaining,
      isUnlimited,
      usageCount: user.daily_usage_count,
      usageLimit: user.usage_limit,
      tierName: user.subscription_tier,
      isGuest: user.isGuest
    };
  }, [user, canPerformAnalysis, getRemainingUses]);

  /**
   * Handle paywall modal actions
   */
  const handlePaywallClose = useCallback(() => {
    setShowPaywall(false);
  }, []);

  const handlePaywallUpgrade = useCallback(() => {
    // Redirect to pricing page
    window.location.href = '/pricing?source=paywall';
  }, []);

  /**
   * Force show paywall (useful for testing or manual triggers)
   */
  const showPaywallModal = useCallback(() => {
    setShowPaywall(true);
  }, []);

  /**
   * Reset usage count (for testing purposes)
   */
  const resetUsageForTesting = useCallback(() => {
    if (user) {
      updateUsage(0);
    }
  }, [user, updateUsage]);

  /**
   * Simulate usage increment (for testing purposes)
   */
  const simulateUsage = useCallback(() => {
    if (user && canPerformAnalysis()) {
      const newCount = user.daily_usage_count + 1;
      updateUsage(newCount);
      return true;
    }
    return false;
  }, [user, canPerformAnalysis, updateUsage]);

  return {
    // State
    showPaywall,
    isAnalyzing,

    // Usage status
    getUsageStatus,

    // Usage enforcement
    checkUsageLimit,
    executeWithUsageCheck,
    executeRealAnalysis,

    // Paywall handling
    handlePaywallClose,
    handlePaywallUpgrade,
    showPaywallModal,

    // Testing utilities
    resetUsageForTesting,
    simulateUsage
  };
};

export default useUsageEnforcement;