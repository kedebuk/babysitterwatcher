
-- Add can_input column to child_viewers, default false (view only)
ALTER TABLE public.child_viewers ADD COLUMN can_input boolean NOT NULL DEFAULT false;
