-- Enable Row-Level Security on all tables.
-- All writes go through Prisma (direct DB connection, bypasses RLS).
-- All reads go through Supabase REST with anon key — we allow SELECT only.
-- This blocks the critical attack vector: writes/deletes from the public anon key.

ALTER TABLE "CongressTrade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketMover"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsCache"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertRule"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertLog"      ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "public_read" ON "CongressTrade";
DROP POLICY IF EXISTS "public_read" ON "MarketMover";
DROP POLICY IF EXISTS "public_read" ON "NewsCache";
DROP POLICY IF EXISTS "public_read" ON "AlertRule";
DROP POLICY IF EXISTS "public_read" ON "AlertLog";

-- Allow SELECT for anon and authenticated users (data is public).
-- INSERT/UPDATE/DELETE remain blocked — only Prisma (direct DB) can mutate.
CREATE POLICY "public_read" ON "CongressTrade" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON "MarketMover"   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON "NewsCache"     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON "AlertRule"     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read" ON "AlertLog"      FOR SELECT TO anon, authenticated USING (true);
