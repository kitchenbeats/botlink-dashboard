-- Storage Bucket Configuration
--
-- Prerequisites:
-- 1. The 'profile-pictures' storage bucket must be created before applying these policies
--    Create it via the Supabase dashboard or with appropriate SQL commands
--
-- Policy Overview:
-- These policies configure access control for the profile-pictures bucket:
-- 1. Public read access: Anyone can download files with direct URLs
-- 2. Admin-only access: Only Supabase admin can:
--    - List files in the bucket
--    - Upload new files
--    - Update existing files
--    - Delete files

-- Allow public downloads via direct URLs
CREATE POLICY "Allow public access to individual files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures' AND true);

-- Restrict bucket browsing to admin
CREATE POLICY "Restrict listing files to admin only"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.role() = 'service_role');

-- Restrict file management to admin
CREATE POLICY "Restrict uploads to admin only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'service_role');

CREATE POLICY "Restrict updates to admin only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.role() = 'service_role');

CREATE POLICY "Restrict deletions to admin only"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.role() = 'service_role');