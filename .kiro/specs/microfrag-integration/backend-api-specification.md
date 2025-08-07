# Backend API Specification for Bias Detection Service

## Overview

This document specifies the backend API requirements for the news article bias detection micro-SaaS service. The API handles authentication, usage tracking, and analysis functionality independent from the main Keisha AI application.

## Authentication Endpoints

### POST /api/bias-auth/register

Creates a new user account for the bias detection service.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "free",
    "daily_usage_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-string"
}
```

**Error Responses:**
- 400 Bad Request: Invalid email format or weak password
- 409 Conflict: Email already exists

### POST /api/bias-auth/login

Authenticates an existing user and returns a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "monthly",
    "daily_usage_count": 5,
    "subscription_expires_at": "2024-02-01T00:00:00Z"
  },
  "token": "jwt-token-string"
}
```

**Error Responses:**
- 401 Unauthorized: Invalid credentials
- 429 Too Many Requests: Rate limit exceeded

### GET /api/bias-auth/profile

Retrieves the current user's profile information.

**Headers:**
```
Authorization: Bearer jwt-token-string
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "annual",
    "daily_usage_count": 15,
    "subscription_expires_at": "2025-01-01T00:00:00Z",
    "last_usage_reset": "2024-01-01T00:00:00Z",
    "created_at": "2023-06-01T00:00:00Z"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Invalid or expired token

## Usage Tracking Endpoints

### GET /api/bias-usage/current

Retrieves current usage information for authenticated users or IP-based tracking for anonymous users.

**Headers (Optional for authenticated users):**
```
Authorization: Bearer jwt-token-string
```

**Response (200 OK) - Authenticated User:**
```json
{
  "success": true,
  "usage": {
    "daily_count": 7,
    "daily_limit": 10,
    "subscription_tier": "monthly",
    "reset_time": "2024-01-02T00:00:00Z",
    "unlimited": false
  }
}
```

**Response (200 OK) - Anonymous User:**
```json
{
  "success": true,
  "usage": {
    "daily_count": 2,
    "daily_limit": 3,
    "subscription_tier": "free",
    "reset_time": "2024-01-02T00:00:00Z",
    "unlimited": false
  }
}
```

### POST /api/bias-usage/increment

Increments usage counter after successful analysis.

**Headers (Optional for authenticated users):**
```
Authorization: Bearer jwt-token-string
```

**Request Body:**
```json
{
  "analysis_type": "bias_detection",
  "article_length": 1500
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "usage": {
    "daily_count": 8,
    "daily_limit": 10,
    "remaining": 2
  }
}
```

**Error Responses:**
- 429 Too Many Requests: Daily limit exceeded

### GET /api/bias-usage/limits

Retrieves usage limits based on subscription tier.

**Response (200 OK):**
```json
{
  "success": true,
  "limits": {
    "free": {
      "daily_limit": 3,
      "monthly_limit": null,
      "unlimited": false
    },
    "monthly": {
      "daily_limit": 10,
      "monthly_limit": null,
      "unlimited": false
    },
    "annual": {
      "daily_limit": null,
      "monthly_limit": null,
      "unlimited": true
    }
  }
}
```

## Analysis Endpoints

### POST /api/bias-analysis/analyze

Performs bias analysis on submitted article text using Gemini integration.

**Headers (Optional for authenticated users):**
```
Authorization: Bearer jwt-token-string
```

**Request Body:**
```json
{
  "article_text": "Full article text content here...",
  "article_url": "https://example.com/article",
  "article_title": "Article Title"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "analysis": {
    "bias_score": 0.75,
    "bias_type": "conservative",
    "confidence": 0.89,
    "explanation": "The article shows conservative bias through selective sourcing and framing...",
    "key_indicators": [
      "Loaded language favoring conservative viewpoints",
      "Omission of liberal perspectives",
      "Cherry-picked statistics"
    ],
    "word_count": 1500,
    "analysis_timestamp": "2024-01-01T12:00:00Z"
  },
  "usage": {
    "daily_count": 8,
    "daily_limit": 10,
    "remaining": 2
  }
}
```

**Error Responses:**
- 400 Bad Request: Missing or invalid article text
- 429 Too Many Requests: Usage limit exceeded
- 503 Service Unavailable: Gemini API error

## JWT Token Requirements

### Token Structure
- **Algorithm**: HS256
- **Expiration**: 24 hours for regular tokens, 7 days for "remember me"
- **Payload**:
```json
{
  "user_id": "uuid-string",
  "email": "user@example.com",
  "subscription_tier": "monthly",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Token Validation
- All protected endpoints must validate JWT tokens
- Expired tokens should return 401 Unauthorized
- Invalid signatures should return 401 Unauthorized
- Token refresh mechanism should be implemented for long sessions

## IP-Based Tracking for Anonymous Users

### Implementation Requirements
- **IP Hashing**: Store SHA-256 hash of IP address for privacy
- **Daily Reset**: Reset counters at midnight UTC
- **Rate Limiting**: Implement per-IP rate limiting (max 5 requests per minute)
- **Storage**: Track usage in temporary storage (Redis recommended)

### Anonymous User Tracking Schema
```json
{
  "ip_hash": "sha256-hash-of-ip",
  "daily_count": 2,
  "last_request": "2024-01-01T12:00:00Z",
  "reset_date": "2024-01-01"
}
```

## Error Response Format

All API endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "Daily usage limit exceeded. Upgrade to continue.",
    "details": {
      "current_usage": 3,
      "daily_limit": 3,
      "reset_time": "2024-01-02T00:00:00Z"
    }
  }
}
```

## Rate Limiting

### Per-Endpoint Limits
- **Authentication endpoints**: 5 requests per minute per IP
- **Analysis endpoint**: 1 request per 10 seconds per user/IP
- **Usage tracking**: 10 requests per minute per user/IP

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1704067260
```

## Security Requirements

### Authentication Security
- Passwords must be hashed using bcrypt with salt rounds ≥ 12
- Implement account lockout after 5 failed login attempts
- JWT secrets must be stored securely and rotated regularly

### API Security
- All endpoints must validate input data
- Implement CORS policies for frontend domains only
- Use HTTPS for all API communications
- Sanitize all user inputs to prevent injection attacks

### Privacy Protection
- IP addresses must be hashed before storage
- User data must be encrypted at rest
- Implement data retention policies (delete logs after 90 days)

## Environment Variables

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bias_detection_db

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash

# Redis Configuration (for anonymous user tracking)
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
```

### Gemini Integration Configuration
The Gemini API key is essential for the bias analysis functionality. The service uses:
- **Model**: gemini-1.5-flash for optimal performance and cost
- **Rate Limits**: Respect Gemini's API rate limits (15 requests per minute)
- **Error Handling**: Implement retry logic with exponential backoff
- **Fallback**: Graceful degradation when Gemini API is unavailable