-- ====================================================================
-- ЗАПАРКУЙ (ZAPARKYI) — Чистая схема БД v2
-- ====================================================================
-- Применяется на чистый проект Supabase.
-- 1. Supabase Dashboard → SQL Editor
-- 2. Выполнить этот файл
-- 3. Authentication → Settings → Disable "Confirm email"
-- 4. Зарегистрироваться → выполнить UPDATE для админа
-- ====================================================================

-- ====================================================================
-- 1. Расширения
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. profiles — профили пользователей
-- ====================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 3. parkings — парковки
-- ====================================================================
CREATE TABLE parkings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0 AND price <= 1000000),
  spots INTEGER NOT NULL CHECK (spots > 0 AND spots <= 10000),
  image TEXT,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  district TEXT,
  metro TEXT,
  parking_type TEXT DEFAULT 'underground' CHECK (parking_type IN ('ground', 'underground', 'roof', 'covered')),
  amenities TEXT[] DEFAULT '{}',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 4. bookings — бронирования
-- ====================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'cancelled', 'completed')),
  booking_type TEXT DEFAULT 'daily' CHECK (booking_type IN ('hourly', 'daily', 'monthly')),
  car_brand TEXT,
  car_model TEXT,
  car_number TEXT,
  total_price INTEGER,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT,
  payment_id TEXT,
  notes TEXT,
  start_time TIME,
  end_time TIME,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 5. reviews — отзывы
-- ====================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 6. favorites — избранное
-- ====================================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, parking_id)
);

-- ====================================================================
-- 7. Индексы
-- ====================================================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_auth ON profiles(auth_id);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_parkings_owner ON parkings(owner_id);
CREATE INDEX idx_parkings_price ON parkings(price);
CREATE INDEX idx_parkings_district ON parkings(district);
CREATE INDEX idx_parkings_metro ON parkings(metro);
CREATE INDEX idx_parkings_parking_type ON parkings(parking_type);
CREATE INDEX idx_parkings_is_active ON parkings(is_active);
CREATE INDEX idx_parkings_status ON parkings(status);
CREATE INDEX idx_parkings_rating ON parkings(rating DESC);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_parking ON bookings(parking_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX idx_reviews_parking ON reviews(parking_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_parking ON favorites(parking_id);

-- ====================================================================
-- 8. Триггер: авто-обновление updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parkings_updated_at BEFORE UPDATE ON parkings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================================
-- 9. Триггер: пересчёт рейтинга парковки при изменении отзывов
-- ====================================================================
CREATE OR REPLACE FUNCTION update_parking_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE parkings SET
      rating = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM reviews WHERE parking_id = OLD.parking_id AND status = 'approved'), 0),
      review_count = (SELECT count(*) FROM reviews WHERE parking_id = OLD.parking_id AND status = 'approved')
    WHERE id = OLD.parking_id;
    RETURN OLD;
  ELSE
    UPDATE parkings SET
      rating = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM reviews WHERE parking_id = NEW.parking_id AND status = 'approved'), 0),
      review_count = (SELECT count(*) FROM reviews WHERE parking_id = NEW.parking_id AND status = 'approved')
    WHERE id = NEW.parking_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_parking_rating();

-- ====================================================================
-- 10. Триггер: создание профиля при регистрации
-- ====================================================================
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (auth_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (auth_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- ====================================================================
-- 11. RLS (Row Level Security)
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Очистка старых политик
DROP POLICY IF EXISTS "Anyone can view active parkings" ON parkings;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
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
DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
DROP POLICY IF EXISTS "Admins can create parking" ON parkings;
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user" ON profiles;

-- profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = auth_id);

-- parkings (public)
CREATE POLICY "Anyone can view active parkings" ON parkings
  FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can insert parking" ON parkings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update parking" ON parkings
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete parking" ON parkings
  FOR DELETE USING (auth.uid() = owner_id);

-- bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create booking" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own booking" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- reviews
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Users can create review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Админ-политики (проверка profiles.role)
CREATE POLICY "Admins can view all parkings" ON parkings
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY "Admins can create parking" ON parkings
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update any parking" ON parkings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete any parking" ON parkings
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY "Admins can update any booking" ON bookings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Admins can view all users" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.auth_id = auth.uid() AND p2.role = 'admin'));
CREATE POLICY "Admins can update any user" ON profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.auth_id = auth.uid() AND p2.role = 'admin'));

-- ====================================================================
-- 12. Seed-данные: 8 парковок
-- ====================================================================
INSERT INTO parkings (id, title, address, price, spots, description, district, metro, parking_type, latitude, longitude, rating, review_count, is_active, status) VALUES
  ('6dca4830-f410-409d-8878-9c123a268507', 'ЖК Северный', 'Москва, ул. Ленина, 25', 8000, 5, 'Подземный паркинг с видеонаблюдением', 'Северный', 'Полежаевская', 'underground', 55.7942, 37.5235, 4.5, 12, true, 'active'),
  ('c6fdeaa3-35bb-4b06-967c-940ff900737e', 'ЖК Парковый', 'Москва, пр-т Мира, 42', 12000, 2, 'Охраняемая парковка в центре города', 'ЦАО', 'Проспект Мира', 'underground', 55.7800, 37.6325, 4.8, 8, true, 'active'),
  ('d3c4da9e-6f43-4aa3-9ab0-83b31392d6f6', 'ЖК Речной', 'Москва, ул. Набережная, 18', 9500, 8, 'Просторная наземная парковка', 'САО', 'Речной вокзал', 'ground', 55.8542, 37.4745, 4.2, 15, true, 'active'),
  ('212d6f0c-b080-4b1a-82e8-2928e7bd02d6', 'ЖК Центральный', 'Москва, ул. Тверская, 10', 15000, 3, 'Премиум паркинг в самом центре', 'ЦАО', 'Тверская', 'underground', 55.7600, 37.6155, 4.9, 20, true, 'active'),
  ('aa1478f2-ef6e-4af8-929a-e52901ffa63c', 'ЖК Южный', 'Москва, ул. Южная, 5', 7000, 6, 'Доступный паркинг на юге Москвы', 'Южный', 'Кантемировская', 'ground', 55.6400, 37.6550, 4.1, 9, true, 'active'),
  ('f35c7b9e-8a17-4c6b-b5d0-5a2e9f7c3d1a', 'БЦ Москва-Сити', 'Москва, Пресненская наб., 12', 25000, 10, 'Многоуровневый паркинг в деловом центре', 'ЦАО', 'Деловой центр', 'covered', 55.7500, 37.5400, 4.7, 25, true, 'active'),
  ('b8e1f2a3-9b4c-5d6e-7f8a-9b0c1d2e3f4a', 'ТЦ Европейский', 'Москва, пл. Киевского Вокзала, 2', 15000, 8, 'Паркинг рядом с Киевским вокзалом', 'ЦАО', 'Киевская', 'roof', 55.7436, 37.5642, 4.3, 18, true, 'active'),
  ('e7d6c5b4-a3b2-4c1d-0e9f-8a7b6c5d4e3f', 'ЖК Воробьёвы горы', 'Москва, ул. Косыгина, 12', 18000, 4, 'Паркинг с панорамным видом', 'ЗАО', 'Воробьёвы горы', 'underground', 55.7100, 37.5450, 4.6, 14, true, 'active')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 13. Назначение админа (выполнить ПОСЛЕ регистрации)
-- ====================================================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'ilya.cheplya@yandex.ru';
-- ====================================================================

SELECT '✅ Supabase v2 schema ready!' AS status;
