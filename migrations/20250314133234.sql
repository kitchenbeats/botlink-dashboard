-- Timestamp: 20250314133234

-- Create env_defaults table with RLS enabled
CREATE TABLE "public"."env_defaults" (
    env_id TEXT PRIMARY KEY REFERENCES "public"."envs"(id),
    description TEXT
);

-- Enable Row Level Security
ALTER TABLE "public"."env_defaults" ENABLE ROW LEVEL SECURITY;

-- Create an index on the foreign key for better performance
CREATE INDEX "env_defaults_env_id_idx" ON "public"."env_defaults"("env_id");

