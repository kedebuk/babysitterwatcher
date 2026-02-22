import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, usePricingPlans, calculatePrice, formatRupiah } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, ListOrdered, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trial: { label: '🆓 Trial', variant: 'secondary' },
  active: { label: '✅ Aktif', variant: 'default' },
  expired: { label: '❌ Expired', variant: 'destructive' },
  cancelled: { label: '🚫 Dibatalkan', variant: 'outline' },
};

const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial Gratis',
  standard: 'Standar',
  premium_promo: 'Premium Promo',
};

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useSubscription();
  const { data: plans = [] } = usePricingPlans();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  const statusInfo = STATUS_LABELS[subscription?.status || ''] || STATUS_LABELS.expired;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Status Langganan</h1>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="status"><CreditCard className="h-4 w-4 mr-1.5" /> Status</TabsTrigger>
            <TabsTrigger value="pricelist"><ListOrdered className="h-4 w-4 mr-1.5" /> Daftar Harga</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            {!subscription ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center space-y-4">
                  <p className="text-muted-foreground">Anda belum memiliki langganan aktif.</p>
                  <Button onClick={() => navigate('/pricing')} className="w-full h-12 text-base font-semibold">
                    🚀 Mulai Berlangganan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Paket</span>
                      <span className="text-sm font-semibold">{PLAN_LABELS[subscription.plan_type] || subscription.plan_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Jumlah Anak</span>
                      <span className="text-sm font-semibold">{subscription.number_of_children} anak</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Siklus Bayar</span>
                      <span className="text-sm font-semibold">{subscription.billing_cycle === 'quarterly' ? 'Per 3 Bulan' : 'Bulanan'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Harga/Bulan</span>
                      <span className="text-sm font-bold text-primary">{formatRupiah(subscription.price_per_month)}</span>
                    </div>
                    {subscription.trial_end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trial Berakhir</span>
                        <span className="text-sm font-semibold">{format(parseISO(subscription.trial_end_date), 'd MMM yyyy', { locale: idLocale })}</span>
                      </div>
                    )}
                    {subscription.premium_promo_end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Promo Premium Sampai</span>
                        <span className="text-sm font-semibold text-primary">{format(parseISO(subscription.premium_promo_end_date), 'd MMM yyyy', { locale: idLocale })}</span>
                      </div>
                    )}
                    {subscription.subscription_start_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mulai Langganan</span>
                        <span className="text-sm">{format(parseISO(subscription.subscription_start_date), 'd MMM yyyy', { locale: idLocale })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button variant="outline" onClick={() => navigate('/pricing')} className="w-full h-12 text-base gap-2">
                  <Plus className="h-5 w-5" /> Upgrade / Tambah Anak
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricelist">
            <div className="space-y-3">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <h3 className="text-sm font-bold">Harga Bulanan per Anak</h3>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {plans.map((plan: any) => (
                      <div key={plan.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <span className="text-sm font-medium">{plan.plan_name}</span>
                          {plan.discount_pct > 0 && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">Hemat {plan.discount_pct}%</Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{formatRupiah(plan.monthly_price_idr)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <h3 className="text-sm font-bold">Estimasi Total</h3>
                  <p className="text-xs text-muted-foreground">Bayar per 3 bulan hemat tambahan 15%</p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(n => {
                      const monthly = calculatePrice(n, 'monthly', plans);
                      const quarterly = calculatePrice(n, 'quarterly', plans);
                      return (
                        <div key={n} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{n} anak</span>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatRupiah(monthly.perMonth)}/bln</p>
                            <p className="text-[11px] text-muted-foreground">3 bln: {formatRupiah(quarterly.perQuarter || 0)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => navigate('/pricing')} className="w-full h-12 text-base font-semibold">
                🚀 Lihat Detail & Mulai Berlangganan
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
