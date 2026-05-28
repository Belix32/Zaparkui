-- ====================================================================
-- ЗАПАРКУЙ (ZAPARKYI) — Роль partner + кабинет партнёра
-- ====================================================================
-- Добавляет роль 'partner' в profiles, создаёт seed-партнёров
-- ====================================================================

-- 1. Обновляем CHECK-ограничение в profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'moderator', 'admin', 'partner'));

-- 2. Индекс для быстрого поиска партнёров
CREATE INDEX IF NOT EXISTS idx_profiles_role_partner ON profiles(role) WHERE role = 'partner';

SELECT '✅ Partner role ready!' AS status;
