/**
 * Analytics service for tracking user interactions and conversions
 * Supports multiple analytics providers (Vercel Analytics, Google Analytics, etc.)
 */

export class AnalyticsService {
  /**
   * Track a conversion event
   * @param {string} eventName - Name of the event
   * @param {Object} properties - Event properties
   */
  static track(eventName, properties = {}) {
    try {
      // Add timestamp and session info
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        session_id: this.getSessionId()
      };

      // Track with Vercel Analytics
      this.trackVercelAnalytics(eventName, enrichedProperties);
      
      // Track with Google Analytics
      this.trackGoogleAnalytics(eventName, enrichedProperties);
      
      // Track with custom backend analytics
      this.trackCustomAnalytics(eventName, enrichedProperties);
      
      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics Event:', eventName, enrichedProperties);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track with Vercel Analytics
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  static trackVercelAnalytics(eventName, properties) {
    if (window.va && typeof window.va === 'function') {
      window.va('track', eventName, properties);
    }
  }

  /**
   * Track with Google Analytics
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  static trackGoogleAnalytics(eventName, properties) {
    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: properties.category || 'bias_detection',
        event_label: properties.label,
        value: properties.value,
        custom_parameters: properties
      });
    }
  }

  /**
   * Track with custom backend analytics
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  static trackCustomAnalytics(eventName, properties) {
    // Send to backend analytics endpoint (fire and forget)
    const apiUrl = process.env.REACT_APP_API_URL || '';
    
    fetch(`${apiUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: eventName,
        properties: properties
      })
    }).catch(error => {
      // Silently fail for analytics
      console.debug('Custom analytics tracking failed:', error);
    });
  }

  /**
   * Get or create session ID
   * @returns {string} Session ID
   */
  static getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Track paywall-specific events
   */
  static trackPaywallEvent(eventType, data = {}) {
    const paywallEvents = {
      displayed: 'paywall_displayed',
      dismissed: 'paywall_dismissed',
      upgrade_clicked: 'paywall_upgrade_clicked',
      payment_initiated: 'payment_initiated',
      payment_completed: 'payment_completed',
      payment_failed: 'payment_failed'
    };

    const eventName = paywallEvents[eventType] || eventType;
    
    this.track(eventName, {
      category: 'paywall',
      ...data
    });
  }

  /**
   * Track usage-related events
   */
  static trackUsageEvent(eventType, data = {}) {
    const usageEvents = {
      limit_reached: 'usage_limit_reached',
      analysis_completed: 'analysis_completed',
      daily_reset: 'usage_daily_reset',
      subscription_activated: 'subscription_activated'
    };

    const eventName = usageEvents[eventType] || eventType;
    
    this.track(eventName, {
      category: 'usage',
      ...data
    });
  }

  /**
   * Track conversion funnel events
   */
  static trackConversionFunnel(step, data = {}) {
    const funnelSteps = {
      landing_page_view: 'funnel_landing_view',
      bias_detection_access: 'funnel_bias_access',
      usage_limit_hit: 'funnel_limit_hit',
      paywall_view: 'funnel_paywall_view',
      payment_start: 'funnel_payment_start',
      payment_complete: 'funnel_payment_complete',
      subscription_active: 'funnel_subscription_active'
    };

    const eventName = funnelSteps[step] || step;
    
    this.track(eventName, {
      category: 'conversion_funnel',
      funnel_step: step,
      ...data
    });
  }

  /**
   * Track user engagement metrics
   */
  static trackEngagement(action, data = {}) {
    this.track('user_engagement', {
      category: 'engagement',
      action: action,
      ...data
    });
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(metric, value, data = {}) {
    this.track('performance_metric', {
      category: 'performance',
      metric: metric,
      value: value,
      ...data
    });
  }

  /**
   * Track errors
   */
  static trackError(error, context = {}) {
    this.track('error_occurred', {
      category: 'error',
      error_message: error.message || error,
      error_stack: error.stack,
      context: context
    });
  }

  /**
   * Initialize analytics with user context
   */
  static initialize(userContext = {}) {
    // Set user properties for analytics
    if (window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
        user_id: userContext.user_id,
        custom_map: {
          subscription_tier: userContext.subscription_tier,
          user_type: userContext.user_type
        }
      });
    }

    // Track initialization
    this.track('analytics_initialized', {
      category: 'system',
      user_context: userContext
    });
  }

  /**
   * Track page views
   */
  static trackPageView(page, data = {}) {
    this.track('page_view', {
      category: 'navigation',
      page: page,
      ...data
    });
  }

  /**
   * Create a timer for tracking duration
   */
  static startTimer(timerName) {
    const startTime = Date.now();
    
    return {
      end: (data = {}) => {
        const duration = Date.now() - startTime;
        this.track('timer_completed', {
          category: 'timing',
          timer_name: timerName,
          duration_ms: duration,
          ...data
        });
        return duration;
      }
    };
  }

  /**
   * Track A/B test events
   */
  static trackABTest(testName, variant, data = {}) {
    this.track('ab_test_view', {
      category: 'ab_testing',
      test_name: testName,
      variant: variant,
      ...data
    });
  }
}

export default AnalyticsService;