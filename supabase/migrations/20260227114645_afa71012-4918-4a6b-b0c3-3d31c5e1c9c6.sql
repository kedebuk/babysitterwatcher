
-- Food memory table for AI food recognition (global per family/parent)
CREATE TABLE public.food_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid NOT NULL,
  food_name text NOT NULL,
  description text,
  avg_weight_gram numeric,
  photo_url text,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_memory ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own food memory
CREATE POLICY "Parent can manage own food memory"
ON public.food_memory FOR ALL
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Babysitters can read food memory of assigned children's parents
CREATE POLICY "Babysitter can view parent food memory"
ON public.food_memory FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.children c
  JOIN public.assignments a ON a.child_id = c.id
  WHERE c.parent_id = food_memory.parent_id
  AND a.babysitter_user_id = auth.uid()
));

-- Babysitters can insert into parent's food memory
CREATE POLICY "Babysitter can insert food memory"
ON public.food_memory FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.children c
  JOIN public.assignments a ON a.child_id = c.id
  WHERE c.parent_id = food_memory.parent_id
  AND a.babysitter_user_id = auth.uid()
));

-- Viewers can read food memory
CREATE POLICY "Viewer can view parent food memory"
ON public.food_memory FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.children c
  JOIN public.child_viewers cv ON cv.child_id = c.id
  WHERE c.parent_id = food_memory.parent_id
  AND cv.viewer_user_id = auth.uid()
));

-- Viewers can insert food memory
CREATE POLICY "Viewer can insert food memory"
ON public.food_memory FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.children c
  JOIN public.child_viewers cv ON cv.child_id = c.id
  WHERE c.parent_id = food_memory.parent_id
  AND cv.viewer_user_id = auth.uid()
));

-- Admin can view all
CREATE POLICY "Admin can view all food memory"
ON public.food_memory FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_food_memory_updated_at
BEFORE UPDATE ON public.food_memory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for fast lookups
CREATE INDEX idx_food_memory_parent_id ON public.food_memory(parent_id);
CREATE INDEX idx_food_memory_food_name ON public.food_memory(food_name);
