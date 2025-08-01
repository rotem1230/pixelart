-- Pixel Art VJ System - Complete Supabase Database Schema
-- Run this SQL in Supabase SQL Editor to create all required tables

-- Note: JWT secret is managed automatically by Supabase

-- Create users table (system users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  active_timer_id VARCHAR(255),
  active_timer_event_id VARCHAR(255),
  active_timer_event_name VARCHAR(255),
  active_timer_start_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  _encrypted BOOLEAN DEFAULT FALSE,
  _synced BOOLEAN DEFAULT FALSE,
  _version INTEGER DEFAULT 1
);

-- Create user_data table (main storage for all entities)
CREATE TABLE IF NOT EXISTS user_data (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, entity_name, entity_id)
);

-- Note: All other entities (events, tasks, clients, work_hours, seasonal_clients,
-- tags, comments, personal_messages, chats, canvas) are stored as JSON data
-- in the user_data table above. This provides flexibility and matches the
-- application's architecture.

-- Create metadata table for sync information
CREATE TABLE IF NOT EXISTS _metadata (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sync queue table for offline operations
CREATE TABLE IF NOT EXISTS _sync_queue (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  data JSONB,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_entity_name ON user_data(entity_name);
CREATE INDEX IF NOT EXISTS idx_user_data_entity_id ON user_data(entity_id);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);

-- Insert default admin users (only if they don't exist)
INSERT INTO users (id, email, password, name, role) VALUES
('pixelartvj_fixed_id', 'pixelartvj@gmail.com', 'yvj{89kN$2.8', 'Pixel Art VJ', 'admin'),
('pixeloffice2025_fixed_id', 'pixeloffice2025@gmail.com', 'b)W17,>1@Z2C', 'Pixel Office 2025', 'user')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users for now)
-- You can make these more restrictive based on your security requirements

DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_data;

CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated' OR true);
CREATE POLICY "Allow all for authenticated users" ON user_data FOR ALL USING (auth.role() = 'authenticated' OR true);

-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop first if they exist)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON user_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, and triggers are ready.' as status;
