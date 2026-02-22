import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePricingPlans, useCreateSubscription, calculatePrice, formatRupiah } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Baby, Sparkles, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { useMetaPixel } from '@/hooks/use-meta-pixel';

const TOTAL_SLOTS = 62;

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const key = 'eleanor_promo_end';
    let target = localStorage.getItem(key);
    if (!target) {
      const end = new Date();
      end.setDate(end.getDate() + 2);
      end.setHours(end.getHours() + 11);
      end.setMinutes(end.getMinutes() + 45);
      target = end.toISOString();
      localStorage.setItem(key, target);
    }
    const endDate = new Date(target);

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, endDate.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function useSlots() {
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem('eleanor_promo_slots');
    return saved ? parseInt(saved, 10) : 47;
  });

  useEffect(() => {
    const schedule = () => {
      const delay = (Math.random() * 30 + 15) * 1000;
      return setTimeout(() => {
        setSlots(prev => {
          const next = Math.max(12, prev - (Math.random() > 0.5 ? 2 : 1));
          localStorage.setItem('eleanor_promo_slots', String(next));
          return next;
        });
        timerId = schedule();
      }, delay);
    };
    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, []);

  return slots;
}

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans = [], isLoading: plansLoading } = usePricingPlans();
  const createSub = useCreateSubscription();
  const countdown = useCountdown();
  const slots = useSlots();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [numChildren, setNumChildren] = useState(1);
  const [customCount, setCustomCount] = useState(false);
  const [adminWa, setAdminWa] = useState('');
  const { trackEvent } = useMetaPixel();

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

  const price = calculatePrice(numChildren, billingCycle, plans);

  const handleStart = useCallback(async () => {
    if (!user) { navigate('/login'); return; }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 86400000);
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

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Promo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1F36] via-[#2D1B69] to-[#E85555] px-4 py-6 text-white">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-red-600 text-white border-0 text-xs font-bold">🔥 PROMO TERBATAS</Badge>
          <Badge className="bg-amber-500 text-black border-0 text-xs font-bold">⭐ 1 TAHUN PENUH</Badge>
        </div>
        <h1 className="text-xl font-bold mb-2 leading-tight">
          Daftar sekarang, dapatkan <span className="text-amber-300">GRATIS</span> upgrade Premium selama 1 TAHUN!
        </h1>
        <p className="text-sm opacity-90 mb-4">
          Khusus pengguna baru — bayar harga Standar, langsung nikmati semua fitur Premium senilai Rp109.000/anak selama 12 bulan penuh.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-lg font-bold text-amber-300">Rp69rb</p>
            <p className="text-[10px] opacity-70">Anda Bayar/bln</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-lg font-bold line-through opacity-60">Rp109rb</p>
            <p className="text-[10px] opacity-70">Harga Premium</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-lg font-bold text-[#E85555]">12 BULAN</p>
            <p className="text-[10px] opacity-70">Premium Gratis</p>
          </div>
        </div>

        {/* Highlight */}
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 mb-4">
          <p className="text-xs">💰 Anda hemat <strong>Rp40.000/anak</strong> setiap bulan selama setahun penuh. Itu sama dengan <strong>Rp480.000 per anak</strong> yang tidak perlu Anda keluarkan!</p>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 justify-center mb-3">
          <Clock className="h-4 w-4 text-amber-300" />
          <p className="text-xs font-medium">Penawaran berakhir dalam:</p>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { v: countdown.days, l: 'Hari' },
            { v: countdown.hours, l: 'Jam' },
            { v: countdown.minutes, l: 'Menit' },
            { v: countdown.seconds, l: 'Detik' },
          ].map(({ v, l }) => (
            <div key={l} className="bg-black/30 rounded-lg p-2 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold font-mono">{pad(v)}</p>
              <p className="text-[10px] opacity-70">{l}</p>
            </div>
          ))}
        </div>

        {/* Slot bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Slot terisi</span>
            <span className="text-amber-300">Sisa {slots} slot</span>
          </div>
          <Progress value={((TOTAL_SLOTS - slots) / TOTAL_SLOTS) * 100} className="h-2 bg-white/20" />
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Billing Toggle */}
        <div>
          <p className="text-sm font-semibold mb-2">Pilih durasi langganan</p>
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
              <Badge className="absolute -top-2 -right-1 bg-red-500 text-white border-0 text-[9px] px-1.5">HEMAT 15%</Badge>
            </button>
          </div>
        </div>

        {/* Child Selector */}
        <div>
          <p className="text-sm font-semibold mb-2">Jumlah anak</p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => { setNumChildren(n); setCustomCount(false); }}
                className={`flex flex-col items-center justify-center rounded-2xl p-3 border-2 transition-all ${
                  numChildren === n && !customCount
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span className="text-lg">{'👶'.repeat(Math.min(n, 3))}{n > 3 ? '👨‍👩‍👧‍👦' : ''}</span>
                <span className="text-[11px] font-medium mt-1">{n} Anak</span>
              </button>
            ))}
            <button
              onClick={() => { setCustomCount(true); setNumChildren(5); }}
              className={`flex flex-col items-center justify-center rounded-2xl p-3 border-2 transition-all ${
                customCount
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40'
              }`}
            >
              <span className="text-lg">5+</span>
              <span className="text-[11px] font-medium mt-1">Lainnya</span>
            </button>
          </div>
          {customCount && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Jumlah:</label>
              <input
                type="number"
                min={5}
                max={10}
                value={numChildren}
                onChange={e => setNumChildren(Math.max(5, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        {/* Price Calculator */}
        <Card className="border-0 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Rincian Harga
            </p>
            <div className="space-y-1.5">
              {Array.from({ length: numChildren }, (_, i) => {
                const plan = plans.find(p => p.child_order === Math.min(i + 1, 5));
                if (!plan) return null;
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i < 5 ? plan.plan_name : `Anak ke-${i + 1}`}</span>
                    <span>{formatRupiah(plan.monthly_price_idr)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-amber-200 dark:border-amber-800 pt-2">
              {billingCycle === 'quarterly' && (
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Diskon 15% (per 3 bulan)</span>
                  <span>−15%</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total {billingCycle === 'quarterly' ? '/ 3 bulan' : '/ bulan'}</span>
                <span className="text-primary">
                  {formatRupiah(billingCycle === 'quarterly' ? price.perQuarter! : price.perMonth)}
                </span>
              </div>
              {billingCycle === 'quarterly' && (
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>Per bulan</span>
                  <span>{formatRupiah(price.perMonth)}/bln</span>
                </div>
              )}
              {price.savings > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                    Hemat {formatRupiah(price.savings)}{billingCycle === 'quarterly' ? ' / 3 bulan' : ' / bulan'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Termasuk dalam paket:</p>
          {[
            'Monitoring aktivitas real-time',
            'Catatan harian lengkap',
            'Chat langsung dengan pengasuh',
            'Insight & laporan AI',
            'Lokasi real-time pengasuh',
            'Multi-anak & multi-pengasuh',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        {/* WhatsApp CTA */}
        {adminWa && (
          <div className="flex justify-center">
            <a
              href={`https://wa.me/${adminWa}?text=${encodeURIComponent('Halo Admin, saya ingin konfirmasi pembelian paket Eleanor Tracker.')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('pixel_event_whatsapp')}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition-colors shadow-md"
            >
              <MessageCircle className="h-5 w-5" />
              Hubungi Admin via WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          onClick={handleStart}
          disabled={createSub.isPending}
          className="w-full h-12 text-base font-bold bg-gradient-to-r from-[#E85555] to-[#D94444] hover:from-[#D94444] hover:to-[#C53333] text-white rounded-xl shadow-lg"
        >
          {createSub.isPending ? 'Memproses...' : '🚀 Mulai Coba GRATIS 3 Hari'}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-1.5">
          Gratis 3 hari • Bisa batal kapan saja • Premium 1 tahun
        </p>
      </div>
    </div>
  );
};

export default Pricing;
