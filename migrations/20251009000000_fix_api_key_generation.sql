-- Update the post_user_signup trigger to properly generate and hash API keys
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
    -- Generate 20 random bytes and encode as hex (40 characters)
    api_key_hex := encode(extensions.gen_random_bytes(20), 'hex');
    raw_api_key := 'e2b_' || api_key_hex;

    -- Calculate SHA256 hash of the hex bytes (not the string)
    api_key_bytes := decode(api_key_hex, 'hex');
    api_key_hash := '$sha256$' || rtrim(encode(sha256(api_key_bytes), 'base64'), '=');

    -- Insert API key with hash, metadata, and raw key
    -- Note: api_key column exists and is nullable, we'll store the raw key here
    -- In production, this should be encrypted at rest or moved to a vault
    INSERT INTO public.team_api_keys (
        team_id,
        api_key,
        api_key_hash,
        api_key_prefix,
        api_key_length,
        api_key_mask_prefix,
        api_key_mask_suffix
    ) VALUES (
        team_id,
        raw_api_key,
        api_key_hash,
        'e2b_',
        40, -- Length of hex part (without prefix)
        substring(api_key_hex from 1 for 2), -- First 2 chars of hex
        substring(api_key_hex from 37 for 4) -- Last 4 chars of hex
    );

    RAISE NOTICE 'Created API key for team %: e2b_%...%', team_id, substring(api_key_hex from 1 for 4), substring(api_key_hex from 37 for 4);

    -- Generate access token
    INSERT INTO public.access_tokens (user_id)
    VALUES (NEW.id);

    -- Call extension hook
    PERFORM public.extra_for_post_user_signup(NEW.id, team_id);

    RETURN NEW;
END
$post_user_signup$ SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.post_user_signup() OWNER TO trigger_user;

-- Drop and recreate the trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS post_user_signup ON auth.users;
CREATE TRIGGER post_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION post_user_signup();
