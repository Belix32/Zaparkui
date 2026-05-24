-- ============================================================================
-- Migration: Create promotions table for banners/offers system
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create the promotions table
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

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions (is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_sort ON promotions (sort_order);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions (starts_at, ends_at);

-- 3. Enable Row Level Security
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies:
--    - Anyone can read active promotions
--    - Only authenticated users with admin/moderator role can manage

-- Public read access (for the banner to work)
CREATE POLICY "Public can view active promotions"
  ON promotions
  FOR SELECT
  USING (
    is_active = true 
    AND starts_at <= now() 
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Admins can read all promotions
CREATE POLICY "Admins can view all promotions"
  ON promotions
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- Admins can insert promotions
CREATE POLICY "Admins can create promotions"
  ON promotions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- Admins can update promotions
CREATE POLICY "Admins can update promotions"
  ON promotions
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- Admins can delete promotions
CREATE POLICY "Admins can delete promotions"
  ON promotions
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- 5. Insert a sample promotion to test
INSERT INTO promotions (title, description, bg_color, text_color, sort_order, starts_at, ends_at)
VALUES (
  'Добро пожаловать в Запаркуй!',
  'Найдите удобное парковочное место в вашем ЖК',
  '#2563eb',
  '#ffffff',
  1,
  now(),
  NULL
);
