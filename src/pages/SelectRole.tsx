import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Baby, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SelectRole = () => {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={user.role === 'parent' ? '/parent/dashboard' : '/babysitter/today'} replace />;
  }

  const handleSelectRole = async (role: 'parent' | 'babysitter' | 'viewer') => {
    setSaving(true);
    const { error } = await supabase.from('user_roles').insert({
      user_id: user.id,
      role,
    });
    if (error) {
      toast({ title: 'Gagal menyimpan role', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }
    // Reload to pick up new role
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Baby className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Pilih Peran Anda</h1>
          <p className="text-sm text-muted-foreground">Halo {user.name}! Silakan pilih peran Anda.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-14 text-base justify-start gap-3"
            onClick={() => handleSelectRole('parent')}
            disabled={saving}
          >
            <span className="text-2xl">👩</span>
            <div className="text-left">
              <div className="font-semibold">Orang Tua</div>
              <div className="text-xs text-muted-foreground">Kelola data & aktivitas anak</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base justify-start gap-3"
            onClick={() => handleSelectRole('babysitter')}
            disabled={saving}
          >
            <span className="text-2xl">👩‍🍼</span>
            <div className="text-left">
              <div className="font-semibold">Babysitter</div>
              <div className="text-xs text-muted-foreground">Input aktivitas anak yang ditugaskan</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base justify-start gap-3"
            onClick={() => handleSelectRole('viewer')}
            disabled={saving}
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <div className="text-left">
              <div className="font-semibold">Keluarga</div>
              <div className="text-xs text-muted-foreground">Lihat aktivitas anak (view only, gratis)</div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRole;
