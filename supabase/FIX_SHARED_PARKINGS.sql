-- Fix RLS for shared parkings
-- Everyone can view and create parkings, owner can edit their own

-- Drop existing parkings policies
DROP POLICY IF EXISTS "Anyone can view active parkings" ON parkings;
DROP POLICY IF EXISTS "Authenticated can insert parking" ON parkings;
DROP POLICY IF EXISTS "Owner can update parking" ON parkings;
DROP POLICY IF EXISTS "Owner can delete parking" ON parkings;
DROP POLICY IF EXISTS "Admins can view all parkings" ON parkings;
DROP POLICY IF EXISTS "Admins can update any parking" ON parkings;
DROP POLICY IF EXISTS "Admins can delete any parking" ON parkings;

-- Anyone can view ALL active parkings (no auth required for viewing)
CREATE POLICY "Anyone can view active parkings" ON parkings 
  FOR SELECT USING (is_active = true);

-- Any authenticated user can create parking
CREATE POLICY "Any user can create parking" ON parkings 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Owner can update their parking
CREATE POLICY "Owner can update parking" ON parkings 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = owner_id);

-- Owner can delete their parking
CREATE POLICY "Owner can delete parking" ON parkings 
  FOR DELETE TO authenticated 
  USING (auth.uid() = owner_id);

-- Admin can view all
CREATE POLICY "Admins can view all parkings" ON parkings 
  FOR SELECT TO authenticated 
  USING (true);

-- Admin can update any
CREATE POLICY "Admins can update any parking" ON parkings 
  FOR UPDATE TO authenticated 
  USING (true);

-- Admin can delete any
CREATE POLICY "Admins can delete any parking" ON parkings 
  FOR DELETE TO authenticated 
  USING (true);

SELECT 'Parkings RLS fixed for shared access!' AS status;