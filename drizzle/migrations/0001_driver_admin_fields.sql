ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '';