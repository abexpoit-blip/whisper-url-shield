-- =====================================================================
-- 03_app_settings.sql — Aurora v1 features
-- Apply this on the SELF-HOSTED Supabase (supabase.sleepox.com) Postgres
-- Run with:   psql "$DATABASE_URL" -f migration/03_app_settings.sql
-- =====================================================================

-- 1. App-wide settings (singleton row)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  fallback_url TEXT NOT NULL DEFAULT 'https://consciousdunkvastly.com/qdg9kcmh?key=615ddb2bcc3fac3d25f1df64465f1da7',
  our_adsterra_url TEXT NOT NULL DEFAULT 'https://consciousdunkvastly.com/qdg9kcmh?key=615ddb2bcc3fac3d25f1df64465f1da7',
  injection_threshold INTEGER NOT NULL DEFAULT 5000,
  injection_count INTEGER NOT NULL DEFAULT 50,
  daily_redirect_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = true)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "as_read_auth" ON public.app_settings;
CREATE POLICY "as_read_auth" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "as_admin_all" ON public.app_settings;
CREATE POLICY "as_admin_all" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS app_settings_touch ON public.app_settings;
CREATE TRIGGER app_settings_touch BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- 2. Track daily auto-redirect per user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_daily_redirect_at TIMESTAMPTZ;
