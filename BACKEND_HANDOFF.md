# 🚀 Backend Implementation Handoff

## 📋 Overview
Complete documentation package for implementing the Keisha News bias detection micro-SaaS backend service.

## 📁 Documentation Location
All documentation is now in the `docs/` folder:

```
docs/
├── README.md                    # Overview and quick start
├── api-contract.md              # ⭐ CRITICAL: Complete API specification  
├── database-schema.sql          # ⭐ CRITICAL: PostgreSQL database schema
├── backend-implementation.md    # ⭐ CRITICAL: Step-by-step implementation guide
└── deployment-checklist.md      # Production deployment checklist
```

## 🎯 Implementation Priority

### Phase 1: Setup (Week 1)
1. **Read Documentation** (1 day)
   - `docs/api-contract.md` - Complete API specification
   - `docs/database-schema.sql` - Database schema
   - `docs/backend-implementation.md` - Implementation guide

2. **Environment Setup** (2 days)
   - Set up Node.js project structure
   - Install dependencies (Express, PostgreSQL, Redis, JWT)
   - Configure environment variables
   - Set up PostgreSQL database with schema

3. **Basic Server** (2 days)
   - Create Express server on port 3002
   - Set up CORS, security middleware
   - Create basic route structure
   - Test server startup

### Phase 2: Authentication (Week 2)
1. **Database Connection** (1 day)
   - Set up PostgreSQL connection pool
   - Test database connectivity
   - Create user model

2. **Auth Endpoints** (3 days)
   - POST /api/bias-auth/register
   - POST /api/bias-auth/login  
   - GET /api/bias-auth/profile
   - JWT middleware implementation

3. **Testing** (1 day)
   - Unit tests for auth endpoints
   - Integration tests with database

### Phase 3: Usage Tracking (Week 2)
1. **Usage Service** (2 days)
   - Implement usage tracking for authenticated users
   - Implement IP-based tracking for anonymous users
   - Daily limit enforcement

2. **Usage Endpoints** (2 days)
   - GET /api/bias-usage/current
   - POST /api/bias-usage/increment
   - Rate limiting middleware

3. **Redis Integration** (1 day)
   - Set up Redis for caching
   - Implement rate limiting with Redis

### Phase 4: Analysis Engine (Week 3)
1. **Gemini Integration** (3 days)
   - Set up Google Gemini API client
   - Implement article analysis service
   - Error handling and retries

2. **Analysis Endpoint** (2 days)
   - POST /api/bias-analysis/analyze
   - Usage limit checks before analysis
   - Response formatting and validation

### Phase 5: Payment Integration (Week 4)
1. **Extend Coinbase Integration** (3 days)
   - Integrate with existing Coinbase system
   - Implement subscription creation
   - Webhook handling for payment confirmation

2. **Subscription Management** (2 days)
   - Update user subscription tiers
   - Handle subscription expiration
   - Usage limit updates based on tier

### Phase 6: Testing & Deployment (Week 5)
1. **Comprehensive Testing** (3 days)
   - Unit tests for all services
   - Integration tests for complete flows
   - Load testing for performance
   - Security testing

2. **Production Deployment** (2 days)
   - Set up production environment
   - Deploy using deployment checklist
   - Frontend integration testing
   - Monitoring setup

## 🔧 Technology Stack

### Required Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Caching**: Redis 6+
- **Authentication**: JWT
- **AI Integration**: Google Gemini API
- **Payment**: Coinbase Commerce API

### Key Dependencies
```bash
npm install express cors helmet dotenv
npm install jsonwebtoken bcryptjs
npm install pg redis
npm install axios rate-limiter-flexible
npm install joi express-validator
```

## 🌐 Environment Variables

