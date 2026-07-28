CREATE TABLE public.history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  title text NOT NULL,
  year text,
  genre text,
  platform text,
  rating text,
  description text,
  reason text,
  poster_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.history TO authenticated;
GRANT ALL ON public.history TO service_role;

ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own history" ON public.history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX history_user_created_idx ON public.history (user_id, created_at DESC);