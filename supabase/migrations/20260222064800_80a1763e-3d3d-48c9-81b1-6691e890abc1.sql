-- Add 'snack' and 'buah' to activity_type enum
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'snack';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'buah';