
-- Add concurrent_template_builds column to tiers table
ALTER TABLE "public"."tiers" ADD COLUMN "concurrent_template_builds" bigint NOT NULL DEFAULT 20;

-- Add check constraint for concurrent_template_builds
ALTER TABLE "public"."tiers" ADD CONSTRAINT "tiers_concurrent_template_builds_check" CHECK (concurrent_template_builds > 0);

-- Add comment for the new column
COMMENT ON COLUMN public.tiers.concurrent_template_builds
    IS 'The number of concurrent template builds the team can run';


