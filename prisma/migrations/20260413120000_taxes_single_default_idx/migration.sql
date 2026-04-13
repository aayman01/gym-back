-- Partial unique index: at most one tax may be default at a time
CREATE UNIQUE INDEX IF NOT EXISTS "taxes_single_default_idx" ON "taxes" ("is_default") WHERE "is_default" = true;
