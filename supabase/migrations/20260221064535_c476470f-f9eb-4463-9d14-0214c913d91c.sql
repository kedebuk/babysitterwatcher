
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('parent', 'babysitter');

-- Create activity_type enum
CREATE TYPE public.activity_type AS ENUM ('susu', 'mpasi', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan');

-- Create event_status enum
CREATE TYPE public.event_status AS ENUM ('habis', 'sisa');

-- Create event_unit enum
CREATE TYPE public.event_unit AS ENUM ('ml', 'pcs', 'dosis');

-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE,
  notes TEXT DEFAULT '',
  avatar_emoji TEXT DEFAULT '👶',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Assignments table (links babysitter to child)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  babysitter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, babysitter_user_id)
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Daily logs table
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, log_date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  type activity_type NOT NULL,
  detail TEXT DEFAULT '',
  amount NUMERIC,
  unit event_unit,
  status event_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ===================== SECURITY DEFINER HELPER FUNCTIONS =====================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is parent of a child
CREATE OR REPLACE FUNCTION public.is_parent_of_child(_user_id UUID, _child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = _child_id AND parent_id = _user_id
  )
$$;

-- Check if user is assigned babysitter for a child
CREATE OR REPLACE FUNCTION public.is_assigned_to_child(_user_id UUID, _child_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments
    WHERE babysitter_user_id = _user_id AND child_id = _child_id
  )
$$;

-- Check if user can access a daily log
CREATE OR REPLACE FUNCTION public.can_access_log(_user_id UUID, _log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_logs dl
    WHERE dl.id = _log_id
    AND (
      public.is_parent_of_child(_user_id, dl.child_id)
      OR public.is_assigned_to_child(_user_id, dl.child_id)
    )
  )
$$;

-- ===================== RLS POLICIES =====================

-- Profiles: all authenticated can read, own profile update
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles: authenticated can read, only self insert
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Children: parent can CRUD, assigned babysitter can read
CREATE POLICY "Parent can manage children" ON public.children FOR ALL TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Babysitter can view assigned children" ON public.children FOR SELECT TO authenticated
  USING (public.is_assigned_to_child(auth.uid(), id));

-- Assignments: parent of child can manage, babysitter can read own
CREATE POLICY "Parent can manage assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.is_parent_of_child(auth.uid(), child_id))
  WITH CHECK (public.is_parent_of_child(auth.uid(), child_id));
CREATE POLICY "Babysitter can view own assignments" ON public.assignments FOR SELECT TO authenticated
  USING (babysitter_user_id = auth.uid());

-- Daily logs: parent can read, babysitter can CRUD for assigned children
CREATE POLICY "Parent can view logs" ON public.daily_logs FOR SELECT TO authenticated
  USING (public.is_parent_of_child(auth.uid(), child_id));
CREATE POLICY "Babysitter can manage logs" ON public.daily_logs FOR ALL TO authenticated
  USING (public.is_assigned_to_child(auth.uid(), child_id))
  WITH CHECK (public.is_assigned_to_child(auth.uid(), child_id));

-- Events: based on daily_log access
CREATE POLICY "Users can view events" ON public.events FOR SELECT TO authenticated
  USING (public.can_access_log(auth.uid(), daily_log_id));
CREATE POLICY "Babysitter can manage events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.can_access_log(auth.uid(), daily_log_id));
CREATE POLICY "Babysitter can update events" ON public.events FOR UPDATE TO authenticated
  USING (public.can_access_log(auth.uid(), daily_log_id));
CREATE POLICY "Babysitter can delete events" ON public.events FOR DELETE TO authenticated
  USING (public.can_access_log(auth.uid(), daily_log_id));

-- ===================== TRIGGERS =====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  -- Auto-assign role from metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
