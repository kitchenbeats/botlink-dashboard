/*
This migration creates a public view 'auth_users' that exposes selected columns
from the auth.users table, making it easier to query user data from the public schema.
*/

CREATE OR REPLACE VIEW public.auth_users AS
SELECT
    *
FROM auth.users;

-- Grant SELECT permissions to supabase_admin role
GRANT SELECT ON public.auth_users TO supabase_admin;
