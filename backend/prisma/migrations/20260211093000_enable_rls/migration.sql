-- Enable Row Level Security on all public tables.
-- All data access goes through the NestJS backend which connects as the
-- `postgres` superuser role — superusers bypass RLS automatically.
-- This blocks direct PostgREST / anon / authenticated access via Supabase
-- client SDKs, keeping all data private to the backend.

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VerificationCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Feedback" ENABLE ROW LEVEL SECURITY;
