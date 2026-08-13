-- Security hardening: prevent client-side privilege escalation on profiles.
-- Role and system columns may only be changed by the trusted admin path.

CREATE OR REPLACE FUNCTION public.is_admin_profile()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_system_column_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_profile() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.auth_id IS DISTINCT FROM OLD.auth_id OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.is_blocked IS DISTINCT FROM OLD.is_blocked OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'System profile fields can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_system_columns ON public.profiles;
CREATE TRIGGER protect_profile_system_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_system_column_changes();

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Admins can update any user" ON public.profiles;
CREATE POLICY "Admins can update any user" ON public.profiles
  FOR UPDATE
  USING (public.is_admin_profile())
  WITH CHECK (public.is_admin_profile());
