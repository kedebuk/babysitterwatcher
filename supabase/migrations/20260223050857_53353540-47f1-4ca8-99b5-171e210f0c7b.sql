-- Junction table: share inventory items with additional children
CREATE TABLE public.inventory_item_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, child_id)
);

ALTER TABLE public.inventory_item_shares ENABLE ROW LEVEL SECURITY;

-- Parent can manage shares for their children's items
CREATE POLICY "Parent can manage item shares"
  ON public.inventory_item_shares FOR ALL
  USING (is_parent_of_child(auth.uid(), child_id))
  WITH CHECK (is_parent_of_child(auth.uid(), child_id));

-- Babysitter can view shares for assigned children
CREATE POLICY "Babysitter can view item shares"
  ON public.inventory_item_shares FOR SELECT
  USING (is_assigned_to_child(auth.uid(), child_id));

-- Viewer can view shares
CREATE POLICY "Viewer can view item shares"
  ON public.inventory_item_shares FOR SELECT
  USING (is_viewer_of_child(auth.uid(), child_id));

-- Admin can view all
CREATE POLICY "Admin can view all item shares"
  ON public.inventory_item_shares FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));