import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, activeRole } = useAuth();
  const { data: subscription, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [showExpiredModal, setShowExpiredModal] = useState(true);

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

  // Trial expired
  if (subscription.status === 'trial' && subscription.trial_end_date && new Date(subscription.trial_end_date) < now) {
    return (
      <>
        <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>⏰ Trial Telah Berakhir</DialogTitle>
              <DialogDescription>
                Masa percobaan gratis 3 hari Anda telah berakhir. Silakan berlangganan untuk terus menggunakan Eleanor Tracker.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => navigate('/pricing')} className="w-full bg-[hsl(var(--coral))] hover:bg-[hsl(var(--coral))]/90 text-white">
              Lihat Paket Langganan
            </Button>
          </DialogContent>
        </Dialog>
        <div className="min-h-screen bg-background" />
      </>
    );
  }

  // Subscription expired/cancelled
  if (subscription.status === 'expired' || subscription.status === 'cancelled') {
    return (
      <>
        <Dialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>📋 Langganan Berakhir</DialogTitle>
              <DialogDescription>
                Langganan Anda telah berakhir. Perpanjang untuk terus menggunakan semua fitur.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              Perpanjang Langganan
            </Button>
          </DialogContent>
        </Dialog>
        <div className="min-h-screen bg-background" />
      </>
    );
  }

  return <>{children}</>;
}
