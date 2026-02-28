
-- Add deleted_at column to profiles for soft delete
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for filtering active vs deleted users
CREATE INDEX idx_profiles_deleted_at ON public.profiles (deleted_at);
