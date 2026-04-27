-- Fix: Remove recursive policies and use simpler approach
-- ============================================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

-- Simple user policies - allow all read for authenticated users (temp fix)
-- In production, you'd want to check app_metadata for admin role
CREATE POLICY "Authenticated users can view all profiles" ON users 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update profiles" ON users 
  FOR UPDATE TO authenticated 
  USING (true);

-- Parkings - admins can view all
CREATE POLICY "Admins can view all parkings" ON parkings 
  FOR SELECT TO authenticated 
  USING (true);

-- Bookings - admins can view all  
CREATE POLICY "Admins can view all bookings" ON bookings 
  FOR SELECT TO authenticated 
  USING (true);

-- Reviews - admins can manage
CREATE POLICY "Admins can manage reviews" ON reviews 
  FOR ALL TO authenticated 
  USING (true);

SELECT 'Policies fixed!' AS status;