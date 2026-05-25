-- ====================================================================
-- ЗАПАРКУЙ (ZAPARKYI) — Миграция: добавляем недостающие таблицы
-- ====================================================================
-- Безопасно запускать на уже существующей БД.
-- Использует CREATE TABLE IF NOT EXISTS, триггеры с DROP IF EXISTS.
-- ====================================================================

-- ====================================================================
-- 1. profiles — профили пользователей (если нет)
-- ====================================================================
CREATE TABLE IF NOT EXISTS profiles (
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
-- 2. promotions — акции/баннеры (если нет)
-- ====================================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Подробнее',
  bg_color TEXT DEFAULT '#2563eb',
  text_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions (is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_sort ON promotions (sort_order);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions (starts_at, ends_at);

-- ====================================================================
-- 3. Индексы для profiles (если нет)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ====================================================================
-- 4. Триггер: авто-обновление updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================================
-- 5. Триггер: создание профиля при регистрации пользователя
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
-- 6. RLS для profiles (если ещё не включены)
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Profiles: политики
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = auth_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = auth_id);

-- Promotions: публичный SELECT (активные), админский CRUD
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT USING (
    is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
  );
DROP POLICY IF EXISTS "Admins can view all promotions" ON promotions;
CREATE POLICY "Admins can view all promotions" ON promotions
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator')));
DROP POLICY IF EXISTS "Admins can create promotions" ON promotions;
CREATE POLICY "Admins can create promotions" ON promotions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator')));
DROP POLICY IF EXISTS "Admins can update promotions" ON promotions;
CREATE POLICY "Admins can update promotions" ON promotions
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator')));
DROP POLICY IF EXISTS "Admins can delete promotions" ON promotions;
CREATE POLICY "Admins can delete promotions" ON promotions
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator')));

-- ====================================================================
-- 7. Админ-политики для других таблиц (если ещё нет)
-- ====================================================================
-- parkings: административные политики
DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
CREATE POLICY "Admins can view all parkings" ON parkings
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS "Admins can create parking" ON parkings;
CREATE POLICY "Admins can create parking" ON parkings
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
CREATE POLICY "Admins can update any parking" ON parkings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;
CREATE POLICY "Admins can delete any parking" ON parkings
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role = 'admin'));

-- bookings: административные политики
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
CREATE POLICY "Admins can update any booking" ON bookings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- reviews: административные политики
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- profiles: административные политики
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
CREATE POLICY "Admins can view all users" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.auth_id = auth.uid() AND p2.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update any user" ON profiles;
CREATE POLICY "Admins can update any user" ON profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.auth_id = auth.uid() AND p2.role = 'admin'));

-- ====================================================================
-- 8. Создать профили для уже существующих пользователей (если нужно)
-- ====================================================================
INSERT INTO profiles (auth_id, email, name)
SELECT id, email, raw_user_meta_data->>'name'
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

-- ====================================================================
-- 9. Тестовая акция для баннера
-- ====================================================================
INSERT INTO promotions (title, description, bg_color, text_color, sort_order, starts_at, ends_at)
VALUES (
  'Добро пожаловать в Запаркуй!',
  'Найдите удобное парковочное место в вашем ЖК',
  '#2563eb',
  '#ffffff',
  1,
  now(),
  NULL
) ON CONFLICT DO NOTHING;

-- ====================================================================
SELECT '✅ Миграция 003 завершена: profiles + promotions созданы' AS status;

