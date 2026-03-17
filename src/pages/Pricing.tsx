import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePricingPlans, useCreateSubscription, calculatePrice, formatRupiah } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MessageCircle, Check, Shield, Zap, Users, Gift } from 'lucide-react';
import { useMetaPixel } from '@/hooks/use-meta-pixel';
import { useBrand } from '@/contexts/BrandContext';

const Pricing = () => {
  const { user } = useAuth();
  const { brandName } = useBrand();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans = [], isLoading: plansLoading } = usePricingPlans();
  const createSub = useCreateSubscription();
  const { trackEvent } = useMetaPixel();

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premium'>('starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [adminWa, setAdminWa] = useState('');

  const numChildren = selectedPlan === 'starter' ? 1 : 4;
  const price = calculatePrice(numChildren, billingCycle, plans);

  useEffect(() => {
    supabase
      .from('app_settings' as any)
      .select('value')
      .eq('key', 'admin_whatsapp')
      .single()
      .then(({ data }) => {
        if (data) setAdminWa((data as any).value || '');
      });
  }, []);

  const handleStart = useCallback(async () => {
    if (!user) { navigate('/login'); return; }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 86400000);
    const promoEnd = new Date(now);
    promoEnd.setFullYear(promoEnd.getFullYear() + 1);

    try {
      await createSub.mutateAsync({
        user_id: user.id,
        plan_type: 'premium_promo',
        billing_cycle: billingCycle,
        number_of_children: numChildren,
        price_per_month: price.perMonth,
        price_per_quarter: price.perQuarter,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        premium_promo_end_date: promoEnd.toISOString(),
        status: 'trial',
      });
      navigate('/onboarding/children', { state: { numChildren, subscriptionCreated: true } });
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    }
  }, [user, billingCycle, numChildren, price, createSub, navigate, toast]);

  if (plansLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  const starterFeatures = [
    'Dashboard real-time parent',
    'Input babysitter unlimited',
    'Tracking susu, makan, tidur, BAB',
    'Foto aktivitas bayi',
    'Lokasi babysitter otomatis (GPS)',
    '3 role (Parent, Babysitter, Viewer)',
    'Riwayat harian & trend mingguan',
    'Export ringkasan via WhatsApp',
  ];

  const premiumFeatures = [
    'Semua fitur Starter',
    'Sampai 4 anak — dashboard terpisah',
    'Unlimited babysitter & viewer',
    'Insight & grafik perbandingan anak',
    'Prioritas support',
    'Fitur baru lebih dulu',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white dark:from-background dark:via-background dark:to-background pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>

      <div className="px-4 pt-2 pb-6 text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ketenangan pikiran,<br />nggak harus mahal.
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau si kecil real-time. Semua paket bisa dicoba gratis.
        </p>
      </div>

      {/* Trial Banner */}
      <div className="px-4 max-w-lg mx-auto mb-5">
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900 shrink-0">
            <Gift className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">7 Hari Gratis — Semua Fitur</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Tanpa kartu kredit. Langsung pakai. Batalkan kapan saja.</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Billing Toggle */}
        <div className="flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingCycle('quarterly')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all relative ${billingCycle === 'quarterly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            Per 3 Bulan
            <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-20%</span>
          </button>
        </div>

        {/* Plan Cards */}
        {/* Starter */}
        <button
          onClick={() => setSelectedPlan('starter')}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
            selectedPlan === 'starter'
              ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
              : 'border-border bg-background hover:border-primary/30'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">Starter</span>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">POPULER</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Untuk 1 anak</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === 'starter' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'starter' && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">Rp</span>
            <span className="text-3xl font-bold">69</span>
            <span className="text-sm text-muted-foreground">rb / bulan</span>
          </div>
          {billingCycle === 'quarterly' && (
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Rp{Math.round(69000 * 0.80 * 3 / 1000)}rb / 3 bulan (hemat 20%)
            </p>
          )}
        </button>

        {/* Premium */}
        <button
          onClick={() => setSelectedPlan('premium')}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all relative ${
            selectedPlan === 'premium'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-400/30'
              : 'border-border bg-background hover:border-amber-400/40'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">Premium</span>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">BEST VALUE</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Sampai 4 anak</p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
              selectedPlan === 'premium' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30'
            }`}>
              {selectedPlan === 'premium' && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">Rp</span>
            <span className="text-3xl font-bold">169</span>
            <span className="text-sm text-muted-foreground">rb / bulan</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
            Hemat 39% vs 4x Starter
          </p>
        </button>

        {/* Features */}
        <div className="bg-background rounded-2xl border border-border p-5 space-y-4">
          <p className="text-sm font-semibold">
            {selectedPlan === 'starter' ? 'Fitur Starter' : 'Fitur Premium'}
          </p>
          <div className="space-y-2.5">
            {(selectedPlan === 'starter' ? starterFeatures : premiumFeatures).map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedPlan === 'premium' ? 'bg-amber-100 dark:bg-amber-900' : 'bg-emerald-100 dark:bg-emerald-900'
                }`}>
                  <Check className={`h-3 w-3 ${
                    selectedPlan === 'premium' ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                </div>
                <span className="text-foreground/80">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { icon: Shield, label: 'Data Terenkripsi', color: 'text-blue-500' },
            { icon: Zap, label: 'Setup 2 Menit', color: 'text-amber-500' },
            { icon: Users, label: 'Multi-role', color: 'text-emerald-500' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        {adminWa && (
          <div className="flex justify-center pt-2">
            <a
              href={`https://wa.me/${adminWa}?text=${encodeURIComponent(`Halo Admin, saya tertarik dengan paket ${selectedPlan === 'starter' ? 'Starter' : 'Premium'} ${brandName}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('pixel_event_whatsapp')}
              className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Ada pertanyaan? Chat admin
            </a>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleStart}
            disabled={createSub.isPending}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-xl shadow-lg"
          >
            {createSub.isPending ? 'Memproses...' : `Coba Gratis 7 Hari — ${selectedPlan === 'starter' ? 'Starter' : 'Premium'}`}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-1.5">
            Gratis 7 hari • Tanpa kartu kredit • Bisa batal kapan saja
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
