import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { isNetworkError } from '../utils/networkUtils';

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  RESTORE_SESSION: 'RESTORE_SESSION',
  UPDATE_USAGE: 'UPDATE_USAGE',
  RESET_DAILY_USAGE: 'RESET_DAILY_USAGE'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionRestored: false
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        sessionRestored: true
      };

    case AUTH_ACTIONS.UPDATE_USAGE:
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          daily_usage_count: action.payload
        } : null
      };

    case AUTH_ACTIONS.RESET_DAILY_USAGE:
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          daily_usage_count: 0,
          last_usage_reset: new Date().toDateString()
        } : null
      };

    default:
      return state;
  }
};

// Create context
const BiasAuthContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  USER: 'bias_auth_user',
  SESSION_TOKEN: 'bias_auth_token',
  GUEST_DATA: 'bias_guest_data'
};

// Provider component
export const BiasAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check for authenticated user session
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);

          // Validate token with backend and get fresh user data
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bias-auth/validate-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.user) {
                // Update user data with fresh backend data
                const updatedUser = {
                  ...data.user,
                  sessionCreated: user.sessionCreated || Date.now(),
                  last_usage_reset: new Date().toDateString()
                };

                // Store updated user data
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

                dispatch({
                  type: AUTH_ACTIONS.RESTORE_SESSION,
                  payload: updatedUser
                });
                return;
              }
            }

            // Token validation failed, clear storage
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid session
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
          }
        }

        // Check for guest session
        const guestData = localStorage.getItem(STORAGE_KEYS.GUEST_DATA);
        if (guestData) {
          const guest = JSON.parse(guestData);
          
          // Check if it's a new day (reset usage for guests)
          const today = new Date().toDateString();
          if (guest.last_usage_reset !== today) {
            guest.daily_usage_count = 0;
            guest.last_usage_reset = today;
            localStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(guest));
          }
          
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            payload: guest
          });
          return;
        }

        // No session found
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: null
        });
      } catch (error) {
        console.error('Error restoring session:', error);
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: null
        });
      }
    };

    restoreSession();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bias-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Non-JSON response (likely HTML error page)
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check your API configuration.`);
      }

      if (response.ok && data && data.success) {
        const user = {
          ...data.user,
          sessionCreated: Date.now(),
          last_usage_reset: new Date().toDateString()
        };

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.token);

        // Clear any guest data
        localStorage.removeItem(STORAGE_KEYS.GUEST_DATA);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: user
        });

        return { success: true };
      } else {
        throw new Error(data?.error?.message || `Login failed (${response.status})`);
      }
    } catch (error) {
      let errorMessage = error.message;

      // Enhance error message based on error type
      if (isNetworkError(error)) {
        errorMessage = 'Unable to connect to authentication server. Please check your internet connection and try again.';
      } else if (error.message?.includes('401') || error.message?.includes('invalid')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('429')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        isNetworkError: isNetworkError(error),
        originalError: error
      };
    }
  };

  // Register function
  const register = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bias-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Non-JSON response (likely HTML error page)
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check your API configuration.`);
      }

      if (response.ok && data && data.success) {
        const user = {
          ...data.user,
          sessionCreated: Date.now(),
          last_usage_reset: new Date().toDateString()
        };

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.token);

        // Clear any guest data
        localStorage.removeItem(STORAGE_KEYS.GUEST_DATA);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: user
        });

        return { success: true };
      } else {
        throw new Error(data?.error?.message || `Registration failed (${response.status})`);
      }
    } catch (error) {
      let errorMessage = error.message;

      // Enhance error message based on error type
      if (isNetworkError(error)) {
        errorMessage = 'Unable to connect to registration server. Please check your internet connection and try again.';
      } else if (error.message?.includes('409') || error.message?.includes('exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message?.includes('400') || error.message?.includes('validation')) {
        errorMessage = 'Please check that your email and password meet the requirements.';
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        isNetworkError: isNetworkError(error),
        originalError: error
      };
    }
  };

  // Guest mode function
  const enterGuestMode = () => {
    const guestUser = {
      id: null,
      email: null,
      subscription_tier: 'guest',
      daily_usage_count: 0,
      usage_limit: 3,
      isGuest: true,
      last_usage_reset: new Date().toDateString(),
      sessionCreated: Date.now()
    };

    // Store guest data
    localStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(guestUser));
    
    // Clear any authenticated user data
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);

    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: guestUser
    });

    return { success: true };
  };

  // Logout function
  const logout = () => {
    // Clear all stored data
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GUEST_DATA);

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update usage count
  const updateUsage = (newCount) => {
    if (state.user) {
      const updatedUser = {
        ...state.user,
        daily_usage_count: newCount
      };

      // Update storage
      if (state.user.isGuest) {
        localStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(updatedUser));
      } else {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USAGE,
        payload: newCount
      });
    }
  };

  // Check if user can perform analysis
  const canPerformAnalysis = () => {
    if (!state.user) return false;
    
    const { daily_usage_count, usage_limit, subscription_tier } = state.user;
    
    // Unlimited for annual subscribers
    if (subscription_tier === 'annual') return true;
    
    // Check daily limits
    return daily_usage_count < usage_limit;
  };

  // Get remaining uses
  const getRemainingUses = () => {
    if (!state.user) return 0;
    
    const { daily_usage_count, usage_limit, subscription_tier } = state.user;
    
    if (subscription_tier === 'annual') return 'unlimited';
    
    return Math.max(0, usage_limit - daily_usage_count);
  };

  // Check and reset daily usage if needed
  const checkDailyReset = () => {
    if (!state.user) return false;

    const today = new Date().toDateString();
    const lastReset = state.user.last_usage_reset;

    if (lastReset !== today) {
      const updatedUser = {
        ...state.user,
        daily_usage_count: 0,
        last_usage_reset: today
      };

      // Update storage
      if (state.user.isGuest) {
        localStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(updatedUser));
      } else {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }

      dispatch({ type: AUTH_ACTIONS.RESET_DAILY_USAGE });
      return true; // Indicates reset occurred
    }
    
    return false; // No reset needed
  };

  // Sync usage with backend
  const syncUsageWithBackend = async () => {
    if (!state.user) {
      return { success: false, error: 'No user found' };
    }

    // Guest users don't sync with backend - they're local only
    if (state.user.isGuest) {
      return {
        success: true,
        canAnalyze: canPerformAnalysis(),
        user: state.user,
        message: 'Guest user - local storage only'
      };
    }

    if (!state.isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bias-usage/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: state.user.id,
          current_usage: state.user.daily_usage_count
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update user data with backend sync
          const updatedUser = {
            ...state.user,
            ...data.user,
            last_usage_reset: new Date().toDateString()
          };

          // Update storage
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            payload: updatedUser
          });

          return { success: true, canAnalyze: data.can_analyze, user: updatedUser };
        }
      }

      return { success: false, error: 'Failed to sync with backend' };
    } catch (error) {
      console.error('Usage sync failed:', error);
      return { success: false, error: 'Network error during sync' };
    }
  };

  // Authentication guard
  const requireAuth = (callback) => {
    if (!state.isAuthenticated) {
      return { success: false, error: 'Authentication required' };
    }

    if (!canPerformAnalysis()) {
      return { success: false, error: 'Daily usage limit exceeded' };
    }

    return callback();
  };

  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    sessionRestored: state.sessionRestored,

    // Actions
    login,
    register,
    logout,
    enterGuestMode,
    updateUsage,
    canPerformAnalysis,
    getRemainingUses,
    checkDailyReset,
    syncUsageWithBackend,
    requireAuth
  };

  return (
    <BiasAuthContext.Provider value={value}>
      {children}
    </BiasAuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useBiasAuth = () => {
  const context = useContext(BiasAuthContext);
  if (!context) {
    throw new Error('useBiasAuth must be used within a BiasAuthProvider');
  }
  return context;
};



export default BiasAuthContext;