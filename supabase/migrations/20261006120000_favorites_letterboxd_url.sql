-- Enlace a la ficha de Letterboxd, para que la nota de un favorito sea clicable.
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS letterboxd_url TEXT;
