CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  orders_total integer NOT NULL DEFAULT 0,
  pro_until timestamptz,
  last_seen timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.orders (
  id text PRIMARY KEY,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  paid boolean NOT NULL DEFAULT false,
  amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  delivered boolean NOT NULL DEFAULT false,
  deferred boolean NOT NULL DEFAULT false,
  seq integer NOT NULL DEFAULT 0,
  removed boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL DEFAULT 0,
  updated_at bigint NOT NULL DEFAULT 0
);

CREATE INDEX orders_driver_idx ON public.orders (driver_id);

GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;