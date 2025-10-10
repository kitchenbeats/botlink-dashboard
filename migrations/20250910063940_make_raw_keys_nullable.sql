ALTER TABLE "public"."access_tokens" DROP CONSTRAINT access_tokens_pkey;
ALTER TABLE "public"."access_tokens" ADD PRIMARY KEY (id);
ALTER TABLE "public"."access_tokens" ALTER COLUMN "access_token" DROP NOT NULL;
ALTER TABLE "public"."team_api_keys" ALTER COLUMN "api_key" DROP NOT NULL;

