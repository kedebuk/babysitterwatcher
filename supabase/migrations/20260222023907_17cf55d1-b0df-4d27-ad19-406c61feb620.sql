
-- Enums
CREATE TYPE public.subscription_plan_type AS ENUM ('trial', 'standard', 'premium_promo');
CREATE TYPE public.subscription_billing_cycle AS ENUM ('monthly', 'quarterly');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
CREATE TYPE public.child_gender AS ENUM ('male', 'female');

-- pricing_plans
CREATE TABLE public.pricing_plans (
  id serial PRIMARY KEY,
  plan_name text NOT NULL,
  child_order integer NOT NULL,
  monthly_price_idr integer NOT NULL,
  discount_pct integer NOT NULL DEFAULT 0,
  quarterly_extra_discount_pct integer NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view pricing plans" ON public.pricing_plans FOR SELECT TO authenticated USING (true);

-- Seed pricing data
INSERT INTO public.pricing_plans (plan_name, child_order, monthly_price_idr, discount_pct, quarterly_extra_discount_pct) VALUES
  ('Anak ke-1', 1, 69000, 0, 15),
  ('Anak ke-2', 2, 55000, 20, 15),
  ('Anak ke-3', 3, 48000, 30, 15),
  ('Anak ke-4', 4, 48000, 30, 15),
  ('Anak ke-5+', 5, 48000, 30, 15);

-- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type public.subscription_plan_type NOT NULL DEFAULT 'trial',
  billing_cycle public.subscription_billing_cycle NOT NULL DEFAULT 'monthly',
  number_of_children integer NOT NULL DEFAULT 1,
  price_per_month integer NOT NULL DEFAULT 0,
  price_per_quarter integer,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz NOT NULL DEFAULT now(),
  subscription_end_date timestamptz,
  premium_promo_end_date timestamptz,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  admin_override boolean NOT NULL DEFAULT false,
  admin_override_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete subscriptions" ON public.subscriptions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- children_profiles (subscription onboarding)
CREATE TABLE public.children_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_of_birth date NOT NULL,
  gender public.child_gender NOT NULL DEFAULT 'male',
  photo_url text,
  medical_notes text,
  routine_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.children_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own children_profiles" ON public.children_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can view all children_profiles" ON public.children_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- family_invites
CREATE TABLE public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  invite_code varchar(8) NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_by uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own family_invites" ON public.family_invites FOR ALL TO authenticated USING (invited_by = auth.uid()) WITH CHECK (invited_by = auth.uid());
CREATE POLICY "Invited user can update invite" ON public.family_invites FOR UPDATE TO authenticated USING (used_by = auth.uid() OR status = 'pending');
CREATE POLICY "Anyone can view invite by code" ON public.family_invites FOR SELECT TO authenticated USING (true);
