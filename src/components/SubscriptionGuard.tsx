import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, activeRole } = useAuth();
  const { data: subscription, isLoading } = useSubscription();

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

  const now = new Date();

  // Trial expired → redirect to pricing
  if (subscription.status === 'trial' && subscription.trial_end_date && new Date(subscription.trial_end_date) < now) {
    return <Navigate to="/pricing" replace />;
  }

  // Subscription expired/cancelled → redirect to pricing
  if (subscription.status === 'expired' || subscription.status === 'cancelled') {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
