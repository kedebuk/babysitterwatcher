import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MessageCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsState {
  admin_whatsapp: string;
  meta_pixel_id: string;
  pixel_event_signup: string;
  pixel_event_whatsapp: string;
}

const defaultSettings: SettingsState = {
  admin_whatsapp: '',
  meta_pixel_id: '',
  pixel_event_signup: 'CompleteRegistration',
  pixel_event_whatsapp: 'Purchase',
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('app_settings' as any)
        .select('key, value');
      if (data) {
        const map: Partial<SettingsState> = {};
        (data as any[]).forEach((row: any) => {
          if (row.key in defaultSettings) {
            (map as any)[row.key] = row.value;
          }
        });
        setSettings(prev => ({ ...prev, ...map }));
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('app_settings' as any)
          .update({ value: value.trim(), updated_at: now } as any)
          .eq('key', key);
        if (error) throw error;
      }
      toast({ title: '✅ Tersimpan', description: 'Pengaturan berhasil diperbarui' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const update = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={() => navigate('/admin/dashboard')}>
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

        {/* Meta Pixel */}
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
                <Label htmlFor="event_signup">Event saat user Daftar / Google Auth</Label>
                <Input
                  id="event_signup"
                  placeholder="CompleteRegistration"
                  value={settings.pixel_event_signup}
                  onChange={e => update('pixel_event_signup', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dikirim saat user baru berhasil daftar (form atau Google). Contoh: CompleteRegistration, Lead, Subscribe
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
                  Dikirim saat user klik tombol WhatsApp di halaman pricing. Contoh: Purchase, Contact, InitiateCheckout
                </p>
              </div>
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
