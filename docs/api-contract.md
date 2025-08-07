# Bias Detection Service API Contract

## Overview
Complete API specification for the Keisha News bias detection micro-SaaS backend service.

**Base URL**: `http://localhost:3002/api` (development)
**Production URL**: `https://api.keisha.ai/api` (production)

## Authentication

### POST /bias-auth/register
Register a new user for the bias detection service.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "free",
    "daily_usage_count": 0
  },
  "token": "jwt-token-string"
}
```

### POST /bias-auth/login
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com", 
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "monthly",
    "daily_usage_count": 3
  },
  "token": "jwt-token-string"
}
```

### GET /bias-auth/profile
Get current user profile (requires JWT token).

**Headers:**
```
Authorization: Bearer jwt-token-string
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "subscription_tier": "monthly",
    "daily_usage_count": 3,
    "usage_limit": 10,
    "subscription_expires_at": "2024-02-01T00:00:00Z"
  }
}
```

## Usage Tracking

### GET /bias-usage/current
Get current usage for authenticated user or anonymous IP.

**Headers (optional):**
```
Authorization: Bearer jwt-token-string
```

**Response (200):**
```json
{
  "success": true,
  "usage": {
    "daily_count": 2,
    "limit": 3,
    "remaining": 1,
    "resets_at": "2024-01-02T00:00:00Z",
    "subscription_tier": "free"
  }
}
```

### POST /bias-usage/increment
Increment usage counter (called before analysis).

**Headers (optional):**
```
Authorization: Bearer jwt-token-string
```

**Response (200):**
```json
{
  "success": true,
  "usage": {
    "daily_count": 3,
    "limit": 3,
    "remaining": 0
  }
}
```

**Response (429 - Limit Exceeded):**
```json
{
  "success": false,
  "error": "USAGE_LIMIT_EXCEEDED",
  "message": "Daily usage limit exceeded",
  "usage": {
    "daily_count": 3,
    "limit": 3,
    "remaining": 0,
    "resets_at": "2024-01-02T00:00:00Z"
  }
}
```

## Analysis

### POST /bias-analysis/analyze
Analyze article for bias (requires usage increment first).

**Request:**
```json
{
  "article_text": "Full article text here...",
  "article_title": "Article Title",
  "article_url": "https://example.com/article"
}
```

**Response (200):**
```json
{
  "success": true,
  "analysis": {
    "bias_score": 0.75,
    "bias_type": "racial",
    "confidence": 0.89,
    "summary": "Analysis summary...",
    "key_phrases": ["phrase1", "phrase2"],
    "translation": "Translated version exposing bias...",
    "processing_time_ms": 1250
  },
  "usage": {
    "daily_count": 3,
    "remaining": 0
  }
}
```

## Payment Processing

### POST /bias-payments/create-subscription
Create new subscription (integrates with existing Coinbase system).

**Request:**
```json
{
  "tier": "monthly",
  "payment_method": "bitcoin",
  "user_id": "uuid-string"
}
```

**Response (200):**
```json
{
  "success": true,
  "payment_url": "https://commerce.coinbase.com/checkout/...",
  "subscription_id": "uuid-string"
}
```

### POST /bias-payments/webhook/coinbase
Handle Coinbase payment webhooks.

**Request:** (Coinbase webhook payload)

**Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {} // Optional additional details
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_REQUIRED` - Missing or invalid JWT token
- `USAGE_LIMIT_EXCEEDED` - Daily usage limit reached
- `SUBSCRIPTION_REQUIRED` - Premium feature requires subscription
- `ANALYSIS_FAILED` - Gemini API error or processing failure
- `PAYMENT_FAILED` - Payment processing error
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting
- **Anonymous users**: 10 requests per minute per IP
- **Authenticated users**: 30 requests per minute per user
- **Analysis endpoint**: 5 requests per minute per user/IP

## Security Requirements
- All endpoints must validate input data
- JWT tokens expire after 24 hours
- IP addresses must be hashed before storage
- HTTPS required in production
- CORS restricted to approved domains