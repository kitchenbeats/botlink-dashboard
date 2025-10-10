-- Supabase already provides auth schema, authenticated role, auth.uid() and auth.users
-- Just ensure postgres has execute permission on auth.uid()
GRANT EXECUTE ON FUNCTION auth.uid() TO postgres;

