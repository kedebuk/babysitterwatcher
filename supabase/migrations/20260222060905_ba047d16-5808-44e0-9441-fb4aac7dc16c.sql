
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
