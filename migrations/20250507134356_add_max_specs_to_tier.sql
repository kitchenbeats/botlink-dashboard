ALTER TABLE tiers
    ADD COLUMN IF NOT EXISTS "max_vcpu" bigint NOT NULL default '8'::bigint,
    ADD COLUMN IF NOT EXISTS "max_ram_mb" bigint NOT NULL DEFAULT '8192'::bigint;
