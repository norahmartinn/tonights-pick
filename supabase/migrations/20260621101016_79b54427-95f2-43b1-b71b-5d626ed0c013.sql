ALTER TABLE public.history
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS director text,
  ADD COLUMN IF NOT EXISTS cast_members text;