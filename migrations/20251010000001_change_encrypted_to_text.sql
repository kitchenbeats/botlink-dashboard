-- Change api_key_encrypted from bytea to text
ALTER TABLE team_api_keys ALTER COLUMN api_key_encrypted TYPE text USING api_key_encrypted::text;
