import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Shield, CreditCard, Eye, Phone, MapPin, Calendar, Baby, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useAdminUpdateSubscription, type Subscription } from '@/hooks/use-subscription';
import { StorageImage } from '@/components/StorageImage';

const AdminUsers = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
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
      const { data } = await supabase.from('subscriptions' as any).select('*');
      return (data || []) as unknown as Subscription[];
    },
  });

  const { data: allChildren = [] } = useQuery({
    queryKey: ['admin_all_children_for_users'],
    queryFn: async () => {
      const { data } = await supabase.from('children').select('id, name, parent_id, avatar_emoji, photo_url');
      return data || [];
    },
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['admin_all_assignments_for_users'],
    queryFn: async () => {
      const { data } = await supabase.from('assignments').select('child_id, babysitter_user_id');
      return data || [];
    },
  });

  const { data: allViewers = [] } = useQuery({
    queryKey: ['admin_all_viewers_for_users'],
    queryFn: async () => {
      const { data } = await supabase.from('child_viewers').select('child_id, viewer_user_id');
      return data || [];
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

  const getProfileName = (userId: string) => {
    const p = profiles.find((p: any) => p.id === userId);
    return p?.name || p?.email || userId.slice(0, 8);
  };

  // Get children for a parent
  const getChildrenForParent = (parentId: string) => {
    return allChildren.filter((c: any) => c.parent_id === parentId);
  };

  // Get babysitters assigned to a parent's children
  const getBabysittersForParent = (parentId: string) => {
    const childIds = allChildren.filter((c: any) => c.parent_id === parentId).map((c: any) => c.id);
    const babysitterIds = [...new Set(allAssignments.filter((a: any) => childIds.includes(a.child_id)).map((a: any) => a.babysitter_user_id))];
    return babysitterIds.map(id => ({ id, name: getProfileName(id) }));
  };

  // Get parent(s) a babysitter is assigned to
  const getParentsForBabysitter = (babysitterId: string) => {
    const childIds = allAssignments.filter((a: any) => a.babysitter_user_id === babysitterId).map((a: any) => a.child_id);
    const parentIds = [...new Set(allChildren.filter((c: any) => childIds.includes(c.id)).map((c: any) => c.parent_id))];
    return parentIds.map(id => ({ id, name: getProfileName(id) }));
  };

  // Get children a babysitter is assigned to
  const getChildrenForBabysitter = (babysitterId: string) => {
    const childIds = allAssignments.filter((a: any) => a.babysitter_user_id === babysitterId).map((a: any) => a.child_id);
    return allChildren.filter((c: any) => childIds.includes(c.id));
  };

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

  const openProfileDialog = (profile: any) => {
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
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

  const renderConnections = (profile: any, role: string) => {
    if (role === 'parent') {
      const children = getChildrenForParent(profile.id);
      const babysitters = getBabysittersForParent(profile.id);
      if (children.length === 0 && babysitters.length === 0) return null;
      return (
        <div className="ml-12 space-y-1.5 border-l-2 border-primary/20 pl-3">
          {children.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Baby className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {children.map((c: any) => (
                  <span key={c.id} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                    {c.avatar_emoji || '👶'} {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {babysitters.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Users className="h-3.5 w-3.5 text-orange-500/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {babysitters.map(b => (
                  <span key={b.id} className="text-[11px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-1.5 py-0.5 rounded-md font-medium">
                    👩‍🍼 {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (role === 'babysitter') {
      const parents = getParentsForBabysitter(profile.id);
      const children = getChildrenForBabysitter(profile.id);
      if (parents.length === 0 && children.length === 0) return null;
      return (
        <div className="ml-12 space-y-1.5 border-l-2 border-orange-300/40 pl-3">
          {parents.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {parents.map(p => (
                  <span key={p.id} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                    👩 {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {children.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Baby className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {children.map((c: any) => (
                  <span key={c.id} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                    {c.avatar_emoji || '👶'} {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
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
                    <StorageImage src={profile.avatar_url} alt={profile.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
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

                {/* Connections: children & babysitters */}
                {renderConnections(profile, role)}

                {role !== 'admin' && (
                  <div className="flex items-center justify-between pl-12">
                    <div className="flex items-center gap-2">
                      {getSubBadge(sub)}
                      {sub && <span className="text-[10px] text-muted-foreground">{sub.number_of_children} anak</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openProfileDialog(profile)}>
                        <Eye className="h-3 w-3" /> Detail
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openSubDialog(profile.id)}>
                        <CreditCard className="h-3 w-3" /> Kelola
                      </Button>
                    </div>
                  </div>
                )}
                {role === 'admin' && (
                  <div className="flex items-center justify-between pl-12">
                    <div className="flex items-center gap-2">
                      {getSubBadge(sub)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openProfileDialog(profile)}>
                        <Eye className="h-3 w-3" /> Detail
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openSubDialog(profile.id)}>
                        <CreditCard className="h-3 w-3" /> Kelola
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detail Profil</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedProfile.avatar_url ? (
                  <StorageImage src={selectedProfile.avatar_url} alt={selectedProfile.name} className="h-24 w-24 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-3xl font-bold">
                    {selectedProfile.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{selectedProfile.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary inline-block mt-1">
                  {getRoleBadge(getUserRole(selectedProfile.id))}
                </span>
              </div>
              <div className="space-y-2 bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">No. HP:</span>
                  <span className="text-muted-foreground">{selectedProfile.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">Tgl Lahir:</span>
                  <span className="text-muted-foreground">{selectedProfile.dob || '-'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="font-medium">Alamat:</span>
                  <span className="text-muted-foreground">{selectedProfile.address || '-'}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Bergabung: {new Date(selectedProfile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
