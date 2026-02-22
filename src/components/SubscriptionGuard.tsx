import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

async function notifyAdminsTrialExpired(userId: string, userName: string, userEmail: string) {
  try {
    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles?.length) return;

    const message = `⏰ Trial habis: ${userName} (${userEmail}) perlu di-follow up untuk langganan.`;

    // Check if notification already sent today to avoid duplicates
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', adminRoles[0].user_id)
      .like('message', `%${userEmail}% perlu di-follow up%`)
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Insert notification for each admin
    const notifications = adminRoles.map((r) => ({
      user_id: r.user_id,
      message,
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, activeRole } = useAuth();
  const { data: subscription, isLoading } = useSubscription();
  const notifiedRef = useRef(false);

  const now = new Date();
  const isTrialExpired = subscription?.status === 'trial' && subscription.trial_end_date && new Date(subscription.trial_end_date) < now;
  const isSubExpired = subscription?.status === 'expired' || subscription?.status === 'cancelled';

  useEffect(() => {
    if (notifiedRef.current || !user || !isTrialExpired) return;
    notifiedRef.current = true;
    notifyAdminsTrialExpired(user.id, user.name, user.email);
  }, [user, isTrialExpired]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  // Admin and babysitter bypass subscription check
  const effectiveRole = activeRole || user?.role;
  if (effectiveRole === 'admin' || effectiveRole === 'babysitter') return <>{children}</>;

  // No subscription at all
  if (!subscription) {
    return <Navigate to="/pricing" replace />;
  }

  // Trial expired → redirect to pricing
  if (isTrialExpired) {
    return <Navigate to="/pricing" replace />;
  }

  // Subscription expired/cancelled → redirect to pricing
  if (isSubExpired) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
