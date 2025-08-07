import { useState, useCallback } from 'react';
import { isNetworkError } from '../utils/networkUtils';

/**
 * Custom hook for comprehensive error handling
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Handle an error with categorization and logging
   */
  const handleError = useCallback((error, context = {}) => {
    console.error('Error handled:', error, context);

    // Categorize the error
    const errorInfo = {
      originalError: error,
      message: error?.message || 'An unknown error occurred',
      type: getErrorType(error),
      isRetryable: isRetryableError(error),
      context,
      timestamp: new Date().toISOString(),
      retryCount
    };

    setError(errorInfo);

    // Log to analytics if available
    if (window.AnalyticsService) {
      window.AnalyticsService.trackError('handled_error', {
        error_type: errorInfo.type,
        error_message: errorInfo.message,
        is_retryable: errorInfo.isRetryable,
        retry_count: retryCount,
        context: JSON.stringify(context)
      });
    }

    return errorInfo;
  }, [retryCount]);

  /**
   * Execute an async operation with error handling
   */
  const executeWithErrorHandling = useCallback(async (
    operation, 
    options = {}
  ) => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      onSuccess,
      onError,
      context = {}
    } = options;

    setIsLoading(true);
    clearError();

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        
        setIsLoading(false);
        setRetryCount(0);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return { success: true, data: result };

      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry
        if (attempt <= maxRetries && isRetryableError(error)) {
          setRetryCount(attempt);
          
          if (onRetry) {
            onRetry(attempt, error);
          }

          // Wait before retrying (exponential backoff)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          continue;
        }

        // Max retries reached or non-retryable error
        break;
      }
    }

    // Handle final error
    setIsLoading(false);
    const errorInfo = handleError(lastError, {
      ...context,
      maxRetries,
      finalAttempt: attempt
    });

    if (onError) {
      onError(errorInfo);
    }

    return { 
      success: false, 
      error: errorInfo,
      attempts: attempt
    };
  }, [handleError, clearError]);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async (operation, options = {}) => {
    if (!error) {
      console.warn('No error to retry');
      return;
    }

    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);

    return executeWithErrorHandling(operation, {
      ...options,
      context: {
        ...options.context,
        isRetry: true,
        previousError: error.message
      }
    });
  }, [error, retryCount, executeWithErrorHandling]);

  return {
    error,
    isLoading,
    retryCount,
    clearError,
    handleError,
    executeWithErrorHandling,
    retry
  };
};

/**
 * Determine the type of error for categorization
 */
const getErrorType = (error) => {
  if (!error) return 'unknown';

  if (isNetworkError(error)) {
    return 'network';
  }

  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return 'validation';
  }

  if (error.name === 'AuthenticationError' || error.message?.includes('auth')) {
    return 'authentication';
  }

  if (error.name === 'AuthorizationError' || error.message?.includes('permission')) {
    return 'authorization';
  }

  if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
    return 'rate_limit';
  }

  if (error.message?.includes('payment') || error.message?.includes('subscription')) {
    return 'payment';
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 'client';
  }

  return 'server';
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error) => {
  if (!error) return false;

  // Network errors are generally retryable
  if (isNetworkError(error)) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.message?.includes('500') || error.message?.includes('502') || 
      error.message?.includes('503') || error.message?.includes('504')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }

  // Rate limit errors might be retryable with backoff
  if (error.message?.includes('rate limit')) {
    return true;
  }

  // Client errors (4xx) are generally not retryable
  if (error.message?.includes('400') || error.message?.includes('401') || 
      error.message?.includes('403') || error.message?.includes('404')) {
    return false;
  }

  // Validation errors are not retryable
  if (error.name === 'ValidationError') {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
};

/**
 * Hook for handling authentication errors specifically
 */
export const useAuthErrorHandler = () => {
  const { handleError, clearError } = useErrorHandler();

  const handleAuthError = useCallback((error, context = {}) => {
    const authContext = {
      ...context,
      component: 'authentication',
      action: context.action || 'unknown'
    };

    return handleError(error, authContext);
  }, [handleError]);

  return {
    handleAuthError,
    clearError
  };
};

/**
 * Hook for handling analysis errors specifically
 */
export const useAnalysisErrorHandler = () => {
  const { handleError, clearError, executeWithErrorHandling } = useErrorHandler();

  const handleAnalysisError = useCallback((error, context = {}) => {
    const analysisContext = {
      ...context,
      component: 'analysis',
      service: context.service || 'gemini'
    };

    return handleError(error, analysisContext);
  }, [handleError]);

  const executeAnalysis = useCallback(async (analysisFunction, options = {}) => {
    return executeWithErrorHandling(analysisFunction, {
      maxRetries: 2, // Fewer retries for analysis due to cost
      retryDelay: 2000, // Longer delay for API rate limits
      ...options,
      context: {
        component: 'analysis',
        ...options.context
      }
    });
  }, [executeWithErrorHandling]);

  return {
    handleAnalysisError,
    executeAnalysis,
    clearError
  };
};

export default useErrorHandler;