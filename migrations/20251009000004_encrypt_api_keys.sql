-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Add encrypted column
ALTER TABLE public.team_api_keys
    ADD COLUMN IF NOT EXISTS api_key_encrypted bytea;

-- Note: Step 2 (encrypting existing keys) and Step 3 (dropping api_key column)
-- are skipped because the api_key column was already removed in migration 20250910124212_remove_raw_keys.sql

-- Step 4: Update the trigger to use encrypted storage
CREATE OR REPLACE FUNCTION public.post_user_signup()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $post_user_signup$
DECLARE
    team_id uuid;
    raw_api_key text;
    api_key_hex text;
    api_key_bytes bytea;
    api_key_hash text;
    encryption_key text;
BEGIN
    RAISE NOTICE 'Creating default team for user %', NEW.id;

    -- Create team
    INSERT INTO public.teams(name, tier, email)
    VALUES (NEW.email, 'base_v1', NEW.email)
    RETURNING id INTO team_id;

    -- Link user to team
    INSERT INTO public.users_teams(user_id, team_id, is_default)
    VALUES (NEW.id, team_id, true);

    RAISE NOTICE 'Created default team for user % and team %', NEW.id, team_id;

    -- Generate API key
    api_key_hex := encode(extensions.gen_random_bytes(20), 'hex');
    raw_api_key := 'e2b_' || api_key_hex;

    -- Calculate SHA256 hash
    api_key_bytes := decode(api_key_hex, 'hex');
    api_key_hash := '$sha256$' || rtrim(encode(sha256(api_key_bytes), 'base64'), '=');

    -- Encryption key (same as in env vars)
    encryption_key := 'CIPI7FTOctKUT+AyNjs1gIdSU7yD7vonP1/KNsDLs60=';

    -- Insert API key with encrypted storage
    INSERT INTO public.team_api_keys (
        team_id,
        api_key_encrypted,
        api_key_hash,
        api_key_prefix,
        api_key_length,
        api_key_mask_prefix,
        api_key_mask_suffix
    ) VALUES (
        team_id,
        extensions.pgp_sym_encrypt(raw_api_key, encryption_key),
        api_key_hash,
        'e2b_',
        40,
        substring(api_key_hex from 1 for 2),
        substring(api_key_hex from 37 for 4)
    );

    RAISE NOTICE 'Created encrypted API key for team %', team_id;

    -- Generate access token
    INSERT INTO public.access_tokens (user_id)
    VALUES (NEW.id);

    -- Call extension hook
    PERFORM public.extra_for_post_user_signup(NEW.id, team_id);

    RETURN NEW;
END
$post_user_signup$ SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.post_user_signup() OWNER TO trigger_user;

-- Recreate trigger
DROP TRIGGER IF EXISTS post_user_signup ON auth.users;
CREATE TRIGGER post_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION post_user_signup();

-- Step 5: Grant permissions for decryption
-- Create a secure function to decrypt API keys (only accessible to authenticated users)
CREATE OR REPLACE FUNCTION public.get_team_api_key(team_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    encrypted_key bytea;
    decrypted_key text;
    encryption_key text;
    user_is_member boolean;
BEGIN
    -- Check if current user is a member of the team
    SELECT EXISTS (
        SELECT 1 FROM users_teams
        WHERE user_id = auth.uid() AND team_id = team_uuid
    ) INTO user_is_member;

    IF NOT user_is_member THEN
        RAISE EXCEPTION 'Access denied: not a member of this team';
    END IF;

    -- Get encrypted key
    SELECT api_key_encrypted INTO encrypted_key
    FROM team_api_keys
    WHERE team_id = team_uuid
    LIMIT 1;

    IF encrypted_key IS NULL THEN
        RETURN NULL;
    END IF;

    -- Decrypt
    encryption_key := 'CIPI7FTOctKUT+AyNjs1gIdSU7yD7vonP1/KNsDLs60=';
    decrypted_key := extensions.pgp_sym_decrypt(encrypted_key, encryption_key);

    RETURN decrypted_key;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_api_key(uuid) TO authenticated;

-- Grant pgcrypto functions to necessary roles
-- These grants allow the functions to be used in triggers and by authenticated users
GRANT EXECUTE ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres, trigger_user, authenticated, anon;
GRANT EXECUTE ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres, trigger_user, authenticated, anon;

-- Also grant on public schema versions if they exist
DO $$
BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION pgp_sym_encrypt(text, text) TO postgres, trigger_user, authenticated, anon';
EXCEPTION WHEN undefined_function THEN
    NULL; -- Function doesn't exist in public schema, that's fine
END$$;

DO $$
BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION pgp_sym_decrypt(bytea, text) TO postgres, trigger_user, authenticated, anon';
EXCEPTION WHEN undefined_function THEN
    NULL; -- Function doesn't exist in public schema, that's fine
END$$;
