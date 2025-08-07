# Backend Implementation Guide

## Project Setup

### 1. Initialize Node.js Project
```bash
mkdir keisha-bias-backend
cd keisha-bias-backend
npm init -y
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install express cors helmet dotenv
npm install jsonwebtoken bcryptjs
npm install pg redis
npm install axios rate-limiter-flexible
npm install joi express-validator

# Development dependencies
npm install -D nodemon jest supertest
```

### 3. Project Structure
```
keisha-bias-backend/
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usageController.js
│   │   ├── analysisController.js
│   │   └── paymentController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Usage.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── usage.js
│   │   ├── analysis.js
│   │   └── payments.js
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── authService.js
│   │   └── paymentService.js
│   └── utils/
│       ├── logger.js
│       └── helpers.js
└── tests/
    ├── auth.test.js
    ├── usage.test.js
    └── analysis.test.js
```

### 4. Environment Variables
Create `.env.example`:
```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bias_detection

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Coinbase Commerce
COINBASE_API_KEY=your-coinbase-api-key-here
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://keisha.ai

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## Core Implementation

### 1. Database Connection (`src/config/database.js`)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### 2. Authentication Middleware (`src/middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted
    const blacklistCheck = await pool.query(
      'SELECT 1 FROM jwt_blacklist WHERE token_hash = $1',
      [require('crypto').createHash('sha256').update(token).digest('hex')]
    );
    
    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_INVALID',
        message: 'Token has been invalidated'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'TOKEN_INVALID',
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateToken };
```

### 3. Usage Tracking Service (`src/services/usageService.js`)
```javascript
const pool = require('../config/database');
const crypto = require('crypto');

class UsageService {
  static hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  static async getCurrentUsage(userId, ip) {
    if (userId) {
      // Authenticated user
      const result = await pool.query(
        `SELECT daily_usage_count, subscription_tier, 
                CASE 
                  WHEN subscription_tier = 'free' THEN 3
                  WHEN subscription_tier = 'monthly' THEN 10
                  ELSE 999999
                END as usage_limit
         FROM bias_users WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      return {
        daily_count: user.daily_usage_count,
        limit: user.usage_limit,
        remaining: Math.max(0, user.usage_limit - user.daily_usage_count),
        subscription_tier: user.subscription_tier
      };
    } else {
      // Anonymous user
      const ipHash = this.hashIP(ip);
      const result = await pool.query(
        `SELECT daily_count FROM anonymous_usage_tracking 
         WHERE ip_hash = $1 AND reset_date = CURRENT_DATE`,
        [ipHash]
      );
      
      const dailyCount = result.rows.length > 0 ? result.rows[0].daily_count : 0;
      return {
        daily_count: dailyCount,
        limit: 3,
        remaining: Math.max(0, 3 - dailyCount),
        subscription_tier: 'anonymous'
      };
    }
  }

  static async incrementUsage(userId, ip) {
    if (userId) {
      // Authenticated user
      await pool.query(
        'UPDATE bias_users SET daily_usage_count = daily_usage_count + 1 WHERE id = $1',
        [userId]
      );
    } else {
      // Anonymous user
      const ipHash = this.hashIP(ip);
      await pool.query(
        `INSERT INTO anonymous_usage_tracking (ip_hash, daily_count, reset_date)
         VALUES ($1, 1, CURRENT_DATE)
         ON CONFLICT (ip_hash) 
         DO UPDATE SET 
           daily_count = CASE 
             WHEN anonymous_usage_tracking.reset_date = CURRENT_DATE 
             THEN anonymous_usage_tracking.daily_count + 1
             ELSE 1
           END,
           reset_date = CURRENT_DATE,
           last_request = NOW()`,
        [ipHash]
      );
    }
  }
}

module.exports = UsageService;
```

### 4. Gemini Integration (`src/services/geminiService.js`)
```javascript
const axios = require('axios');

class GeminiService {
  static async analyzeArticle(articleText, articleTitle) {
    const prompt = `Analyze this news article for racial bias and white fragility patterns. 
    
Article Title: ${articleTitle}
Article Text: ${articleText}

Provide analysis in this JSON format:
{
  "bias_score": 0.0-1.0,
  "bias_type": "racial|economic|political|none",
  "confidence": 0.0-1.0,
  "summary": "Brief analysis summary",
  "key_phrases": ["phrase1", "phrase2"],
  "translation": "Rewritten version exposing underlying bias"
}`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Analysis failed');
    }
  }
}

module.exports = GeminiService;
```

### 5. Main Server (`server.js`)
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/auth');
const usageRoutes = require('./src/routes/usage');
const analysisRoutes = require('./src/routes/analysis');
const paymentRoutes = require('./src/routes/payments');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/bias-auth', authRoutes);
app.use('/api/bias-usage', usageRoutes);
app.use('/api/bias-analysis', analysisRoutes);
app.use('/api/bias-payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`Bias Detection API server running on port ${PORT}`);
});
```

## Testing

### 1. Unit Tests (`tests/auth.test.js`)
```javascript
const request = require('supertest');
const app = require('../server');

describe('Authentication Endpoints', () => {
  test('POST /api/bias-auth/register should create new user', async () => {
    const response = await request(app)
      .post('/api/bias-auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.token).toBeDefined();
  });
});
```

## Deployment

### 1. Production Environment Variables
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://user:password@prod-db:5432/bias_detection
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret
GEMINI_API_KEY=production-gemini-key
COINBASE_API_KEY=production-coinbase-key
ALLOWED_ORIGINS=https://keisha.ai,https://www.keisha.ai
```

### 2. Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["node", "server.js"]
```

### 3. Database Migration
```bash
# Run database schema
psql -d bias_detection -f docs/database-schema.sql

# Set up cron job for daily cleanup
0 2 * * * psql -d bias_detection -c "SELECT reset_daily_usage(); SELECT cleanup_expired_tokens();"
```

This implementation guide provides everything needed to build the bias detection backend service!