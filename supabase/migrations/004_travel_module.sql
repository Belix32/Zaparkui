-- ====================================================================
-- ЗАПАРКУЙ (ZAPARKYI) — Модуль: Поездки на море v1
-- ====================================================================
-- Добавляет таблицы для аренды авто + хранения своего авто
-- при поездках на море (Сочи, Анапа, Геленджик).
-- Партнёры встречают у моря → выдают арендную машину →
-- забирают твою на хранение.
-- ====================================================================

-- ====================================================================
-- 1. Расширения
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. travel_destinations — курортные города
-- ====================================================================
CREATE TABLE travel_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  region TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 3. rental_partners — компании-партнёры по аренде
-- ====================================================================
CREATE TABLE rental_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  commission_rate DECIMAL(5, 2) DEFAULT 15.00,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 4. partner_locations — офисы партнёров (выдача/приём/стоянка)
-- ====================================================================
CREATE TABLE partner_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES rental_partners(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES travel_destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  has_storage BOOLEAN DEFAULT true,
  has_rental BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 5. partner_cars — автомобили для аренды
-- ====================================================================
CREATE TABLE partner_cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES rental_partners(id) ON DELETE CASCADE,
  location_id UUID REFERENCES partner_locations(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  seats INTEGER DEFAULT 5,
  price_per_day INTEGER NOT NULL CHECK (price_per_day > 0),
  deposit INTEGER DEFAULT 0,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 6. travel_bookings — брони: аренда + хранение
-- ====================================================================
CREATE TABLE travel_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES travel_destinations(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES rental_partners(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES partner_cars(id) ON DELETE CASCADE,
  location_id UUID REFERENCES partner_locations(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rental_price_per_day INTEGER,
  total_rental_days INTEGER,
  total_rental_price INTEGER,
  has_storage BOOLEAN DEFAULT true,
  storage_price_per_day INTEGER DEFAULT 0,
  total_storage_days INTEGER,
  total_storage_price INTEGER DEFAULT 0,
  own_car_brand TEXT,
  own_car_model TEXT,
  own_car_color TEXT,
  own_car_license_plate TEXT,
  total_price INTEGER NOT NULL,
  commission_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partially_refunded')),
  payment_method TEXT,
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 7. car_storage — записи хранения автомобиля пользователя
-- ====================================================================
CREATE TABLE car_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  travel_booking_id UUID NOT NULL REFERENCES travel_bookings(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES rental_partners(id) ON DELETE CASCADE,
  location_id UUID REFERENCES partner_locations(id) ON DELETE SET NULL,
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_color TEXT,
  car_license_plate TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_storage', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 8. Индексы
-- ====================================================================
-- travel_destinations
CREATE INDEX idx_destinations_slug ON travel_destinations(slug);
CREATE INDEX idx_destinations_is_active ON travel_destinations(is_active);
CREATE INDEX idx_destinations_sort_order ON travel_destinations(sort_order);

-- rental_partners
CREATE INDEX idx_partners_slug ON rental_partners(slug);
CREATE INDEX idx_partners_is_active ON rental_partners(is_active);

-- partner_locations
CREATE INDEX idx_locations_partner ON partner_locations(partner_id);
CREATE INDEX idx_locations_destination ON partner_locations(destination_id);

-- partner_cars
CREATE INDEX idx_cars_partner ON partner_cars(partner_id);
CREATE INDEX idx_cars_location ON partner_cars(location_id);
CREATE INDEX idx_cars_is_active ON partner_cars(is_active);
CREATE INDEX idx_cars_is_available ON partner_cars(is_available);
CREATE INDEX idx_cars_brand ON partner_cars(brand);
CREATE INDEX idx_cars_price ON partner_cars(price_per_day);

-- travel_bookings
CREATE INDEX idx_travel_bookings_user ON travel_bookings(user_id);
CREATE INDEX idx_travel_bookings_destination ON travel_bookings(destination_id);
CREATE INDEX idx_travel_bookings_partner ON travel_bookings(partner_id);
CREATE INDEX idx_travel_bookings_car ON travel_bookings(car_id);
CREATE INDEX idx_travel_bookings_status ON travel_bookings(status);
CREATE INDEX idx_travel_bookings_dates ON travel_bookings(start_date, end_date);

-- car_storage
CREATE INDEX idx_storage_booking ON car_storage(travel_booking_id);
CREATE INDEX idx_storage_partner ON car_storage(partner_id);
CREATE INDEX idx_storage_location ON car_storage(location_id);
CREATE INDEX idx_storage_status ON car_storage(status);
CREATE INDEX idx_storage_dates ON car_storage(check_in_date, check_out_date);

-- ====================================================================
-- 9. Триггер: авто-обновление updated_at
-- ====================================================================
-- Функция update_updated_at() определена в миграции 002
CREATE TRIGGER trg_rental_partners_updated_at BEFORE UPDATE ON rental_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_partner_cars_updated_at BEFORE UPDATE ON partner_cars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_travel_bookings_updated_at BEFORE UPDATE ON travel_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_car_storage_updated_at BEFORE UPDATE ON car_storage FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================================
-- 10. RLS (Row Level Security)
-- ====================================================================
ALTER TABLE travel_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_storage ENABLE ROW LEVEL SECURITY;

-- Очистка старых политик (на случай повторного применения)
DROP POLICY IF EXISTS "Anyone can view active destinations" ON travel_destinations;
DROP POLICY IF EXISTS "Admins can manage destinations" ON travel_destinations;
DROP POLICY IF EXISTS "Anyone can view active partners" ON rental_partners;
DROP POLICY IF EXISTS "Admins can manage partners" ON rental_partners;
DROP POLICY IF EXISTS "Anyone can view locations" ON partner_locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON partner_locations;
DROP POLICY IF EXISTS "Anyone can view active available cars" ON partner_cars;
DROP POLICY IF EXISTS "Admins can manage cars" ON partner_cars;
DROP POLICY IF EXISTS "Users can view own travel bookings" ON travel_bookings;
DROP POLICY IF EXISTS "Users can create travel booking" ON travel_bookings;
DROP POLICY IF EXISTS "Users can update own travel booking" ON travel_bookings;
DROP POLICY IF EXISTS "Admins can manage travel bookings" ON travel_bookings;
DROP POLICY IF EXISTS "Users can view own car storage" ON car_storage;
DROP POLICY IF EXISTS "Admins can manage car storage" ON car_storage;

-- travel_destinations: публичный SELECT (только active), админский CRUD
CREATE POLICY "Anyone can view active destinations" ON travel_destinations
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage destinations" ON travel_destinations
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- rental_partners: публичный SELECT (только active), админский CRUD
CREATE POLICY "Anyone can view active partners" ON rental_partners
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage partners" ON rental_partners
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- partner_locations: публичный SELECT, админский CRUD
CREATE POLICY "Anyone can view locations" ON partner_locations
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON partner_locations
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- partner_cars: публичный SELECT (active + available), админский CRUD
CREATE POLICY "Anyone can view active available cars" ON partner_cars
  FOR SELECT USING (is_active = true AND is_available = true);
CREATE POLICY "Admins can manage cars" ON partner_cars
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- travel_bookings: пользователь видит/создаёт/обновляет свои, админ — всё
CREATE POLICY "Users can view own travel bookings" ON travel_bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create travel booking" ON travel_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel booking" ON travel_bookings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage travel bookings" ON travel_bookings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- car_storage: пользователь видит свои записи, админ — всё
CREATE POLICY "Users can view own car storage" ON car_storage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM travel_bookings
      WHERE travel_bookings.id = car_storage.travel_booking_id
      AND travel_bookings.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage car storage" ON car_storage
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')));

-- ====================================================================
-- 11. Seed-данные: курорты, партнёры, локации, автомобили
-- ====================================================================

-- Курортные города
INSERT INTO travel_destinations (id, name, slug, description, region, latitude, longitude, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Сочи', 'sochi', 'Жемчужина Черноморского побережья Кавказа — субтропики, горы и море', 'Краснодарский край', 43.60280000, 39.73430000, 1),
  ('a0000000-0000-4000-8000-000000000002', 'Анапа', 'anapa', 'Солнце, песчаные пляжи и целебный воздух — главный детский курорт России', 'Краснодарский край', 44.89440000, 37.31670000, 2),
  ('a0000000-0000-4000-8000-000000000003', 'Геленджик', 'gelendzhik', 'Уютные бухты, набережная-рекордсмен и живописные окрестности', 'Краснодарский край', 44.56110000, 38.07670000, 3)
ON CONFLICT (id) DO NOTHING;

-- Партнёры по аренде
INSERT INTO rental_partners (id, name, slug, description, commission_rate, rating) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'АвтоМоре Сочи', 'avtomore-sochi', 'Крупнейший прокат автомобилей на Черноморском побережье. Работаем с 2015 года.', 15.00, 4.7),
  ('b0000000-0000-4000-8000-000000000002', 'Южный Прокат', 'yuzhny-prokat', 'Надёжный партнёр для ваших поездок. Широкий выбор авто от эконом до премиум.', 12.00, 4.5)
ON CONFLICT (id) DO NOTHING;

-- Локации: АвтоМоре Сочи (3 шт: в каждом городе)
INSERT INTO partner_locations (id, partner_id, destination_id, name, address, latitude, longitude, phone, has_storage, has_rental) VALUES
  ('c0000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'АвтоМоре — Сочи Центр', 'ул. Курортный проспект, 89, Сочи', 43.58550000, 39.72280000, '+7 (862) 200-10-01', true, true),
  ('c0000000-0000-4000-8000-000000000102', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'АвтоМоре — Анапа', 'ул. Ленина, 12, Анапа', 44.89350000, 37.31850000, '+7 (861) 330-20-02', true, true),
  ('c0000000-0000-4000-8000-000000000103', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003',
   'АвтоМоре — Геленджик', 'ул. Революционная, 45, Геленджик', 44.56200000, 38.07550000, '+7 (861) 410-30-03', true, true)
ON CONFLICT (id) DO NOTHING;

-- Локации: Южный Прокат (3 шт: в каждом городе)
INSERT INTO partner_locations (id, partner_id, destination_id, name, address, latitude, longitude, phone, has_storage, has_rental) VALUES
  ('c0000000-0000-4000-8000-000000000201', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Южный Прокат — Сочи', 'ул. Навагинская, 7, Сочи', 43.58700000, 39.72400000, '+7 (862) 250-40-04', true, true),
  ('c0000000-0000-4000-8000-000000000202', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'Южный Прокат — Анапа', 'пр-т Пионерский, 38, Анапа', 44.89200000, 37.32000000, '+7 (861) 330-50-05', true, true),
  ('c0000000-0000-4000-8000-000000000203', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003',
   'Южный Прокат — Геленджик', 'ул. Горького, 20, Геленджик', 44.56300000, 38.07400000, '+7 (861) 410-60-06', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: АвтоМоре Сочи → Сочи (4 машины)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000101',
   'Hyundai', 'Solaris', 2021, 'Белый', 'С001АМ 123', 'automatic', 'gasoline', 5, 2500, 5000, 'Экономичный надёжный седан для городских поездок', true, true),
  ('d0000000-0000-4000-8000-000000000102', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000101',
   'Kia', 'Rio', 2022, 'Серебристый', 'С002ВМ 123', 'automatic', 'gasoline', 5, 2800, 5000, 'Современный лифтбек с полным набором опций', true, true),
  ('d0000000-0000-4000-8000-000000000103', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000101',
   'Volkswagen', 'Polo', 2021, 'Чёрный', 'С003ЕК 123', 'manual', 'gasoline', 5, 2600, 5000, 'Немецкое качество по доступной цене', true, true),
  ('d0000000-0000-4000-8000-000000000104', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000101',
   'Toyota', 'Camry', 2023, 'Белый', 'С004КМ 123', 'automatic', 'gasoline', 5, 4500, 10000, 'Комфортный бизнес-седан для дальних поездок', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: АвтоМоре Сочи → Анапа (4 машины)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-000000000105', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000102',
   'Lada', 'Vesta', 2022, 'Синий', 'А005ВС 123', 'manual', 'gasoline', 5, 1800, 3000, 'Бюджетный вариант для поездки на море', true, true),
  ('d0000000-0000-4000-8000-000000000106', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000102',
   'Renault', 'Logan', 2021, 'Белый', 'А006МР 123', 'manual', 'gasoline', 5, 2000, 3000, 'Практичный седан без лишних затрат', true, true),
  ('d0000000-0000-4000-8000-000000000107', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000102',
   'Skoda', 'Octavia', 2022, 'Серебристый', 'А007ОА 123', 'automatic', 'gasoline', 5, 3200, 7000, 'Просторный лифтбек для семьи', true, true),
  ('d0000000-0000-4000-8000-000000000108', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000102',
   'Nissan', 'Qashqai', 2023, 'Серый', 'А008КК 123', 'automatic', 'gasoline', 5, 4000, 8000, 'Кроссовер с высоким клиренсом для любых дорог', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: АвтоМоре Сочи → Геленджик (4 машины)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-000000000109', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000103',
   'Hyundai', 'Creta', 2022, 'Белый', 'Г009КР 123', 'automatic', 'gasoline', 5, 3000, 6000, 'Популярный кроссовер для города и трассы', true, true),
  ('d0000000-0000-4000-8000-00000000010a', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000103',
   'Kia', 'Sportage', 2023, 'Синий', 'Г010СП 123', 'automatic', 'gasoline', 5, 3500, 7000, 'Яркий стильный кроссовер с богатой комплектацией', true, true),
  ('d0000000-0000-4000-8000-00000000010b', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000103',
   'Mitsubishi', 'Outlander', 2022, 'Чёрный', 'Г011АУ 123', 'automatic', 'gasoline', 5, 3800, 8000, 'Семиместный внедорожник для большой компании', true, true),
  ('d0000000-0000-4000-8000-00000000010c', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000103',
   'BMW', 'X5', 2023, 'Чёрный', 'Г012ВМ 123', 'automatic', 'diesel', 5, 8000, 20000, 'Премиальный немецкий внедорожник с дизельным двигателем', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: Южный Прокат → Сочи (5 машин)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-000000000201', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000201',
   'Renault', 'Duster', 2022, 'Оранжевый', 'С101ДС 123', 'manual', 'gasoline', 5, 2200, 4000, 'Неубиваемый кроссовер для любых дорожных условий', true, true),
  ('d0000000-0000-4000-8000-000000000202', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000201',
   'Hyundai', 'Tucson', 2023, 'Белый', 'С102ТС 123', 'automatic', 'gasoline', 5, 3500, 7000, 'Современный кроссовер с передовыми технологиями', true, true),
  ('d0000000-0000-4000-8000-000000000203', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000201',
   'Toyota', 'RAV4', 2023, 'Серый', 'С103РВ 123', 'automatic', 'hybrid', 5, 4000, 8000, 'Экономичный гибридный кроссовер — лидер продаж', true, true),
  ('d0000000-0000-4000-8000-000000000204', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000201',
   'Mercedes-Benz', 'E-Class', 2022, 'Чёрный', 'С104МВ 123', 'automatic', 'diesel', 5, 7000, 15000, 'Бизнес-класс с максимальным комфортом', true, true),
  ('d0000000-0000-4000-8000-000000000205', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000201',
   'BMW', '3 Series', 2023, 'Синий', 'С105ВМ 123', 'automatic', 'gasoline', 5, 5500, 12000, 'Спортивный седан с драйверским характером', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: Южный Прокат → Анапа (5 машин)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-000000000206', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000202',
   'Lada', 'Granta', 2022, 'Белый', 'А106ГР 123', 'manual', 'gasoline', 5, 1500, 2000, 'Самый доступный автомобиль в прокате', true, true),
  ('d0000000-0000-4000-8000-000000000207', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000202',
   'Kia', 'Cerato', 2021, 'Красный', 'А107СЕ 123', 'automatic', 'gasoline', 5, 2500, 5000, 'Элегантный седан для комфортных поездок', true, true),
  ('d0000000-0000-4000-8000-000000000208', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000202',
   'Skoda', 'Rapid', 2022, 'Серый', 'А108РП 123', 'manual', 'gasoline', 5, 2200, 4000, 'Просторный лифтбек с большим багажником', true, true),
  ('d0000000-0000-4000-8000-000000000209', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000202',
   'Volkswagen', 'Tiguan', 2023, 'Белый', 'А109ТГ 123', 'automatic', 'gasoline', 5, 3800, 8000, 'Надёжный немецкий кроссовер для всей семьи', true, true),
  ('d0000000-0000-4000-8000-00000000020a', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000202',
   'Toyota', 'Land Cruiser Prado', 2022, 'Чёрный', 'А110ПР 123', 'automatic', 'diesel', 7, 10000, 25000, 'Настоящий внедорожник для путешествий в любой комфорт', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Автомобили: Южный Прокат → Геленджик (5 машин)
-- ====================================================================
INSERT INTO partner_cars (id, partner_id, location_id, brand, model, year, color, license_plate, transmission, fuel_type, seats, price_per_day, deposit, description, is_available, is_active) VALUES
  ('d0000000-0000-4000-8000-00000000020b', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000203',
   'Chevrolet', 'Niva', 2021, 'Зелёный', 'Г111НИ 123', 'manual', 'gasoline', 5, 2000, 3000, 'Легендарный вездеход для активного отдыха', true, true),
  ('d0000000-0000-4000-8000-00000000020c', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000203',
   'Hyundai', 'Elantra', 2022, 'Белый', 'Г112ЭЛ 123', 'automatic', 'gasoline', 5, 2600, 5000, 'Динамичный седан с ярким дизайном', true, true),
  ('d0000000-0000-4000-8000-00000000020d', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000203',
   'Mazda', 'CX-5', 2023, 'Красный', 'Г113МЗ 123', 'automatic', 'gasoline', 5, 3800, 8000, 'Японский кроссовер с неповторимым стилем', true, true),
  ('d0000000-0000-4000-8000-00000000020e', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000203',
   'Audi', 'Q5', 2022, 'Серебристый', 'Г114АУ 123', 'automatic', 'diesel', 5, 6000, 15000, 'Премиальный немецкий кроссовер с дизелем', true, true),
  ('d0000000-0000-4000-8000-00000000020f', 'b0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000203',
   'Nissan', 'X-Trail', 2023, 'Синий', 'Г115НИ 123', 'automatic', 'gasoline', 5, 3500, 7000, 'Просторный семейный кроссовер с панорамной крышей', true, true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
SELECT '✅ Модуль "Поездки на море" развёрнут: 3 курорта, 2 партнёра, 6 локаций, 27 авто' AS status;
