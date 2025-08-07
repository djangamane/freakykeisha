-- Bias Detection Service Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for bias detection service
CREATE TABLE bias_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'monthly', 'annual')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE NULL,
    daily_usage_count INTEGER NOT NULL DEFAULT 0,
    last_usage_reset DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) NULL 
        CHECK (payment_method IN ('bitcoin', 'cashapp')),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Usage tracking for all requests
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL REFERENCES bias_users(id) ON DELETE SET NULL,
    ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of IP
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'bias_detection',
    article_title VARCHAR(500) NULL,
    article_url TEXT NULL,
    article_length INTEGER NOT NULL,
    bias_score DECIMAL(3,2) NULL CHECK (bias_score >= 0 AND bias_score <= 1),
    confidence_score DECIMAL(3,2) NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER NULL,
    gemini_tokens_used INTEGER NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Subscription records
CREATE TABLE bias_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES bias_users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('monthly', 'annual')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('bitcoin', 'cashapp')),
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(255) NOT NULL, -- Coinbase transaction ID
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'completed', 'failed')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Anonymous usage tracking (Redis alternative)
CREATE TABLE anonymous_usage_tracking (
    ip_hash VARCHAR(64) PRIMARY KEY,
    daily_count INTEGER NOT NULL DEFAULT 0,
    last_request TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- JWT token blacklist for logout
CREATE TABLE jwt_blacklist (
    token_hash VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bias_users_email ON bias_users(email);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_ip_hash ON usage_logs(ip_hash);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX idx_bias_subscriptions_user_id ON bias_subscriptions(user_id);
CREATE INDEX idx_anonymous_usage_ip ON anonymous_usage_tracking(ip_hash);

-- Function to reset daily usage counts
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    UPDATE bias_users 
    SET daily_usage_count = 0, last_usage_reset = CURRENT_DATE
    WHERE last_usage_reset < CURRENT_DATE;
    
    DELETE FROM anonymous_usage_tracking 
    WHERE reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM jwt_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bias_users_updated_at 
    BEFORE UPDATE ON bias_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();