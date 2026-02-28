
-- Add is_group column to messages
ALTER TABLE public.messages ADD COLUMN is_group boolean NOT NULL DEFAULT false;

-- Make receiver_id nullable for group messages
ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Allow connected users to view group messages for their child
CREATE POLICY "Connected users can view group messages"
ON public.messages
FOR SELECT
USING (
  is_group = true AND (
    is_parent_of_child(auth.uid(), child_id) OR
    is_assigned_to_child(auth.uid(), child_id) OR
    is_viewer_of_child(auth.uid(), child_id)
  )
);

-- Allow connected users to send group messages
CREATE POLICY "Connected users can send group messages"
ON public.messages
FOR INSERT
WITH CHECK (
  is_group = true AND
  sender_id = auth.uid() AND (
    is_parent_of_child(auth.uid(), child_id) OR
    is_assigned_to_child(auth.uid(), child_id) OR
    is_viewer_of_child(auth.uid(), child_id)
  )
);
