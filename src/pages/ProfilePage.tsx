import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my_profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Load profile data once
  if (profile && !profileLoaded) {
    setName(profile.name || '');
    setAddress((profile as any).address || '');
    setProfileLoaded(true);
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Nama wajib diisi', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), address: address.trim() || null })
      .eq('id', user!.id);

    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      await refreshUser();
      toast({ title: '✅ Profil disimpan!' });
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password baru minimal 6 karakter', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Konfirmasi password tidak cocok', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Profil Saya</h1>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1.5" /> Profil</TabsTrigger>
            <TabsTrigger value="password"><Lock className="h-4 w-4 mr-1.5" /> Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-sm text-muted-foreground">Edit informasi profil Anda</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="h-12 text-base bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nama Lengkap *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" className="h-12 text-base" maxLength={100} />
                </div>
                <div className="space-y-1.5">
                  <Label>Alamat</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat (opsional)" className="h-12 text-base" maxLength={500} />
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full h-12 text-base font-semibold">
                  <Save className="mr-2 h-5 w-5" /> {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-sm text-muted-foreground">Ubah password akun Anda</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Password Baru *</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 karakter" className="h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label>Konfirmasi Password Baru *</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" className="h-12 text-base" />
                </div>
                <Button onClick={handleChangePassword} disabled={savingPassword} className="w-full h-12 text-base font-semibold">
                  <Lock className="mr-2 h-5 w-5" /> {savingPassword ? 'Mengubah...' : 'Ubah Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav role={user?.role === 'babysitter' ? 'babysitter' : 'parent'} />
    </div>
  );
};

export default ProfilePage;
