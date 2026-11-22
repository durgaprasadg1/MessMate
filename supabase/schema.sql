-- MessMate: COMPLETE schema for a brand-new database (includes all security columns + RLS).
-- Run ONCE on an empty Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- (Existing database? Run supabase/migrations/001_security_hardening.sql instead.)

-- ---- accounts -----------------------------------------------------------------
CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text NOT NULL,
  password text NOT NULL,
  address text,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,               -- AES-256-GCM encrypted TOTP secret
  mfa_recovery_codes jsonb,      -- SHA-256 hashes only
  CONSTRAINT admin_pkey PRIMARY KEY (id)
);

CREATE TABLE public.owner (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  upi text NOT NULL,
  phone_number text NOT NULL,
  address text NOT NULL,
  password text NOT NULL,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,
  mfa_recovery_codes jsonb,
  CONSTRAINT owner_pkey PRIMARY KEY (id)
);

CREATE TABLE public.consumer (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text NOT NULL UNIQUE,
  address text NOT NULL,
  phone text NOT NULL,
  is_blocked boolean DEFAULT false,
  password text NOT NULL,
  verify_token text,
  verify_token_expiry timestamptz,
  reset_token text,              -- SHA-256 of the emailed token (never the raw token)
  reset_token_expiry timestamptz,
  have_monthly_mess boolean DEFAULT false,
  CONSTRAINT consumer_pkey PRIMARY KEY (id)
);

-- ---- mess + menu (circular reference: FKs added after both exist) -------------
CREATE TABLE public.mess (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  image_filename text,
  image_public_id text,
  email text NOT NULL,
  upi text NOT NULL,
  address text,
  meal_time text,
  veg_menu jsonb,
  veg_price double precision,
  non_veg_price double precision,
  non_veg_menu jsonb,
  veg_menu_ref_id uuid UNIQUE,
  non_veg_menu_ref_id uuid UNIQUE,
  owner_id uuid,
  category text NOT NULL,
  is_open boolean DEFAULT true,
  owner_name text NOT NULL,
  adhar_number text NOT NULL,
  phone_number text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  is_limited boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  certificate_url text,
  certificate_filename text,
  certificate_public_id text,
  is_blocked boolean DEFAULT false,
  location jsonb,
  monthly_mess_duration integer NOT NULL,
  monthly_mess_fee double precision NOT NULL,
  CONSTRAINT mess_pkey PRIMARY KEY (id),
  CONSTRAINT fk_mess_owner FOREIGN KEY (owner_id) REFERENCES public.owner(id)
);

CREATE TABLE public.menu (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mess_id uuid,
  menutype text NOT NULL,
  meal_time text,
  dishes jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT menu_pkey PRIMARY KEY (id),
  CONSTRAINT fk_menu_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

ALTER TABLE public.mess
  ADD CONSTRAINT fk_mess_veg_menu_ref    FOREIGN KEY (veg_menu_ref_id)     REFERENCES public.menu(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_mess_nonveg_menu_ref FOREIGN KEY (non_veg_menu_ref_id) REFERENCES public.menu(id) ON DELETE SET NULL;

-- ---- orders, registrations, reviews ... ----------------------------------------
CREATE TABLE public."order" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consumer_id uuid,
  mess_id uuid NOT NULL,
  total_price double precision NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  razorpay_signature text,
  status text DEFAULT 'created',
  payment_verified boolean DEFAULT false,
  no_of_plate integer DEFAULT 1,
  selected_dish_name text,
  selected_dish_price double precision DEFAULT 0,
  mess_name text,
  done boolean DEFAULT false,
  is_taken boolean DEFAULT false,
  notified boolean DEFAULT false,
  consumer_subscription jsonb,
  is_cancelled boolean DEFAULT false,
  refund_initiated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT order_pkey PRIMARY KEY (id),
  CONSTRAINT fk_order_consumer FOREIGN KEY (consumer_id) REFERENCES public.consumer(id),
  CONSTRAINT fk_order_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

CREATE TABLE public.message (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  to_mess_id uuid,
  CONSTRAINT message_pkey PRIMARY KEY (id),
  CONSTRAINT fk_message_to_mess FOREIGN KEY (to_mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

CREATE TABLE public.new_mess_customer (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL,
  consumer_id uuid NOT NULL,
  duration text NOT NULL,
  phone text NOT NULL,
  payment_mode text NOT NULL,
  name text NOT NULL,
  address text,
  gender text,
  college text,
  joining_date timestamptz DEFAULT now(),
  food_preference text,
  emergency_contact text,
  is_allowed boolean DEFAULT false,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_verified boolean DEFAULT false,
  total_amount double precision,
  payment_status text DEFAULT 'pending',
  customers jsonb,
  CONSTRAINT new_mess_customer_pkey PRIMARY KEY (id),
  CONSTRAINT fk_new_mess_customer_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE,
  CONSTRAINT fk_new_mess_customer_consumer FOREIGN KEY (consumer_id) REFERENCES public.consumer(id)
);

CREATE TABLE public.notification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id text NOT NULL,
  recipient_model text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  order_id uuid,
  mess_id uuid,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT notification_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notification_order FOREIGN KEY (order_id) REFERENCES public."order"(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

CREATE TABLE public.review (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feedback text,
  rating integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  author_id uuid,
  mess_id uuid,
  CONSTRAINT review_pkey PRIMARY KEY (id),
  CONSTRAINT fk_review_author FOREIGN KEY (author_id) REFERENCES public.consumer(id),
  CONSTRAINT fk_review_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

CREATE TABLE public.wastage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL,
  date timestamptz NOT NULL,
  plate_name text,
  cooked_qty double precision NOT NULL,
  served_qty double precision NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT wastage_pkey PRIMARY KEY (id),
  CONSTRAINT fk_wastage_mess FOREIGN KEY (mess_id) REFERENCES public.mess(id) ON DELETE CASCADE
);

-- ---- indexes used by the app's queries ------------------------------------------
CREATE INDEX idx_mess_owner            ON public.mess (owner_id);
CREATE INDEX idx_order_mess            ON public."order" (mess_id, created_at DESC);
CREATE INDEX idx_order_consumer        ON public."order" (consumer_id, created_at DESC);
CREATE INDEX idx_reg_mess              ON public.new_mess_customer (mess_id);
CREATE INDEX idx_reg_consumer          ON public.new_mess_customer (consumer_id);
CREATE INDEX idx_notification_user     ON public.notification (recipient_id, created_at DESC);
CREATE INDEX idx_review_mess           ON public.review (mess_id);
CREATE UNIQUE INDEX admin_email_ci     ON public.admin (lower(email));
CREATE UNIQUE INDEX owner_email_ci     ON public.owner (lower(email));
CREATE UNIQUE INDEX consumer_email_ci  ON public.consumer (lower(email));

-- ---- Row Level Security ---------------------------------------------------------
-- The app uses the service-role key on the server only (it bypasses RLS). With RLS on and
-- NO policies, the public anon/authenticated keys can read or write nothing.
ALTER TABLE public.admin             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_mess_customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wastage           ENABLE ROW LEVEL SECURITY;
