-- Drop firecracker version default in env_builds table
ALTER TABLE "public"."env_builds"
ALTER COLUMN "firecracker_version" DROP DEFAULT;

