-- Add premove_enabled user preference (default true, like chess.com)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premove_enabled boolean NOT NULL DEFAULT true;