### Required Configuration
```bash
# Server
PORT=3002
NODE_ENV=production

# Database  
DATABASE_URL=postgresql://user:password@localhost:5432/bias_detection

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# AI Integration
GEMINI_API_KEY=your-gemini-api-key-here

# Payment Processing
COINBASE_API_KEY=your-coinbase-api-key-here
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://keisha.ai
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## 🔗 Frontend Integration Points

The frontend is **already implemented** and expects these exact endpoints:

### Authentication
- `POST /api/bias-auth/register`
- `POST /api/bias-auth/login`
- `GET /api/bias-auth/profile`

### Usage Tracking  
- `GET /api/bias-usage/current`
- `POST /api/bias-usage/increment`

### Analysis
- `POST /api/bias-analysis/analyze`

### Payments
- `POST /api/bias-payments/create-subscription`
- `POST /api/bias-payments/webhook/coinbase`

## ⚠️ Critical Requirements

### Service Separation
- **Separate backend service** (not part of main Keisha AI backend)
- **Port 3002** (main app uses 3001)
- **Independent database** with `bias_` table prefixes
- **Separate authentication** system (not shared with main app)

### Usage Limits
- **Free tier**: 3 analyses per day
- **Monthly tier**: 10 analyses per day  
- **Annual tier**: Unlimited analyses
- **Anonymous users**: Tracked by hashed IP address

### Security Requirements
- **Rate limiting**: 30 req/min per user, 10 req/min per IP
- **Input validation**: All endpoints must validate input
- **HTTPS**: Required in production
- **CORS**: Restricted to approved domains
- **JWT tokens**: 24-hour expiration
- **IP hashing**: Privacy protection for anonymous users

## 🧪 Testing Requirements

### Unit Tests
- Authentication service
- Usage tracking service  
- Gemini integration service
- Payment processing

### Integration Tests
- Complete user registration/login flow
- Usage tracking and limit enforcement
- Analysis with Gemini API
- Payment webhook processing

### Load Tests
- Concurrent analysis requests
- Rate limiting under load
- Database performance

## 📊 Success Metrics

### Performance Targets
- **API response time**: <500ms (95th percentile)
- **Database queries**: <100ms (95th percentile)
- **Uptime**: >99.9%
- **Error rate**: <1%

### Load Targets
- **Concurrent users**: 100+
- **Requests per second**: 50+
- **Analysis requests per minute**: 20+

## ✅ Definition of Done

Backend implementation is complete when:

- [ ] All API endpoints implemented per contract
- [ ] Database schema deployed and working
- [ ] Authentication system functional
- [ ] Usage tracking working for users and IPs
- [ ] Analysis integration with Gemini working
- [ ] Payment processing integrated with Coinbase
- [ ] Rate limiting implemented and tested
- [ ] Error handling consistent across all endpoints
- [ ] Unit and integration tests passing
- [ ] Load testing completed successfully
- [ ] Frontend integration successful
- [ ] Production deployment complete
- [ ] Monitoring and logging active

## 📞 Support

### Documentation References
- **API Questions**: `docs/api-contract.md`
- **Database Questions**: `docs/database-schema.sql`  
- **Implementation Questions**: `docs/backend-implementation.md`
- **Deployment Questions**: `docs/deployment-checklist.md`

### Key Implementation Notes
1. This is a **separate service** from the main Keisha AI backend
2. Frontend is **already implemented** and waiting for backend
3. Must integrate with **existing Coinbase payment system**
4. **Usage tracking** is critical for the freemium model
5. **Rate limiting** is essential to prevent abuse
6. **Error responses** must match exact format in API contract

## 🎯 Timeline

**Target Completion**: 5 weeks
- **Week 1**: Setup and infrastructure
- **Week 2**: Authentication and usage tracking  
- **Week 3**: Analysis engine with Gemini
- **Week 4**: Payment integration
- **Week 5**: Testing and deployment

The frontend team is ready and waiting for the backend implementation! 🚀

---

**Next Steps:**
1. Review all documentation in `docs/` folder
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular check-ins with frontend team for integration testing