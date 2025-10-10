-- Add is_system column to envs table for system/curated templates
ALTER TABLE "public"."envs" ADD COLUMN "is_system" boolean NOT NULL DEFAULT FALSE;

-- Make team_id nullable for system templates
ALTER TABLE "public"."envs" ALTER COLUMN "team_id" DROP NOT NULL;

-- Create index for filtering system templates
CREATE INDEX idx_envs_is_system ON "public"."envs" ("is_system");

-- Add comment
COMMENT ON COLUMN "public"."envs"."is_system" IS 'Whether this is a system/curated template managed by the platform';
