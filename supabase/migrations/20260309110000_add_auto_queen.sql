-- Add auto_queen user preference (default true — skip promotion modal, always queen)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auto_queen boolean NOT NULL DEFAULT true;
