import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MessageCircle, BarChart3, Server, Eye, EyeOff, Zap, Palette, Upload, Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePixel } from '@/components/MetaPixelProvider';
import { useBrand } from '@/contexts/BrandContext';

interface SettingsState {
  // WhatsApp
  admin_whatsapp: string;

  // Brand
  brand_name: string;
  brand_logo_url: string;
  brand_favicon_url: string;

  // Meta Pixel
  meta_pixel_id: string;

  // Pixel events
  pixel_event_landing: string;
  pixel_event_signup: string;
  pixel_event_whatsapp: string;

  // Meta CAPI
  meta_capi_dataset_id: string;
  meta_capi_access_token: string;
}

const defaultSettings: SettingsState = {
  admin_whatsapp: '',
  brand_name: 'Eleanor Tracker',
  brand_logo_url: '',
  brand_favicon_url: '',
  meta_pixel_id: '',
  pixel_event_landing: 'Lead',
  pixel_event_signup: 'CompleteRegistration',
  pixel_event_whatsapp: 'Purchase',
  meta_capi_dataset_id: '',
  meta_capi_access_token: '',
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent, settings: pixelSettings } = usePixel();
  const { refresh: refreshBrand } = useBrand();

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCapiToken, setShowCapiToken] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [testingCapi, setTestingCapi] = useState(false);

  const handleTestEvent = async (eventKey: string, label: string) => {
    const eventName = settings[eventKey as keyof SettingsState];
    if (!eventName) {
      toast({ title: '⚠️ Event kosong', description: `Isi nama event untuk ${label}`, variant: 'destructive' });
      return;
    }

    // Browser pixel test
    if (settings.meta_pixel_id && window.fbq) {
      window.fbq('track', eventName);
      toast({ title: '✅ Pixel terkirim!', description: `Event "${eventName}" dikirim via browser pixel` });
    } else if (settings.meta_pixel_id) {
      toast({ title: '⚠️ Pixel belum aktif', description: 'Simpan pengaturan dulu lalu refresh halaman', variant: 'destructive' });
    }

    // CAPI test
    if (settings.meta_capi_dataset_id && settings.meta_capi_access_token) {
      setTestingCapi(true);
      try {
        const { data, error } = await supabase.functions.invoke('meta-capi', {
          body: {
            event_name: eventName,
            event_source_url: window.location.href,
            user_data: {},
          },
        });
        if (error) throw error;
        if (data?.error) {
          toast({ title: '❌ CAPI gagal', description: data.error, variant: 'destructive' });
        } else {
          toast({ title: '✅ CAPI terkirim!', description: `Event "${eventName}" dikirim via server-side CAPI` });
        }
      } catch (e: any) {
        toast({ title: '❌ CAPI error', description: e.message, variant: 'destructive' });
      }
      setTestingCapi(false);
    } else if (!settings.meta_pixel_id) {
      toast({ title: '⚠️ Belum ada konfigurasi', description: 'Isi Pixel ID atau CAPI Dataset ID + Token', variant: 'destructive' });
    }
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'favicon') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${type}.${ext}`;
      await supabase.storage.from('brand-assets').remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file, { upsert: true, cacheControl: '0' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      const settingKey = type === 'logo' ? 'brand_logo_url' : 'brand_favicon_url';
      update(settingKey as keyof SettingsState, publicUrl);
      toast({ title: '✅ Upload berhasil', description: `${type === 'logo' ? 'Logo' : 'Favicon'} berhasil diupload` });
    } catch (e: any) {
      toast({ title: '❌ Upload gagal', description: e.message, variant: 'destructive' });
    }
    setUploading(false);
  };

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

  // SAVE AMAN: update dulu, kalau tidak ada row yang keupdate, insert
  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();

      for (const [key, value] of Object.entries(settings)) {
        const trimmed = String(value ?? '').trim();

        // 1) coba update dulu
        const { data: updatedRows, error: updateError } = await supabase
          .from('app_settings' as any)
          .update({ value: trimmed, updated_at: now } as any)
          .eq('key', key)
          .select('key');

        if (updateError) throw updateError;

        // 2) kalau tidak ada row yang terupdate, insert
        if (!updatedRows || (updatedRows as any[]).length === 0) {
          const { error: insertError } = await supabase
            .from('app_settings' as any)
            .insert({ key, value: trimmed, updated_at: now } as any);

          if (insertError) throw insertError;
        }
      }

      await refreshBrand();
      toast({ title: '✅ Tersimpan', description: 'Pengaturan berhasil diperbarui' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;
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
        {/* Brand / Identitas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Identitas Brand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Nama Brand / Aplikasi</Label>
              <Input
                id="brand_name"
                placeholder="Eleanor Tracker"
                value={settings.brand_name}
                onChange={e => update('brand_name', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Nama ini akan muncul di seluruh halaman website</p>
            </div>

            <div className="space-y-2">
              <Label>Logo Brand</Label>
              <div className="flex items-center gap-3">
                {settings.brand_logo_url ? (
                  <div className="relative h-14 w-14 rounded-xl border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={settings.brand_logo_url} alt="Logo" className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => update('brand_logo_url', '')}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'logo'); }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Rekomendasi: 200x200px, PNG/JPG</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon (Ikon Tab Browser)</Label>
              <div className="flex items-center gap-3">
                {settings.brand_favicon_url ? (
                  <div className="relative h-10 w-10 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    <img src={settings.brand_favicon_url} alt="Favicon" className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => update('brand_favicon_url', '')}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Image className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, 'favicon'); }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingFavicon} onClick={() => faviconInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Rekomendasi: 32x32 atau 64x64px, PNG/ICO</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <p className="text-xs text-muted-foreground">Contoh: 6281234567890 (tanpa + atau spasi)</p>
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
              <p className="text-xs text-muted-foreground">Dapatkan dari Meta Events Manager → Pixel → Settings</p>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Event Triggers</p>

              <div className="space-y-2">
                <Label htmlFor="event_landing">Event saat user masuk landing depan (halaman Login)</Label>
                <div className="flex gap-2">
                  <Input
                    id="event_landing"
                    placeholder="Lead"
                    value={settings.pixel_event_landing}
                    onChange={e => update('pixel_event_landing', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleTestEvent('pixel_event_landing', 'Landing')}>
                    <Zap className="h-3.5 w-3.5" /> Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Contoh: Lead atau InitiateCheckout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_signup">Event saat user berhasil daftar (form atau Google)</Label>
                <div className="flex gap-2">
                  <Input
                    id="event_signup"
                    placeholder="CompleteRegistration"
                    value={settings.pixel_event_signup}
                    onChange={e => update('pixel_event_signup', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleTestEvent('pixel_event_signup', 'Signup')}>
                    <Zap className="h-3.5 w-3.5" /> Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Contoh: CompleteRegistration</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_wa">Event saat klik tombol WhatsApp</Label>
                <div className="flex gap-2">
                  <Input
                    id="event_wa"
                    placeholder="Purchase"
                    value={settings.pixel_event_whatsapp}
                    onChange={e => update('pixel_event_whatsapp', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleTestEvent('pixel_event_whatsapp', 'WhatsApp')}>
                    <Zap className="h-3.5 w-3.5" /> Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Contoh: Purchase, Contact, InitiateCheckout</p>
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
              <p className="text-xs text-muted-foreground">Isi sesuai Dataset ID di Meta</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capi_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="capi_token"
                  type={showCapiToken ? 'text' : 'password'}
                  placeholder="EA..."
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
              <p className="text-xs text-muted-foreground">Token ini sensitif</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={testingCapi || !settings.meta_capi_dataset_id || !settings.meta_capi_access_token}
              onClick={() => handleTestEvent('pixel_event_landing', 'CAPI Test')}
            >
              <Zap className="h-4 w-4" />
              {testingCapi ? 'Mengirim...' : 'Test CAPI (kirim event Landing)'}
            </Button>
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
