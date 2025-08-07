# Database Schema Specification for Bias Detection Service

## Overview

This document specifies the database schema requirements for the news article bias detection micro-SaaS service. The schema supports user authentication, subscription management, usage tracking, and analysis logging while maintaining separation from the main Keisha AI application.

## Table Schemas

### bias_users

Stores user authentication and subscription information for the bias detection service.

```sql
CREATE TABLE bias_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'annual')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE NULL,
    daily_usage_count INTEGER NOT NULL DEFAULT 0,
    last_usage_reset DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) NULL CHECK (payment_method IN ('bitcoin', 'cashapp')),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255) NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP WITH TIME ZONE NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bias_users_email ON bias_users(email);
CREATE INDEX idx_bias_users_subscription_tier ON bias_users(subscription_tier);
CREATE INDEX idx_bias_users_subscription_expires ON bias_users(subscription_expires_at);
CREATE INDEX idx_bias_users_last_usage_reset ON bias_users(last_usage_reset);
CREATE INDEX idx_bias_users_created_at ON bias_users(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bias_users_updated_at 
    BEFORE UPDATE ON bias_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### usage_logs

Tracks all analysis requests for both authenticated and anonymous users.

```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES bias_users(id) ON DELETE SET NULL,
    ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of IP address
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'bias_detection',
    article_title VARCHAR(500) NULL,
    article_url TEXT NULL,
    article_length INTEGER NOT NULL,
    bias_score DECIMAL(3,2) NULL CHECK (bias_score >= 0 AND bias_score <= 1),
    bias_type VARCHAR(50) NULL,
    confidence_score DECIMAL(3,2) NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER NULL,
    gemini_tokens_used INTEGER NULL,
    user_agent TEXT NULL,
    referer TEXT NULL,
    session_id VARCHAR(255) NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_ip_hash ON usage_logs(ip_hash);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_usage_logs_analysis_type ON usage_logs(analysis_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_user_timestamp ON usage_logs(user_id, timestamp);
CREATE INDEX idx_usage_logs_ip_timestamp ON usage_logs(ip_hash, timestamp);

-- Composite index for daily usage queries
CREATE INDEX idx_usage_logs_daily_usage ON usage_logs(user_id, DATE(timestamp AT TIME ZONE 'UTC'));
CREATE INDEX idx_usage_logs_daily_usage_ip ON usage_logs(ip_hash, DATE(timestamp AT TIME ZONE 'UTC'));
```

### bias_subscriptions

Records payment transactions and subscription history.

```sql
CREATE TABLE bias_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES bias_users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('monthly', 'annual')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('bitcoin', 'cashapp')),
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_id VARCHAR(255) NOT NULL, -- Coinbase or Cash App transaction ID
    payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('coinbase', 'cashapp')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded')),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    cancellation_reason TEXT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    refunded_at TIMESTAMP WITH TIME ZONE NULL,
    refund_amount DECIMAL(10,2) NULL,
    webhook_data JSONB NULL, -- Store webhook payload for debugging
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bias_subscriptions_user_id ON bias_subscriptions(user_id);
CREATE INDEX idx_bias_subscriptions_payment_id ON bias_subscriptions(payment_id);
CREATE INDEX idx_bias_subscriptions_status ON bias_subscriptions(status);
CREATE INDEX idx_bias_subscriptions_expires_at ON bias_subscriptions(expires_at);
CREATE INDEX idx_bias_subscriptions_payment_status ON bias_subscriptions(payment_status);
CREATE INDEX idx_bias_subscriptions_created_at ON bias_subscriptions(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_bias_subscriptions_user_status ON bias_subscriptions(user_id, status);
CREATE INDEX idx_bias_subscriptions_user_expires ON bias_subscriptions(user_id, expires_at);

-- Trigger for updated_at
CREATE TRIGGER update_bias_subscriptions_updated_at 
    BEFORE UPDATE ON bias_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### anonymous_usage_tracking

Temporary storage for anonymous user usage tracking (Redis alternative for SQL databases).

```sql
CREATE TABLE anonymous_usage_tracking (
    ip_hash VARCHAR(64) PRIMARY KEY, -- SHA-256 hash of IP address
    daily_count INTEGER NOT NULL DEFAULT 0,
    last_request TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_anonymous_usage_reset_date ON anonymous_usage_tracking(reset_date);
CREATE INDEX idx_anonymous_usage_last_request ON anonymous_usage_tracking(last_request);

-- Trigger for updated_at
CREATE TRIGGER update_anonymous_usage_updated_at 
    BEFORE UPDATE ON anonymous_usage_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup old records (run daily)
CREATE INDEX idx_anonymous_usage_cleanup ON anonymous_usage_tracking(reset_date) 
WHERE reset_date < CURRENT_DATE - INTERVAL '7 days';
```

## Foreign Key Relationships

### Primary Relationships
- `usage_logs.user_id` → `bias_users.id` (nullable, SET NULL on delete)
- `bias_subscriptions.user_id` → `bias_users.id` (CASCADE on delete)

### Relationship Constraints
```sql
-- Ensure subscription dates are logical
ALTER TABLE bias_subscriptions 
ADD CONSTRAINT chk_subscription_dates 
CHECK (expires_at > starts_at);

-- Ensure payment amount is positive
ALTER TABLE bias_subscriptions 
ADD CONSTRAINT chk_positive_amount 
CHECK (amount_paid > 0);

-- Ensure usage counts are non-negative
ALTER TABLE bias_users 
ADD CONSTRAINT chk_non_negative_usage 
CHECK (daily_usage_count >= 0);

ALTER TABLE usage_logs 
ADD CONSTRAINT chk_positive_article_length 
CHECK (article_length > 0);
```

## Indexing Strategy

### Performance Indexes

#### High-Frequency Query Indexes
```sql
-- Daily usage queries (most frequent)
CREATE INDEX idx_daily_usage_user ON usage_logs(user_id, DATE(timestamp AT TIME ZONE 'UTC'))
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day';

CREATE INDEX idx_daily_usage_ip ON usage_logs(ip_hash, DATE(timestamp AT TIME ZONE 'UTC'))
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day';

-- Active subscription queries
CREATE INDEX idx_active_subscriptions ON bias_subscriptions(user_id, expires_at)
WHERE status = 'active' AND expires_at > NOW();

-- Recent usage for rate limiting
CREATE INDEX idx_recent_usage ON usage_logs(user_id, timestamp)
WHERE timestamp >= NOW() - INTERVAL '1 hour';

CREATE INDEX idx_recent_usage_ip ON usage_logs(ip_hash, timestamp)
WHERE timestamp >= NOW() - INTERVAL '1 hour';
```

#### Analytics and Reporting Indexes
```sql
-- Monthly usage analytics
CREATE INDEX idx_monthly_usage ON usage_logs(DATE_TRUNC('month', timestamp), analysis_type);

-- User growth analytics
CREATE INDEX idx_user_growth ON bias_users(DATE(created_at));

-- Revenue analytics
CREATE INDEX idx_revenue_analytics ON bias_subscriptions(DATE(created_at), tier, amount_paid)
WHERE payment_status = 'completed';
```

### Index Maintenance

#### Partial Indexes for Active Data
```sql
-- Only index recent usage logs (last 90 days)
CREATE INDEX idx_recent_usage_logs ON usage_logs(timestamp, user_id)
WHERE timestamp >= NOW() - INTERVAL '90 days';

-- Only index active users (logged in within 30 days)
CREATE INDEX idx_active_users ON bias_users(last_login_at, subscription_tier)
WHERE last_login_at >= NOW() - INTERVAL '30 days';
```

## Data Retention Policies

### Automated Cleanup Procedures

#### Usage Logs Cleanup
```sql
-- Delete usage logs older than 90 days (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM usage_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Log cleanup activity
    INSERT INTO system_logs (action, details, timestamp)
    VALUES ('usage_logs_cleanup', 
            'Deleted usage logs older than 90 days', 
            NOW());
END;
$$ LANGUAGE plpgsql;
```

#### Anonymous Usage Cleanup
```sql
-- Delete anonymous usage records older than 7 days (run daily)
CREATE OR REPLACE FUNCTION cleanup_anonymous_usage()
RETURNS void AS $$
BEGIN
    DELETE FROM anonymous_usage_tracking 
    WHERE reset_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

#### Expired Subscriptions Cleanup
```sql
-- Update expired subscriptions (run hourly)
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Mark expired subscriptions
    UPDATE bias_subscriptions 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    -- Downgrade users with expired subscriptions
    UPDATE bias_users 
    SET subscription_tier = 'free', 
        subscription_expires_at = NULL,
        updated_at = NOW()
    WHERE id IN (
        SELECT user_id FROM bias_subscriptions 
        WHERE status = 'expired' 
        AND updated_at >= NOW() - INTERVAL '1 hour'
    );
END;
$$ LANGUAGE plpgsql;
```

## Database Views

### User Analytics View
```sql
CREATE VIEW user_analytics AS
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    u.created_at as user_since,
    u.last_login_at,
    COUNT(ul.id) as total_analyses,
    COUNT(ul.id) FILTER (WHERE ul.timestamp >= CURRENT_DATE) as today_analyses,
    COUNT(ul.id) FILTER (WHERE ul.timestamp >= CURRENT_DATE - INTERVAL '30 days') as month_analyses,
    COALESCE(s.expires_at, NULL) as subscription_expires,
    COALESCE(s.amount_paid, 0) as total_paid
FROM bias_users u
LEFT JOIN usage_logs ul ON u.id = ul.user_id
LEFT JOIN bias_subscriptions s ON u.id = s.user_id AND s.status = 'active'
GROUP BY u.id, u.email, u.subscription_tier, u.created_at, u.last_login_at, s.expires_at, s.amount_paid;
```

### Daily Usage Summary View
```sql
CREATE VIEW daily_usage_summary AS
SELECT 
    DATE(timestamp AT TIME ZONE 'UTC') as usage_date,
    COUNT(*) as total_analyses,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_analyses,
    AVG(article_length) as avg_article_length,
    AVG(bias_score) as avg_bias_score,
    AVG(processing_time_ms) as avg_processing_time
FROM usage_logs
GROUP BY DATE(timestamp AT TIME ZONE 'UTC')
ORDER BY usage_date DESC;
```

## Backup and Recovery

### Backup Strategy
- **Full backup**: Daily at 2 AM UTC
- **Incremental backup**: Every 4 hours
- **Point-in-time recovery**: Enabled with 30-day retention
- **Cross-region replication**: For disaster recovery

### Critical Data Priority
1. **bias_users**: User accounts and subscription status
2. **bias_subscriptions**: Payment records and subscription history
3. **usage_logs**: Analysis history (last 30 days critical)
4. **anonymous_usage_tracking**: Can be rebuilt, lowest priority

## Performance Considerations

### Query Optimization
- Use prepared statements for frequent queries
- Implement connection pooling (recommended: 10-20 connections)
- Use read replicas for analytics queries
- Implement query result caching for usage limits

### Scaling Recommendations
- Partition `usage_logs` table by month when > 10M records
- Consider separate database for analytics queries
- Implement Redis for anonymous user tracking in high-traffic scenarios
- Use database connection pooling and read replicas for scaling