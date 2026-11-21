-- MessMate security hardening migration  (run once in the Supabase SQL editor)
-- Safe to re-run: every statement is idempotent.

-- 1) Row Level Security -------------------------------------------------------
-- The app talks to Supabase ONLY from the server with the service-role key,
-- which bypasses RLS. Enabling RLS with no policies means the public
-- (anon / authenticated) keys can read or write NOTHING, even if one leaks.
ALTER TABLE public.admin               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_mess_customer   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wastage             ENABLE ROW LEVEL SECURITY;

-- 2) Columns used by the application ------------------------------------------
-- (the original db.sql had no password column on "owner", but the code stores one)
ALTER TABLE public.owner ADD COLUMN IF NOT EXISTS password text;

-- Reset tokens are now stored as a SHA-256 hash in the existing reset_token column.
ALTER TABLE public.consumer ADD COLUMN IF NOT EXISTS reset_token text;
ALTER TABLE public.consumer ADD COLUMN IF NOT EXISTS reset_token_expiry timestamptz;

-- Certificates are private Cloudinary assets and are served through signed URLs.
ALTER TABLE public.mess ADD COLUMN IF NOT EXISTS certificate_public_id text;
ALTER TABLE public.mess ADD COLUMN IF NOT EXISTS certificate_filename text;

-- 3) Two-step verification (TOTP) for admin and owner --------------------------
ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS mfa_secret text;            -- AES-256-GCM encrypted
ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS mfa_recovery_codes jsonb;   -- SHA-256 hashes only
ALTER TABLE public.owner ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.owner ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE public.owner ADD COLUMN IF NOT EXISTS mfa_recovery_codes jsonb;

-- 4) Defence in depth: unique e-mail per account table -------------------------
CREATE UNIQUE INDEX IF NOT EXISTS admin_email_key    ON public.admin (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS owner_email_key    ON public.owner (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS consumer_email_key ON public.consumer (lower(email));
-- If an index fails because duplicates already exist, clean those rows up first.
