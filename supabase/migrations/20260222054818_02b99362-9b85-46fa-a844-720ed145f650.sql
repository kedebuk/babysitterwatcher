
-- Inventory items table - tracks stock items per child
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📦',
  photo_url text,
  current_stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pcs',
  low_stock_threshold numeric NOT NULL DEFAULT 5,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory usage log - tracks daily usage
CREATE TABLE public.inventory_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

-- RLS for inventory_items
CREATE POLICY "Parent can manage inventory" ON public.inventory_items
FOR ALL USING (is_parent_of_child(auth.uid(), child_id))
WITH CHECK (is_parent_of_child(auth.uid(), child_id));

CREATE POLICY "Babysitter can manage inventory" ON public.inventory_items
FOR ALL USING (is_assigned_to_child(auth.uid(), child_id))
WITH CHECK (is_assigned_to_child(auth.uid(), child_id));

CREATE POLICY "Viewer can view inventory" ON public.inventory_items
FOR SELECT USING (is_viewer_of_child(auth.uid(), child_id));

CREATE POLICY "Admin can view all inventory" ON public.inventory_items
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for inventory_usage
CREATE POLICY "Parent can manage usage" ON public.inventory_usage
FOR ALL USING (is_parent_of_child(auth.uid(), child_id))
WITH CHECK (is_parent_of_child(auth.uid(), child_id));

CREATE POLICY "Babysitter can manage usage" ON public.inventory_usage
FOR ALL USING (is_assigned_to_child(auth.uid(), child_id))
WITH CHECK (is_assigned_to_child(auth.uid(), child_id));

CREATE POLICY "Viewer can view usage" ON public.inventory_usage
FOR SELECT USING (is_viewer_of_child(auth.uid(), child_id));

CREATE POLICY "Admin can view all usage" ON public.inventory_usage
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for inventory_items
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to notify parent when stock is low after usage
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item RECORD;
  _child_name text;
  _parent_id uuid;
  _user_name text;
BEGIN
  -- Get item details
  SELECT ii.*, c.name as child_name, c.parent_id
  INTO _item
  FROM public.inventory_items ii
  JOIN public.children c ON c.id = ii.child_id
  WHERE ii.id = NEW.item_id;

  -- Update current_stock on the item
  UPDATE public.inventory_items
  SET current_stock = GREATEST(current_stock - NEW.quantity, 0)
  WHERE id = NEW.item_id
  RETURNING current_stock INTO _item.current_stock;

  -- Get user name
  SELECT p.name INTO _user_name FROM public.profiles p WHERE p.id = auth.uid();

  -- Notify parent if stock is low
  IF _item.current_stock <= _item.low_stock_threshold AND _item.parent_id IS NOT NULL AND _item.parent_id != auth.uid() THEN
    INSERT INTO public.notifications (user_id, message)
    VALUES (_item.parent_id, '⚠️ Stok ' || _item.name || ' untuk ' || COALESCE(_item.child_name, 'anak') || ' tinggal ' || _item.current_stock || ' ' || _item.unit || '. Segera isi ulang!');
  END IF;

  -- Also notify viewers
  INSERT INTO public.notifications (user_id, message)
  SELECT cv.viewer_user_id, '⚠️ Stok ' || _item.name || ' untuk ' || COALESCE(_item.child_name, 'anak') || ' tinggal ' || _item.current_stock || ' ' || _item.unit
  FROM public.child_viewers cv
  WHERE cv.child_id = _item.child_id 
    AND cv.viewer_user_id != auth.uid()
    AND _item.current_stock <= _item.low_stock_threshold;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_inventory_usage_insert
AFTER INSERT ON public.inventory_usage
FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

-- Index for performance
CREATE INDEX idx_inventory_items_child_id ON public.inventory_items(child_id);
CREATE INDEX idx_inventory_usage_item_id ON public.inventory_usage(item_id);
CREATE INDEX idx_inventory_usage_date ON public.inventory_usage(usage_date);
