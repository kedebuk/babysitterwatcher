import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Phone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const CompletePhone = () => {
  const { user, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.phoneComplete) {
    if (!user.role) return <Navigate to="/select-role" replace />;
    const redirectMap: Record<string, string> = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard', viewer: '/viewer/dashboard' };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      toast({ title: 'Error', description: 'Masukkan nomor HP WhatsApp yang valid', variant: 'destructive' });
      return;
    }
    setSaving(true);

    // Use upsert to handle case where profile row might not exist yet
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, phone: trimmed } as any, { onConflict: 'id' });

    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await refreshUser();

    // Capture role before navigating (user.role might be stale in closure)
    const currentRole = user.role;

    // Auto-create 14-day trial for parent users
    if (currentRole === 'parent') {
      try {
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!existingSub) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 14 * 86400000);
          await supabase.from('subscriptions').insert({
            user_id: user.id,
            plan_type: 'trial' as any,
            status: 'trial' as any,
            number_of_children: 1,
            trial_start_date: now.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            subscription_start_date: now.toISOString(),
            price_per_month: 0,
          });
          await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        }
      } catch (err) {
        console.error('Failed to create trial:', err);
      }
      toast({ title: '✅ Nomor HP disimpan! Trial 14 hari aktif 🎉' });
      navigate('/parent/dashboard', { replace: true });
    } else {
      toast({ title: '✅ Nomor HP disimpan!' });
      // Explicitly navigate for ALL roles instead of relying on re-render
      if (!currentRole) {
        navigate('/select-role', { replace: true });
      } else {
        const dest = currentRole === 'admin' ? '/admin/dashboard'
          : currentRole === 'babysitter' ? '/babysitter/today'
          : currentRole === 'viewer' ? '/viewer/dashboard'
          : '/';
        navigate(dest, { replace: true });
      }
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-0 shadow-lg animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Nomor WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Masukkan nomor HP WhatsApp yang bisa dihubungi</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor HP WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="h-12 text-base"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Contoh: 081234567890</p>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={saving}>
              <Save className="mr-2 h-5 w-5" /> {saving ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletePhone;
