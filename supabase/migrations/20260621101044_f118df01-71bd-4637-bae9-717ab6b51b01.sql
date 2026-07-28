CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  history_id uuid REFERENCES public.history(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text,
  year text,
  reaction text NOT NULL CHECK (reaction IN ('love_it', 'like_it', 'not_for_me')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, history_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feedback" ON public.feedback
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS feedback_user_idx ON public.feedback (user_id, created_at DESC);