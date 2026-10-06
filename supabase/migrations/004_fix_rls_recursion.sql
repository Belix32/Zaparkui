-- ====================================================================
-- Исправление бесконечной рекурсии в RLS политиках (infinite recursion)
-- ====================================================================

-- 1. Создаем SECURITY DEFINER функции для проверки прав администратора/модератора,
-- чтобы избежать рекурсивных запросов к таблице profiles внутри политик profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Удаляем старые рекурсивные политики для profiles и других таблиц
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Admins can update any user" ON profiles;

DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
DROP POLICY IF EXISTS "Admins can create parking" ON parkings;
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;

DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

-- 3. Создаем новые безопасные политики с использованием функций

-- profiles
CREATE POLICY "Admins can view all users" ON profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update any user" ON profiles
  FOR UPDATE USING (public.is_admin());

-- parkings
CREATE POLICY "Admins can view all parkings" ON parkings
  FOR SELECT USING (public.is_admin_or_moderator());
CREATE POLICY "Admins can create parking" ON parkings
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update any parking" ON parkings
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete any parking" ON parkings
  FOR DELETE USING (public.is_admin());

-- bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (public.is_admin_or_moderator());
CREATE POLICY "Admins can update any booking" ON bookings
  FOR UPDATE USING (public.is_admin_or_moderator());

-- reviews
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (public.is_admin_or_moderator());

SELECT '✅ RLS infinite recursion fixed!' AS status;
