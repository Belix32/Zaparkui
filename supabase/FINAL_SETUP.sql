-- =============================================================================
-- ЗАПАРКУЙ (ZAPARKYI) - Supabase Database Setup
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: users (IF NOT EXISTS won't add columns, so we use ALTER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(200),
  phone VARCHAR(50),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

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
  images TEXT[],
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
  owner_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if not exist
ALTER TABLE parkings ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE parkings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- ============================================================================
-- Table: bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'cancelled', 'completed')),
  booking_type VARCHAR(20) DEFAULT 'daily' CHECK (booking_type IN ('hourly', 'daily', 'monthly')),
  car_brand VARCHAR(100),
  car_model VARCHAR(100),
  car_number VARCHAR(20),
  total_price INTEGER,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Table: favorites
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, parking_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_parkings_owner ON parkings(owner_id);
CREATE INDEX IF NOT EXISTS idx_parkings_price ON parkings(price);
CREATE INDEX IF NOT EXISTS idx_parkings_district ON parkings(district);
CREATE INDEX IF NOT EXISTS idx_parkings_is_active ON parkings(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking ON bookings(parking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_parking ON reviews(parking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_parking ON favorites(parking_id);

-- ============================================================================
-- Enable RLS
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies - Drop existing first
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view active parkings" ON parkings;
DROP POLICY IF EXISTS "Authenticated can insert parking" ON parkings;
DROP POLICY IF EXISTS "Owner can update parking" ON parkings;
DROP POLICY IF EXISTS "Owner can delete parking" ON parkings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create booking" ON bookings;
DROP POLICY IF EXISTS "Users can update own booking" ON bookings;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create review" ON reviews;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Create policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Anyone can view active parkings" ON parkings FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can insert parking" ON parkings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update parking" ON parkings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete parking" ON parkings FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create booking" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own booking" ON bookings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create review" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can view all parkings" ON parkings FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can update any parking" ON parkings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can delete any parking" ON parkings FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can update any booking" ON bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE users.auth_id = auth.uid() AND users.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u2 WHERE u2.auth_id = auth.uid() AND u2.role = 'admin'));
CREATE POLICY "Admins can update any user" ON users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u2 WHERE u2.auth_id = auth.uid() AND u2.role = 'admin'));

-- ============================================================================
-- Auto-create user profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Make admin user
-- ============================================================================
UPDATE public.users SET role = 'admin' WHERE email = 'ilya.cheplya@yandex.ru';

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Database setup complete!' AS status;