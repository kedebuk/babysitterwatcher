import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

const CompleteProfile = () => {
  const { user, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.role) return <Navigate to="/select-role" replace />;
  if (user.role !== 'babysitter' || user.profileComplete) {
    return <Navigate to="/babysitter/today" replace />;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const computeAge = (dobStr: string) => {
    const d = parseISO(dobStr);
    const years = differenceInYears(new Date(), d);
    const months = differenceInMonths(new Date(), d) % 12;
    if (years > 0) return `${years} tahun${months > 0 ? ` ${months} bulan` : ''}`;
    return `${months} bulan`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob || !address.trim()) {
      toast({ title: 'Error', description: 'Semua field wajib diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);

    let avatar_url: string | undefined;

    // Upload photo if selected
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('child-photos')
        .upload(path, photoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('child-photos').getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const updateData: Record<string, any> = {
      name: name.trim(),
      dob,
      address: address.trim(),
    };
    if (avatar_url) updateData.avatar_url = avatar_url;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await refreshUser();
    toast({ title: '✅ Profil disimpan!' });
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <h1 className="text-xl font-bold">Lengkapi Profil Anda</h1>
          <p className="text-sm text-muted-foreground">Sebagai babysitter, Anda wajib melengkapi data profil.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              <div
                className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-primary/30"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">Tap untuk upload foto profil</p>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cp-name">Nama Lengkap *</Label>
              <Input
                id="cp-name"
                placeholder="Nama lengkap Anda"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-12 text-base"
                maxLength={100}
              />
            </div>

            {/* DOB */}
            <div className="space-y-1.5">
              <Label htmlFor="cp-dob">Tanggal Lahir *</Label>
              <Input
                id="cp-dob"
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                className="h-12 text-base"
              />
              {dob && (
                <p className="text-xs text-muted-foreground">Umur: {computeAge(dob)}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="cp-address">Alamat *</Label>
              <Textarea
                id="cp-address"
                placeholder="Alamat lengkap Anda"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                className="text-base min-h-[80px]"
                maxLength={500}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={saving}>
              <Save className="mr-2 h-5 w-5" /> Simpan Profil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
