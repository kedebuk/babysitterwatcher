import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MessageCircle, BarChart3, Server, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsState {
  // WhatsApp
  admin_whatsapp: string;

  // Meta Pixel
  meta_pixel_id: string;

  // Pixel events
  pixel_event_landing: string; // saat user masuk landing/login
  pixel_event_signup: string; // saat user berhasil daftar / Google auth
  pixel_event_whatsapp: string; // saat klik tombol WhatsApp

  // Meta CAPI
  meta_capi_dataset_id: string;
  meta_capi_access_token: string;
}

const defaultSettings: SettingsState = {
  admin_whatsapp: '',
  meta_pixel_id: '',

  // kamu bisa ganti default ini kalau mau
  pixel_event_landing: 'Lead', // atau InitiateCheckout
  pixel_event_signup: 'CompleteRegistration',
  pixel_event_whatsapp: 'Purchase',

  meta_capi_dataset_id: '',
  meta_capi_access_token: '',
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCapiToken, setShowCapiToken] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('app_settings' as any).select('key, value');
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (data) {
        const map: Partial<SettingsState> = {};
        (data as any[]).forEach((row: any) => {
          if (row.key in defaultSettings) {
            (map as any)[row.key] = row.value ?? '';
          }
        });
        setSettings(prev => ({ ...prev, ...map }));
      }

      setLoading(false);
    };

    load();
  }, [toast]);

  const update = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
const handleSave = async () => {
  setSaving(true);
  try {
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(settings)) {
      const trimmed = String(value ?? '').trim();

      // 1) coba update dulu
      const { error: updateError, count } = await supabase
        .from('app_settings' as any)
        .update({ value: trimmed, updated_at: now } as any, { count: 'exact' } as any)
        .eq('key', key);

      if (updateError) throw updateError;

      // 2) kalau tidak ada row yang ter-update, insert
      if (!count || count === 0) {
        const { error: insertError } = await supabase
          .from('app_settings' as any)
          .insert({ key, value: trimmed, updated_at: now } as any);

        if (insertError) throw insertError;
      }
    }

    toast({ title: '✅ Tersimpan', description: 'Pengaturan berhasil diperbarui' });
  } catch (e: any) {
    toast({ title: 'Error', description: e.message, variant: 'destructive' });
  }
  setSaving(false);
};;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive-foreground hover:bg-destructive-foreground/20"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Pengaturan</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* WhatsApp Admin */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="wa">Nomor WhatsApp (dengan kode negara)</Label>
              <Input
                id="wa"
                placeholder="6281234567890"
                value={settings.admin_whatsapp}
                onChange={e => update('admin_whatsapp', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Contoh: 6281234567890 (tanpa + atau spasi)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Ads Pixel + Events */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" /> Meta Ads Pixel
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixel_id">Pixel ID</Label>
              <Input
                id="pixel_id"
                placeholder="123456789012345"
                value={settings.meta_pixel_id}
                onChange={e => update('meta_pixel_id', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dapatkan dari Meta Events Manager → Pixel → Settings
              </p>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Event Triggers</p>

              <div className="space-y-2">
                <Label htmlFor="event_landing">Event saat user masuk landing depan (halaman Login)</Label>
                <Input
                  id="event_landing"
                  placeholder="Lead"
                  value={settings.pixel_event_landing}
                  onChange={e => update('pixel_event_landing', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: Lead atau InitiateCheckout (sesuai alur kamu)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_signup">Event saat user berhasil daftar (form atau Google)</Label>
                <Input
                  id="event_signup"
                  placeholder="CompleteRegistration"
                  value={settings.pixel_event_signup}
                  onChange={e => update('pixel_event_signup', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: CompleteRegistration, Subscribe
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_wa">Event saat klik tombol WhatsApp</Label>
                <Input
                  id="event_wa"
                  placeholder="Purchase"
                  value={settings.pixel_event_whatsapp}
                  onChange={e => update('pixel_event_whatsapp', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: Purchase, Contact, InitiateCheckout
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta Ads CAPI */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-5 w-5 text-slate-700" /> Meta Ads CAPI
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capi_dataset">Dataset ID</Label>
              <Input
                id="capi_dataset"
                placeholder="4372773073036972"
                value={settings.meta_capi_dataset_id}
                onChange={e => update('meta_capi_dataset_id', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Isi sesuai Dataset ID di Meta. Contoh seperti di screenshot kamu.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capi_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="capi_token"
                  type={showCapiToken ? 'text' : 'password'}
                  placeholder="EA...."
                  value={settings.meta_capi_access_token}
                  onChange={e => update('meta_capi_access_token', e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCapiToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCapiToken ? 'Sembunyikan token' : 'Lihat token'}
                >
                  {showCapiToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token ini sensitif. Simpan yang benar sesuai yang kamu kirim.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-semibold">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
