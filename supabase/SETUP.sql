-- =============================================================================
-- ЗАПАРКУЙ (ZAPARKYI) - Supabase Database Setup
-- =============================================================================
-- How to use:
-- 1. Открой https://supabase.com/dashboard → твой проект → SQL Editor
-- 2. Скопируй и вставь этот код
-- 3. Нажми "Run"
-- =============================================================================

-- ============================================================================
-- STEP 1: Enable UUID extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Create enum for booking status
-- ============================================================================
CREATE TYPE IF NOT EXISTS booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

-- ============================================================================
-- STEP 3: Table - users (profile for authenticated users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(200),
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Table - parkings
-- ============================================================================
CREATE TABLE IF NOT EXISTS parkings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0 AND price <= 1000000),
  spots INTEGER NOT NULL CHECK (spots > 0 AND spots <= 10000),
  image TEXT,
  description TEXT,
  district VARCHAR(100),
  metro VARCHAR(100),
  parking_type VARCHAR(50) DEFAULT 'underground',
  amenities TEXT[],
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: Table - bookings
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: Table - reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: Table - favorites
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, parking_id)
);

-- ============================================================================
-- STEP 8: Create Indexes
-- ============================================================================
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);

-- Parkings indexes
CREATE INDEX IF NOT EXISTS idx_parkings_owner ON parkings(owner_id);
CREATE INDEX IF NOT EXISTS idx_parkings_price ON parkings(price);
CREATE INDEX IF NOT EXISTS idx_parkings_district ON parkings(district);
CREATE INDEX IF NOT EXISTS idx_parkings_is_active ON parkings(is_active);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking ON bookings(parking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_parking ON reviews(parking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_parking ON favorites(parking_id);

-- ============================================================================
-- STEP 9: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: RLS Policies
-- ============================================================================

-- USERS Policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- PARKINGS Policies (публичный просмотр, только владелец может управлять)
CREATE POLICY "Anyone can view active parkings" ON parkings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated can insert parking" ON parkings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update parking" ON parkings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete parking" ON parkings
  FOR DELETE USING (auth.uid() = owner_id);

-- BOOKINGS Policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create booking" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- REVIEWS Policies
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FAVORITES Policies
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 11: Function to auto-create user profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 12: Seed Data (sample parkings)
-- ============================================================================
INSERT INTO parkings (title, address, price, spots, district, metro, parking_type, rating, review_count) VALUES
  ('ЖК Северный', 'Москва, ул. Ленина, 25', 8000, 5, 'Северный', 'Полежаевская', 'underground', 4.5, 12),
  ('ЖК Парковый', 'Москва, пр-т Мира, 42', 12000, 2, 'ЦАО', 'Проспект Мира', 'underground', 4.8, 8),
  ('ЖК Речной', 'Москва, ул. Набережная, 18', 9500, 8, 'САО', 'Речной вокзал', 'ground', 4.2, 15),
  ('ЖК Центральный', 'Москва, ул. Тверская, 15', 15000, 3, 'ЦАО', 'Тверская', 'underground', 4.9, 5),
  ('ЖК Южный', 'Москва, ул. Южная, 33', 7000, 12, 'ЮАО', 'Южная', 'ground', 4.0, 20),
  ('ЖК Звездный', 'Москва, ул. Космонавтов, 7', 11000, 4, 'СВАО', 'ВДНХ', 'covered', 4.6, 7),
  ('ЖК Московский', 'Москва, ул. Арбат, 10', 18000, 2, 'ЦАО', 'Арбатская', 'underground', 5.0, 3),
  ('ЖК Войковский', 'Москва, Войковская, 5', 6500, 20, 'САО', 'Войковская', 'ground', 3.8, 25)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Database setup complete!' AS status;