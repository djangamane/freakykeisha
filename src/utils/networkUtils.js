/**
 * Network utilities for handling connectivity and error states
 */

// Network status tracking
let isOnline = navigator.onLine;
let networkListeners = [];

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  networkListeners.forEach(listener => listener(true));
});

window.addEventListener('offline', () => {
  isOnline = false;
  networkListeners.forEach(listener => listener(false));
});

/**
 * Check if the browser is currently online
 */
export const getNetworkStatus = () => isOnline;

/**
 * Add a listener for network status changes
 */
export const addNetworkListener = (callback) => {
  networkListeners.push(callback);
  
  // Return cleanup function
  return () => {
    networkListeners = networkListeners.filter(listener => listener !== callback);
  };
};

/**
 * Test actual connectivity by making a request to a reliable endpoint
 */
export const testConnectivity = async (timeout = 5000) => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.warn('Connectivity test failed:', error.message);
    return false;
  }
};

/**
 * Determine if an error is network-related
 */
export const isNetworkError = (error) => {
  if (!error) return false;

  const networkErrorMessages = [
    'network error',
    'fetch error',
    'failed to fetch',
    'network request failed',
    'connection refused',
    'timeout',
    'aborted',
    'no internet',
    'offline',
    'connection lost',
    'dns',
    'unreachable'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';

  return networkErrorMessages.some(msg => 
    errorMessage.includes(msg) || errorName.includes(msg)
  ) || error.code === 'NETWORK_ERROR';
};

/**
 * Enhanced fetch with retry logic and network error handling
 */
export const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  const {
    timeout = 10000,
    retryDelay = 1000,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check network status before attempting
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      lastError = error;
      
      // Don't retry on non-network errors
      if (!isNetworkError(error) && error.name !== 'AbortError') {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Enhance error with retry information
  const enhancedError = new Error(
    `Network request failed after ${maxRetries + 1} attempts: ${lastError.message}`
  );
  enhancedError.originalError = lastError;
  enhancedError.isNetworkError = true;
  enhancedError.attempts = maxRetries + 1;

  throw enhancedError;
};

/**
 * Create a network-aware API client
 */
export const createApiClient = (baseURL, defaultOptions = {}) => {
  return {
    async request(endpoint, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const mergedOptions = { ...defaultOptions, ...options };

      return fetchWithRetry(url, mergedOptions);
    },

    async get(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'GET' });
    },

    async post(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data)
      });
    },

    async put(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data)
      });
    },

    async delete(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'DELETE' });
    }
  };
};

/**
 * Exponential backoff utility
 */
export const exponentialBackoff = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return delay + jitter;
};

/**
 * Debounce utility for network requests
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  getNetworkStatus,
  addNetworkListener,
  testConnectivity,
  isNetworkError,
  fetchWithRetry,
  createApiClient,
  exponentialBackoff,
  debounce
};