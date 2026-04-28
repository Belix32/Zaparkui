-- Fix RLS policies for users table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create policies that allow authenticated users to manage their own profile
CREATE POLICY "Users can read own profile" ON users 
  FOR SELECT TO authenticated 
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = auth_id);

-- Also allow service role to insert (for triggers)
GRANT INSERT ON users TO service_role;

SELECT 'RLS policies fixed for users table!' AS status;