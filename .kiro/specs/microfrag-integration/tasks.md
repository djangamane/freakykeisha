# Implementation Plan

- [x] 1. Update Landing Page with Navigation Links





  - Add "Pricing" and "BS Article Bias-Detection" navigation links to the landing page header
  - Implement routing logic to navigate to new pages
  - Maintain existing design system consistency
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create Unified Pricing Page Component






  - [x] 2.1 Create PricingPage.js component structure


    - Build pricing page layout with two distinct service sections
    - Implement Keisha AI section with waitlist CTA
    - Create Keisha News section with three pricing tiers
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Implement pricing tier display with Bitcoin incentives


    - Display differentiated pricing for Bitcoin vs Cash App payments
    - Show usage limits for each tier (3 free, 10 monthly, unlimited annual)
    - Integrate with existing payment infrastructure
    - _Requirements: 2.3, 2.4_

- [x] 3. Set up Bias Detection User Authentication System




  - [x] 3.1 Create BiasAuthModal.js component


    - Build authentication modal with login/register forms
    - Implement form validation and error handling
    - Create guest mode option for anonymous users
    - _Requirements: 5.2, 5.3_

  - [x] 3.2 Implement authentication state management


    - Create authentication context for bias detection service
    - Implement session persistence and logout functionality
    - Add authentication guards for protected features
    - _Requirements: 5.2, 5.3_

- [x] 4. Create Usage Tracking System





  - [x] 4.1 Build UsageTracker.js component


    - Display current usage count and daily limits
    - Show subscription tier and remaining uses
    - Implement real-time usage updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.2 Implement usage limit enforcement



    - Check usage limits before allowing analysis
    - Display paywall modal when limits exceeded
    - Handle daily usage reset logic
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 5. Integrate Existing Microfrag Components





  - [x] 5.1 Create MicrofragApp.js wrapper component


    - Wrap existing microfrag App.tsx with authentication layer
    - Integrate usage tracking with analysis functionality
    - Maintain existing analysis interface and features
    - _Requirements: 5.1, 5.4_

  - [x] 5.2 Adapt microfrag components for main app styling


    - Convert TypeScript components to JavaScript if needed
    - Apply main app design system and CSS variables
    - Ensure responsive design consistency
    - _Requirements: 5.1, 5.4_

- [-] 6. Document Backend Requirements for Separate Implementation




  - [x] 6.1 Create backend API specification document

    - Document required authentication endpoints: POST /api/bias-auth/register, POST /api/bias-auth/login, GET /api/bias-auth/profile
    - Document usage tracking endpoints: GET /api/bias-usage/current, POST /api/bias-usage/increment, GET /api/bias-usage/limits
    - Document analysis endpoint: POST /api/bias-analysis/analyze with Gemini integration
    - Specify JWT token requirements and IP-based tracking for anonymous users
    - _Requirements: 6.1, 6.3_

  - [x] 6.2 Create database schema specification document


    - Document bias_users table schema with authentication and subscription fields
    - Document usage_logs table for analysis tracking with IP and user identification
    - Document bias_subscriptions table for payment records and tier management
    - Specify indexing requirements and foreign key relationships
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 6.3 Create payment integration specification document






    - Document bias detection payment endpoints extending existing Coinbase/Cash App infrastructure
    - Specify subscription management logic for activation, renewal, and expiration
    - Document pricing tiers: Bitcoin ($10/month, $100/year) vs Cash App ($20/month, $150/year)
    - Specify usage limits: Free (3/day), Monthly (10/day), Annual (unlimited)
    - _Requirements: 2.4, 4.2, 6.2_

- [x] 9. Create Paywall Modal Component









  - Build PaywallModal.js component for usage limit enforcement
  - Display upgrade options with Bitcoin pricing incentives
  - Integrate with payment processing endpoints
  - Add conversion tracking and analytics
  - _Requirements: 3.2, 2.3, 2.4_

- [x] 10. Implement Routing and Navigation









  - Add React Router routes for pricing page and bias detection app
  - Update App.js to handle new routing structure
  - Implement navigation guards and redirects
  - Ensure proper URL structure and browser history
  - _Requirements: 1.2, 1.3_

- [ ] 11. Add Error Handling and Loading States







  - Implement comprehensive error boundaries for new components
  - Add loading states for authentication and analysis processes
  - Create user-friendly error messages and retry mechanisms
  - Add network error handling and offline detection
  - _Requirements: 5.1, 5.4_

- [ ] 12. Create Frontend Integration Tests
  - Write component integration tests for authentication flow from login to analysis
  - Test usage tracking display and limit enforcement in UI
  - Test payment modal integration and subscription upgrade flow
  - Mock backend API responses for testing frontend functionality
  - _Requirements: All requirements_

- [ ] 13. Configure Frontend Environment and Deployment
  - Add environment variables for bias detection service API endpoints
  - Update build process to include new components and routes
  - Configure frontend routing for new pages and components
  - Add error tracking and analytics for new frontend features
  - _Requirements: All requirements_

- [ ] 14. Create Backend Communication Documentation
  - Create comprehensive API contract documentation for backend team
  - Document all required database schema changes and migrations
  - Specify authentication flow and session management requirements
  - Document payment processing integration points and webhook requirements
  - Create example request/response payloads for all new endpoints
  - _Requirements: All requirements_