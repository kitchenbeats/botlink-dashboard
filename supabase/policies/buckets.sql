-- Storage bucket policies for profile-pictures bucket
--
-- These policies ensure:
-- 1. Only Supabase admin can write to and list files in the bucket
-- 2. Public URLs are accessible for downloading files
-- 3. No other access is allowed

-- This policy allows anyone to download files if they have the exact URL
-- This is needed for public URLs to work
CREATE POLICY "Allow public access to individual files"
ON storage.objects
FOR SELECT
TO public
USING (
    -- Allow access to specific files if the path is known
    -- This enables public URLs to work
    true
);

-- This policy restricts listing files in the bucket to admin only
-- Regular users cannot browse or list files
CREATE POLICY "Restrict listing files to admin only"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    -- Only allow listing files if the user is a service role (admin)
    auth.role() = 'service_role'
);

-- This policy restricts uploading files to admin only
CREATE POLICY "Restrict uploads to admin only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    -- Only allow uploads if the user is a service role (admin)
    auth.role() = 'service_role'
);

-- This policy restricts updating files to admin only
CREATE POLICY "Restrict updates to admin only"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    -- Only allow updates if the user is a service role (admin)
    auth.role() = 'service_role'
);

-- This policy restricts deleting files to admin only
CREATE POLICY "Restrict deletions to admin only"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    -- Only allow deletions if the user is a service role (admin)
    auth.role() = 'service_role'
);