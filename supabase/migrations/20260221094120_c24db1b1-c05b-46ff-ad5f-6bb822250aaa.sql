
-- Add is_archived column to children table
ALTER TABLE public.children ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
