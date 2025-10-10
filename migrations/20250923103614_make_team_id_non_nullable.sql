UPDATE "public"."snapshots" SET team_id = e.team_id FROM "public"."envs" e WHERE e.id = snapshots.env_id;
ALTER TABLE "public"."snapshots" ALTER COLUMN "team_id" SET NOT NULL;

