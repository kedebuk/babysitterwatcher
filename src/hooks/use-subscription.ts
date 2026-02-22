import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface PricingPlan {
  id: number;
  plan_name: string;
  child_order: number;
  monthly_price_idr: number;
  discount_pct: number;
  quarterly_extra_discount_pct: number;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'trial' | 'standard' | 'premium_promo';
  billing_cycle: 'monthly' | 'quarterly';
  number_of_children: number;
  price_per_month: number;
  price_per_quarter: number | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_start_date: string;
  subscription_end_date: string | null;
  premium_promo_end_date: string | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  admin_override: boolean;
  admin_override_note: string | null;
  created_at: string;
  updated_at: string;
}

export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans' as any)
        .select('*')
        .eq('is_active', true)
        .order('child_order');
      if (error) throw error;
      return (data || []) as unknown as PricingPlan[];
    },
  });
}

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Subscription | null;
    },
    enabled: !!user,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: {
      user_id: string;
      plan_type: 'trial' | 'standard' | 'premium_promo';
      billing_cycle: 'monthly' | 'quarterly';
      number_of_children: number;
      price_per_month: number;
      price_per_quarter: number | null;
      trial_start_date?: string;
      trial_end_date?: string;
      premium_promo_end_date?: string;
      status: 'trial' | 'active' | 'expired' | 'cancelled';
    }) => {
      const { data, error } = await supabase
        .from('subscriptions' as any)
        .insert({
          ...sub,
          subscription_start_date: new Date().toISOString(),
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useAdminUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, any> }) => {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from('subscriptions' as any)
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('subscriptions' as any)
          .update({ ...data, admin_override: true } as any)
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions' as any)
          .insert({ ...data, user_id: userId, admin_override: true, subscription_start_date: new Date().toISOString() } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['admin_all_subscriptions'] });
    },
  });
}

export function calculatePrice(
  numChildren: number,
  cycle: 'monthly' | 'quarterly',
  plans: PricingPlan[]
): { perMonth: number; perQuarter: number | null; savings: number } {
  let total = 0;
  const fullPrice = numChildren * 69000;

  for (let i = 1; i <= numChildren; i++) {
    const plan = plans.find(p => p.child_order === Math.min(i, 5));
    if (plan) total += plan.monthly_price_idr;
  }

  const monthlySavings = fullPrice - total;

  if (cycle === 'quarterly') {
    const discounted = Math.round((total * 0.85) / 100) * 100;
    return { perMonth: discounted, perQuarter: discounted * 3, savings: (fullPrice - discounted) * 3 };
  }

  return { perMonth: total, perQuarter: null, savings: monthlySavings };
}

export function formatRupiah(amount: number): string {
  return 'Rp' + amount.toLocaleString('id-ID');
}
