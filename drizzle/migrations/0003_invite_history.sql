CREATE TABLE public.invite_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text NOT NULL DEFAULT '',
  pin text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used','revoked')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT ALL ON public.invite_history TO service_role;
ALTER TABLE public.invite_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX invite_history_driver_idx ON public.invite_history(driver_id);
INSERT INTO public.invite_history (driver_id, phone, name, pin, status)
SELECT id, phone, name, invite_pin, 'pending' FROM public.drivers WHERE invite_pin IS NOT NULL;