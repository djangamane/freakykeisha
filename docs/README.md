# Keisha AI Bias Detection Service Documentation

This directory contains comprehensive documentation for the bias detection micro-SaaS backend implementation.

## Documentation Structure

### API Documentation
- **`api-contract.md`** - Complete API specification for backend team
- **`frontend-integration.md`** - Frontend-backend integration patterns

### Database Documentation  
- **`database-schema.sql`** - Complete PostgreSQL database schema
- **`migration-guide.md`** - Database setup and migration instructions

### Implementation Guides
- **`backend-implementation.md`** - Step-by-step backend development guide
- **`deployment-checklist.md`** - Production deployment checklist

## Quick Start for Backend Team

1. Read `api-contract.md` for complete API specification
2. Set up database using `database-schema.sql`
3. Follow `backend-implementation.md` for step-by-step implementation
4. Deploy using `deployment-checklist.md`

## Technology Stack
- Node.js 18+ with Express.js
- PostgreSQL 14+ database
- Redis for caching and rate limiting
- JWT authentication
- Google Gemini API integration
- Coinbase Commerce for payments

## Environment Variables Required
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/bias_detection
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
COINBASE_API_KEY=your-coinbase-api-key
PORT=3002
NODE_ENV=production
```