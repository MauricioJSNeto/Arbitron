-- Initialize databases for the crypto arbitrage bot

-- Create security database
CREATE DATABASE IF NOT EXISTS security_db;
CREATE DATABASE IF NOT EXISTS arbitrage_db;

-- Create user for security backend
CREATE USER IF NOT EXISTS 'security_user'@'%' IDENTIFIED BY 'security_pass';
GRANT ALL PRIVILEGES ON security_db.* TO 'security_user'@'%';

-- Create user for arbitrage engine
CREATE USER IF NOT EXISTS 'arbitrage_user'@'%' IDENTIFIED BY 'arbitrage_pass';
GRANT ALL PRIVILEGES ON arbitrage_db.* TO 'arbitrage_user'@'%';

-- Use security database
USE security_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'trader', 'viewer') DEFAULT 'trader',
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Use arbitrage database
USE arbitrage_db;

-- Exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trading pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
    id VARCHAR(36) PRIMARY KEY,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    exchange_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_trade_amount DECIMAL(20, 8),
    max_trade_amount DECIMAL(20, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id) ON DELETE CASCADE
);

-- Arbitrage opportunities table
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id VARCHAR(36) PRIMARY KEY,
    pair_symbol VARCHAR(20) NOT NULL,
    buy_exchange VARCHAR(50) NOT NULL,
    sell_exchange VARCHAR(50) NOT NULL,
    buy_price DECIMAL(20, 8) NOT NULL,
    sell_price DECIMAL(20, 8) NOT NULL,
    profit_percentage DECIMAL(5, 2) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    status ENUM('detected', 'executing', 'completed', 'failed') DEFAULT 'detected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(36) PRIMARY KEY,
    opportunity_id VARCHAR(36),
    exchange VARCHAR(50) NOT NULL,
    pair_symbol VARCHAR(20) NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status ENUM('pending', 'filled', 'cancelled', 'failed') DEFAULT 'pending',
    exchange_order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP NULL,
    FOREIGN KEY (opportunity_id) REFERENCES arbitrage_opportunities(id) ON DELETE SET NULL
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
(UUID(), 'max_trade_amount', '1000', 'Maximum trade amount in USD'),
(UUID(), 'min_profit_threshold', '0.5', 'Minimum profit percentage to execute trade'),
(UUID(), 'max_slippage', '0.1', 'Maximum allowed slippage percentage'),
(UUID(), 'trading_enabled', 'false', 'Enable/disable automatic trading'),
(UUID(), 'simulation_mode', 'true', 'Run in simulation mode');

-- Create indexes for better performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_arbitrage_opportunities_created_at ON arbitrage_opportunities(created_at);
CREATE INDEX idx_trades_opportunity_id ON trades(opportunity_id);
CREATE INDEX idx_trades_created_at ON trades(created_at);

FLUSH PRIVILEGES;
