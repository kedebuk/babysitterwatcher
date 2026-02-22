import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Phone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CompletePhone = () => {
  const { user, loading, refreshUser } = useAuth();
  const { toast } = useToast();
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
    const dest = user.role === 'admin' ? '/admin/dashboard' : user.role === 'parent' ? '/parent/dashboard' : '/babysitter/today';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      toast({ title: 'Error', description: 'Masukkan nomor HP WhatsApp yang valid', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: trimmed } as any)
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await refreshUser();
    toast({ title: '✅ Nomor HP disimpan!' });
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
