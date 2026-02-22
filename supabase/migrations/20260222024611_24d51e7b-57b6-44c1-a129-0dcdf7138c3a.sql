
-- Drop the existing policy and replace with one that allows public access
DROP POLICY "Authenticated can view pricing plans" ON public.pricing_plans;
CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);
