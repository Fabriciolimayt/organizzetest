-- expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'subscricoes',
  source TEXT NOT NULL DEFAULT 'app',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert_own" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update_own" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete_own" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, occurred_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;

-- whatsapp_links table
CREATE TABLE public.whatsapp_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  verify_code TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone)
);
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_select_own" ON public.whatsapp_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wa_insert_own" ON public.whatsapp_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wa_update_own" ON public.whatsapp_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wa_delete_own" ON public.whatsapp_links FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_whatsapp_links_phone ON public.whatsapp_links(phone);