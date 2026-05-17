
-- whatsapp_users
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  linked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wu_select_own" ON public.whatsapp_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wu_insert_own" ON public.whatsapp_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wu_update_own" ON public.whatsapp_users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wu_delete_own" ON public.whatsapp_users FOR DELETE USING (auth.uid() = user_id);

-- pending_expenses
CREATE TABLE IF NOT EXISTS public.pending_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  merchant text,
  amount numeric(10,2),
  date date,
  category text,
  description text,
  raw_ai_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pe_select_own" ON public.pending_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pe_insert_own" ON public.pending_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pe_update_own" ON public.pending_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pe_delete_own" ON public.pending_expenses FOR DELETE USING (auth.uid() = user_id);

-- expenses: add new columns (table already exists)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS merchant text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.expenses ALTER COLUMN name DROP NOT NULL;

-- Realtime
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='expenses'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses';
  END IF;
END $$;
