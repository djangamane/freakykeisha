# Requirements Document

## Introduction

This feature integrates the existing microfrag news article bias detector as a standalone micro-SaaS offering alongside the main Keisha AI platform. The integration will add new navigation links to the landing page, create a separate pricing structure for the micro-SaaS, implement usage limits with a freemium model, and establish backend connectivity for user management and payment processing.

## Requirements

### Requirement 1

**User Story:** As a visitor to the landing page, I want to see clear navigation options for both the main Keisha AI service and the news bias detection micro-SaaS, so that I can easily access the service I'm interested in.

#### Acceptance Criteria

1. WHEN a user visits the landing page THEN the system SHALL display two new navigation links near the top: "Pricing" and "BS Article Bias-Detection"
2. WHEN a user clicks "BS Article Bias-Detection" THEN the system SHALL navigate to the microfrag bias detection interface
3. WHEN a user clicks "Pricing" THEN the system SHALL navigate to a unified pricing page showing both services

### Requirement 2

**User Story:** As a potential customer, I want to see differentiated pricing for the main Keisha AI service and the news bias detection micro-SaaS, so that I can choose the service that fits my needs and budget.

#### Acceptance Criteria

1. WHEN a user views the pricing page THEN the system SHALL display two distinct service sections: "Keisha AI (Main)" and "Keisha News (Micro)"
2. WHEN viewing the Keisha AI section THEN the system SHALL show "Join the Waitlist" without displaying prices
3. WHEN viewing the Keisha News section THEN the system SHALL display three pricing tiers: Free (3 uses/day), Monthly (Bitcoin: $10/month, Cash App: $20/month), and Annual (Bitcoin: $100/year, Cash App: $150/year)
4. WHEN a user selects a Keisha News pricing tier THEN the system SHALL utilize the existing Coinbase and Cash App payment infrastructure with Bitcoin pricing incentivized over Cash App

### Requirement 3

**User Story:** As a user of the news bias detection service, I want to have a limited number of free uses per day before being prompted to upgrade, so that I can try the service before committing to a paid plan.

#### Acceptance Criteria

1. WHEN a user accesses the bias detection service without authentication THEN the system SHALL allow up to 3 analyses per day based on IP address or browser fingerprint
2. WHEN a user exceeds the daily free limit THEN the system SHALL display a paywall modal with upgrade options
3. WHEN a user has a monthly subscription THEN the system SHALL allow up to 10 analyses per day
4. WHEN a user has an annual subscription THEN the system SHALL allow unlimited analyses
4. WHEN the daily limit resets (at midnight) THEN the system SHALL reset the usage counter for free users

### Requirement 4

**User Story:** As a subscriber to the news bias detection service, I want my subscription status and usage to be tracked in the backend database, so that my access is properly managed across sessions and devices.

#### Acceptance Criteria

1. WHEN a user subscribes to Keisha News THEN the system SHALL create or update a user profile in the backend database with subscription details
2. WHEN a user logs in THEN the system SHALL retrieve their subscription status and current usage from the backend
3. WHEN a user performs an analysis THEN the system SHALL increment their usage counter in the backend database
4. WHEN a subscription expires THEN the system SHALL automatically downgrade the user to the free tier

### Requirement 5

**User Story:** As a user, I want the microfrag bias detection interface to be seamlessly integrated into the main application, so that I have a consistent user experience across all services.

#### Acceptance Criteria

1. WHEN a user accesses the bias detection service THEN the system SHALL display the interface using the same design system and styling as the main application
2. WHEN a user accesses the bias detection service THEN the system SHALL provide separate authentication independent from the main app (since main app is waitlist-only)
3. WHEN a user creates an account for bias detection THEN the system SHALL maintain their session within the bias detection service only
4. WHEN displaying analysis results THEN the system SHALL maintain the existing microfrag functionality while integrating with the new payment and usage tracking systems

### Requirement 6

**User Story:** As an administrator, I want the backend to handle the news bias detection micro-SaaS with separate user management from the main app, so that the micro-SaaS can operate independently while the main app remains in waitlist mode.

#### Acceptance Criteria

1. WHEN the system processes a bias detection request THEN the backend SHALL authenticate the bias detection user and check their usage limits independently from main app users
2. WHEN a user subscribes to Keisha News THEN the backend SHALL process the payment and update the user's subscription status in a separate user table or service flag
3. WHEN tracking usage THEN the backend SHALL log analysis requests with bias detection user identification, timestamp, and service type
4. WHEN generating reports THEN the backend SHALL provide analytics specifically for the bias detection service