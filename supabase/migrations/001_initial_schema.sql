-- Supabase Database Migration for Запаркуй (Zaparkyi)
-- Version: 1.0.0
-- Date: 2026-04-22

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for booking status
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

-- ============================================================================
-- Table: parkings
-- ============================================================================
CREATE TABLE IF NOT EXISTS parkings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0 AND price <= 1000000),
  spots INTEGER NOT NULL CHECK (spots > 0 AND spots <= 10000),
  image TEXT,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for parkings
CREATE INDEX IF NOT EXISTS idx_parkings_owner ON parkings(owner_id);
CREATE INDEX IF NOT EXISTS idx_parkings_price ON parkings(price);
CREATE INDEX IF NOT EXISTS idx_parkings_spots ON parkings(spots);
CREATE INDEX IF NOT EXISTS idx_parkings_created ON parkings(created_at DESC);

-- Enable RLS
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parkings
CREATE POLICY "parkings_select_active" ON parkings
  FOR SELECT USING (is_active = true);

CREATE POLICY "parkings_insert_owner" ON parkings
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.role() = 'authenticated');

CREATE POLICY "parkings_update_owner" ON parkings
  FOR UPDATE USING (auth.uid() = owner_id OR auth.role() = 'service_role');

CREATE POLICY "parkings_delete_owner" ON parkings
  FOR DELETE USING (auth.uid() = owner_id OR auth.role() = 'service_role');

-- ============================================================================
-- Table: users (extends auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~* '^\+?[\d\s\-()]{10,}$')
);

-- Create index for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- Table: bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status booking_status DEFAULT 'pending',
  total_price INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_total_price CHECK (total_price IS NULL OR total_price > 0)
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking ON bookings(parking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ============================================================================
-- Function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_parkings_updated_at
  BEFORE UPDATE ON parkings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- View: parkings_with_availability
-- ============================================================================
CREATE OR REPLACE VIEW parkings_with_availability AS
SELECT 
  p.id,
  p.title,
  p.address,
  p.price,
  p.spots,
  p.image,
  p.description,
  p.created_at,
  p.is_active,
  COALESCE(
    p.spots - (
      SELECT COUNT(*)::INTEGER
      FROM bookings b
      WHERE b.parking_id = p.id
        AND b.status IN ('pending', 'confirmed')
        AND b.end_date >= CURRENT_DATE
    ),
    p.spots
  ) AS available_spots
FROM parkings p
WHERE p.is_active = true;

-- ============================================================================
-- Seed data (sample parkings)
-- ============================================================================
-- NOTE: These inserts require authenticated context or service role
-- Insert via Supabase dashboard or authenticated client

/*
INSERT INTO parkings (title, address, price, spots, image) VALUES
  ('ЖК Северный', 'Москва, ул. Ленина, 25', 8000, 5, null),
  ('ЖК Парковый', 'Москва, пр-т Мира, 42', 12000, 2, null),
  ('ЖК Речной', 'Москва, ул. Набережная, 18', 9500, 8, null),
  ('ЖК Центральный', 'Москва, ул. Тверская, 15', 15000, 3, null),
  ('ЖК Южный', 'Москва, ул. Южная, 33', 7000, 12, null),
  ('ЖК Звездный', 'Москва, ул. Космонавтов, 7', 11000, 4, null)
ON CONFLICT DO NOTHING;
*/