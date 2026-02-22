import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Shield, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { useAdminUpdateSubscription, type Subscription } from '@/hooks/use-subscription';

const AdminUsers = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({
    plan_type: 'trial' as 'trial' | 'standard' | 'premium_promo',
    status: 'trial' as 'trial' | 'active' | 'expired' | 'cancelled',
    billing_cycle: 'monthly' as 'monthly' | 'quarterly',
    number_of_children: 1,
    price_per_month: 0,
    subscription_start_date: new Date().toISOString().split('T')[0],
    subscription_end_date: '',
    admin_override_note: '',
  });

  const adminUpdateSub = useAdminUpdateSubscription();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin_all_profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin_all_roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
  });

  const { data: allSubs = [] } = useQuery({
    queryKey: ['admin_all_subscriptions'],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*');
      return (data || []) as Subscription[];
    },
  });

  const toggleDisable = useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_disabled: disabled } as any).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { disabled }) => {
      qc.invalidateQueries({ queryKey: ['admin_all_profiles'] });
      toast({ title: disabled ? '🚫 User dinonaktifkan' : '✅ User diaktifkan' });
    },
  });

  const getUserRole = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r?.role || 'unknown';
  };

  const getUserSub = (userId: string) => allSubs.find(s => s.user_id === userId);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'parent': return '👩 Parent';
      case 'babysitter': return '👩‍🍼 Babysitter';
      case 'admin': return '🛡️ Admin';
      default: return '❓ Unknown';
    }
  };

  const getSubBadge = (sub?: Subscription) => {
    if (!sub) return <span className="text-[10px] text-muted-foreground">No sub</span>;
    const colors: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    };
    return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[sub.status]}`}>{sub.status}</span>;
  };

  const openSubDialog = (userId: string) => {
    const sub = getUserSub(userId);
    if (sub) {
      setSubForm({
        plan_type: sub.plan_type,
        status: sub.status,
        billing_cycle: sub.billing_cycle,
        number_of_children: sub.number_of_children,
        price_per_month: sub.price_per_month,
        subscription_start_date: sub.subscription_start_date?.split('T')[0] || '',
        subscription_end_date: sub.subscription_end_date?.split('T')[0] || '',
        admin_override_note: sub.admin_override_note || '',
      });
    } else {
      setSubForm({
        plan_type: 'trial',
        status: 'active',
        billing_cycle: 'monthly',
        number_of_children: 1,
        price_per_month: 69000,
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_end_date: '',
        admin_override_note: '',
      });
    }
    setSelectedUserId(userId);
    setSubDialogOpen(true);
  };

  const handleSaveSub = async () => {
    if (!selectedUserId) return;
    try {
      await adminUpdateSub.mutateAsync({
        userId: selectedUserId,
        data: {
          plan_type: subForm.plan_type,
          status: subForm.status,
          billing_cycle: subForm.billing_cycle,
          number_of_children: subForm.number_of_children,
          price_per_month: subForm.price_per_month,
          subscription_end_date: subForm.subscription_end_date || null,
          admin_override_note: subForm.admin_override_note || null,
        },
      });
      toast({ title: '✅ Langganan diperbarui' });
      setSubDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Daftar User</h1>
              <p className="text-xs opacity-80">{profiles.length} user terdaftar</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 max-w-3xl mx-auto">
        {profiles.map((profile: any) => {
          const role = getUserRole(profile.id);
          const isDisabled = profile.is_disabled === true;
          const sub = getUserSub(profile.id);
          return (
            <Card key={profile.id} className={`border-0 shadow-sm ${isDisabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold shrink-0">
                      {profile.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{profile.name} {isDisabled && <span className="text-xs text-destructive">(nonaktif)</span>}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary shrink-0">{getRoleBadge(role)}</span>
                  {role !== 'admin' && (
                    <Switch
                      checked={!isDisabled}
                      onCheckedChange={(checked) => toggleDisable.mutate({ userId: profile.id, disabled: !checked })}
                    />
                  )}
                </div>
                {role !== 'admin' && (
                  <div className="flex items-center justify-between pl-12">
                    <div className="flex items-center gap-2">
                      {getSubBadge(sub)}
                      {sub && <span className="text-[10px] text-muted-foreground">{sub.number_of_children} anak</span>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openSubDialog(profile.id)}>
                      <CreditCard className="h-3 w-3" /> Kelola
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subscription Override Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Langganan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipe Paket</Label>
              <Select value={subForm.plan_type} onValueChange={v => setSubForm(f => ({ ...f, plan_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium_promo">Premium Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={subForm.status} onValueChange={v => setSubForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Billing Cycle</Label>
              <Select value={subForm.billing_cycle} onValueChange={v => setSubForm(f => ({ ...f, billing_cycle: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="quarterly">Per 3 Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Jumlah Anak</Label>
                <Input type="number" min={1} max={10} value={subForm.number_of_children} onChange={e => setSubForm(f => ({ ...f, number_of_children: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga/Bulan (IDR)</Label>
                <Input type="number" value={subForm.price_per_month} onChange={e => setSubForm(f => ({ ...f, price_per_month: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tanggal Berakhir (opsional)</Label>
              <Input type="date" value={subForm.subscription_end_date} onChange={e => setSubForm(f => ({ ...f, subscription_end_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Catatan Admin</Label>
              <Textarea rows={2} value={subForm.admin_override_note} onChange={e => setSubForm(f => ({ ...f, admin_override_note: e.target.value }))} placeholder="Alasan override..." />
            </div>
            <Button onClick={handleSaveSub} disabled={adminUpdateSub.isPending} className="w-full">
              {adminUpdateSub.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;