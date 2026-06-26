
CREATE TABLE public.whatsapp_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  phone text,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  summary text,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_events_user_created_idx ON public.whatsapp_events (user_id, created_at DESC);
GRANT SELECT ON public.whatsapp_events TO authenticated;
GRANT ALL ON public.whatsapp_events TO service_role;
ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY we_select_own ON public.whatsapp_events FOR SELECT USING (auth.uid() = user_id);
