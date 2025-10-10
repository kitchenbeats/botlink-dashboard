-- Disable the automatic signup trigger
DROP TRIGGER IF EXISTS post_user_signup ON auth.users;

-- Keep the function for reference but it won't be called automatically
-- We'll handle user/team creation in the application code
