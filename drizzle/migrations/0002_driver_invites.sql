ALTER TABLE public.drivers ADD COLUMN activated boolean NOT NULL DEFAULT true;
ALTER TABLE public.drivers ALTER COLUMN activated SET DEFAULT false;
ALTER TABLE public.drivers ADD COLUMN invite_pin text;