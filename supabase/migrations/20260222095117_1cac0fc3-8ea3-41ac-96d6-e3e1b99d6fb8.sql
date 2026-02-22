-- Add GPS coordinates directly to events table
ALTER TABLE public.events ADD COLUMN latitude double precision;
ALTER TABLE public.events ADD COLUMN longitude double precision;