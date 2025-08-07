# Frontend-Backend Integration Guide

## Overview
This guide provides comprehensive instructions for integrating the frontend application with the Keisha AI bias detection backend service.

## API Base URL Configuration

### Development
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

### Production
```javascript
const API_BASE_URL = 'https://api.keisha.ai/api';
```

## Authentication Flow

### 1. User Registration
```javascript
const registerUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bias-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store JWT token
      localStorage.setItem('authToken', data.token);
      return data.user;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};
```

### 2. User Login
```javascript
const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bias-auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      return data.user;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### 3. Get User Profile
```javascript
const getUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/bias-auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.user;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw error;
  }
};
```

## Usage Tracking Integration

### 1. Check Current Usage
```javascript
const getCurrentUsage = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/bias-usage/current`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.usage;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Failed to get usage:', error);
    throw error;
  }
};
```

### 2. Check Usage Limits Before Analysis
```javascript
const checkUsageLimit = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/bias-usage/check`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.canProceed;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Failed to check usage limit:', error);
    throw error;
  }
};
```

## Bias Analysis Integration

### 1. Analyze Article
```javascript
const analyzeArticle = async (articleText, articleTitle, articleUrl = '') => {
  const token = localStorage.getItem('authToken');
  
  try {
    // First check if user can proceed
    const canProceed = await checkUsageLimit();
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Please upgrade your plan or try again tomorrow.');
    }
    
    const response = await fetch(`${API_BASE_URL}/bias-analysis/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article_text: articleText,
        article_title: articleTitle,
        article_url: articleUrl
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.analysis;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
};
```

### 2. Get Analysis History (Authenticated Users Only)
```javascript
const getAnalysisHistory = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/bias-analysis/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.history;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Failed to get analysis history:', error);
    throw error;
  }
};
```

## Error Handling

### Standard Error Response Format
All API endpoints return errors in this format:
```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_REQUIRED` - Missing or invalid JWT token
- `USAGE_LIMIT_EXCEEDED` - Daily usage limit reached
- `SUBSCRIPTION_REQUIRED` - Premium feature requires subscription
- `ANALYSIS_FAILED` - AI analysis service error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### Error Handling Example
```javascript
const handleApiError = (error) => {
  switch (error.code) {
    case 'USAGE_LIMIT_EXCEEDED':
      // Show upgrade prompt or usage limit message
      showUsageLimitModal();
      break;
    case 'AUTHENTICATION_REQUIRED':
      // Redirect to login
      redirectToLogin();
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Show rate limit message
      showRateLimitMessage();
      break;
    default:
      // Show generic error message
      showErrorMessage(error.message);
  }
};
```

## React Integration Example

### Custom Hook for Bias Analysis
```javascript
import { useState, useCallback } from 'react';

export const useBiasAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const analyze = useCallback(async (articleText, articleTitle, articleUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await analyzeArticle(articleText, articleTitle, articleUrl);
      setResult(analysis);
      return analysis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { analyze, loading, error, result };
};
```

### Usage in Component
```javascript
import React, { useState } from 'react';
import { useBiasAnalysis } from './hooks/useBiasAnalysis';

const BiasAnalyzer = () => {
  const [articleText, setArticleText] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const { analyze, loading, error, result } = useBiasAnalysis();
  
  const handleAnalyze = async () => {
    try {
      await analyze(articleText, articleTitle);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Analysis failed:', error);
    }
  };
  
  return (
    <div>
      <input
        type="text"
        placeholder="Article Title"
        value={articleTitle}
        onChange={(e) => setArticleTitle(e.target.value)}
      />
      <textarea
        placeholder="Article Text"
        value={articleText}
        onChange={(e) => setArticleText(e.target.value)}
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze for Bias'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="analysis-result">
          <h3>Analysis Result</h3>
          <p><strong>Bias Score:</strong> {result.bias_score}</p>
          <p><strong>Bias Type:</strong> {result.bias_type}</p>
          <p><strong>Confidence:</strong> {result.confidence}</p>
          <p><strong>Summary:</strong> {result.summary}</p>
          {result.key_phrases && (
            <div>
              <strong>Key Phrases:</strong>
              <ul>
                {result.key_phrases.map((phrase, index) => (
                  <li key={index}>{phrase}</li>
                ))}
              </ul>
            </div>
          )}
          {result.translation && (
            <div>
              <strong>Rewritten Version:</strong>
              <p>{result.translation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BiasAnalyzer;
```

## CORS Configuration

Ensure your frontend domain is added to the backend's CORS configuration:

### Backend CORS Setup
```javascript
// In your backend .env file
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com,https://www.yourdomain.com
```

## Security Best Practices

### 1. Token Storage
- Store JWT tokens in localStorage for web apps
- Consider using httpOnly cookies for enhanced security in production
- Implement token refresh mechanism for long-lived sessions

### 2. Input Validation
- Always validate and sanitize user input on the frontend
- The backend also validates, but frontend validation improves UX

### 3. Rate Limiting Awareness
- Implement client-side rate limiting to prevent hitting server limits
- Show appropriate messages when rate limits are exceeded

### 4. Error Logging
- Log errors to your frontend monitoring service
- Don't expose sensitive information in error messages

## Testing Integration

### Unit Tests for API Functions
```javascript
// Example using Jest
describe('Bias Analysis API', () => {
  test('should analyze article successfully', async () => {
    const mockResponse = {
      success: true,
      analysis: {
        bias_score: 0.75,
        bias_type: 'racial',
        confidence: 0.89,
        summary: 'Test analysis'
      }
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await analyzeArticle('Test article', 'Test title');
    
    expect(result.bias_score).toBe(0.75);
    expect(result.bias_type).toBe('racial');
  });
});
```

This integration guide should help you connect your frontend seamlessly with the bias detection backend service!
