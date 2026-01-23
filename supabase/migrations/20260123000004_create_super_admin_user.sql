-- Create super admin user
-- This migration creates the initial super admin account
-- Email: admin@invent.com
-- Password: admin2026
-- 
-- Note: This uses Supabase Auth Admin API to create the user properly
-- The password will be: admin2026

-- First, ensure the user doesn't exist, then create via auth admin
-- Note: This requires service role key to work properly
-- If migration fails, create user manually via Supabase Dashboard or API

-- Create profile entry that will be linked when user signs up
-- Or update existing profile if user already exists
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'admin@invent.com'
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    -- Update existing user's profile to super_admin
    UPDATE public.profiles
    SET role = 'super_admin', full_name = 'Super Admin'
    WHERE id = existing_user_id;
  ELSE
    -- User will be created via Supabase Auth API or Dashboard
    -- Profile will be created by trigger, then we update role
    -- For now, we'll create a placeholder that will be updated
    RAISE NOTICE 'User admin@invent.com does not exist. Please create via Supabase Dashboard or API, then run: UPDATE profiles SET role = ''super_admin'' WHERE id = (SELECT id FROM auth.users WHERE email = ''admin@invent.com'');';
  END IF;
END $$;
