import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Loader2, Navigation, RefreshCw, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 15); }, [lat, lng, map]);
  return null;
}

interface ConnectedPerson {
  id: string;
  name: string;
  role: string;
}

const LocationPage = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const role = activeRole || user?.role;

  // Get children based on role
  const { data: assignedChildren = [] } = useQuery({
    queryKey: ['location_children', user?.id, role],
    queryFn: async () => {
      if (role === 'babysitter') {
        const { data } = await supabase.from('assignments').select('child_id, children(*)').eq('babysitter_user_id', user!.id);
        return (data || []).map((a: any) => a.children).filter(Boolean);
      } else if (role === 'viewer') {
        const { data: viewerRecs } = await supabase.from('child_viewers').select('child_id').eq('viewer_user_id', user!.id);
        if (!viewerRecs?.length) return [];
        const childIds = viewerRecs.map(v => v.child_id);
        const { data } = await supabase.from('children').select('*').in('id', childIds);
        return data || [];
      } else if (role === 'parent') {
        // Get own children + children where invited as viewer
        const { data: ownChildren } = await supabase.from('children').select('*').eq('parent_id', user!.id);
        const { data: viewerRecs } = await supabase.from('child_viewers').select('child_id').eq('viewer_user_id', user!.id);
        const viewerChildIds = (viewerRecs || []).map(v => v.child_id).filter(id => !(ownChildren || []).some((c: any) => c.id === id));
        let viewerChildren: any[] = [];
        if (viewerChildIds.length) {
          const { data } = await supabase.from('children').select('*').in('id', viewerChildIds);
          viewerChildren = data || [];
        }
        return [...(ownChildren || []), ...viewerChildren];
      } else {
        const { data } = await supabase.from('children').select('*').eq('parent_id', user!.id);
        return data || [];
      }
    },
    enabled: !!user,
  });

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || assignedChildren[0]?.id || '';
  const [sendingLocation, setSendingLocation] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  // Get all connected people for selected child (babysitters + viewers + parent)
  const { data: connectedPeople = [] } = useQuery({
    queryKey: ['connected_people', activeChildId, user?.id],
    queryFn: async () => {
      const people: ConnectedPerson[] = [];

      // Get parent of child
      const child = assignedChildren.find((c: any) => c.id === activeChildId);
      if (child?.parent_id && child.parent_id !== user!.id) {
        const { data: parentProfile } = await supabase.from('profiles').select('id, name').eq('id', child.parent_id).single();
        if (parentProfile) people.push({ id: parentProfile.id, name: parentProfile.name, role: 'Parent' });
      }

      // Get babysitters
      const { data: assignments } = await supabase.from('assignments').select('babysitter_user_id').eq('child_id', activeChildId);
      if (assignments?.length) {
        const bIds = assignments.map(a => a.babysitter_user_id).filter(id => id !== user!.id);
        if (bIds.length) {
          const { data: bProfiles } = await supabase.from('profiles').select('id, name').in('id', bIds);
          (bProfiles || []).forEach(p => people.push({ id: p.id, name: p.name, role: 'Babysitter' }));
        }
      }

      // Get viewers
      const { data: viewers } = await supabase.from('child_viewers').select('viewer_user_id').eq('child_id', activeChildId);
      if (viewers?.length) {
        const vIds = viewers.map(v => v.viewer_user_id).filter(id => id !== user!.id);
        if (vIds.length) {
          const { data: vProfiles } = await supabase.from('profiles').select('id, name').in('id', vIds);
          (vProfiles || []).forEach(p => {
            if (!people.find(pp => pp.id === p.id)) {
              people.push({ id: p.id, name: p.name, role: 'Keluarga' });
            }
          });
        }
      }

      return people;
    },
    enabled: !!activeChildId && !!user && (role === 'parent' || role === 'viewer'),
  });

  // Reset selected people when child changes
  useEffect(() => {
    setSelectedPeople([]);
  }, [activeChildId]);

  const togglePerson = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const selectAll = () => {
    if (selectedPeople.length === connectedPeople.length) {
      setSelectedPeople([]);
    } else {
      setSelectedPeople(connectedPeople.map(p => p.id));
    }
  };

  const requestLocation = async () => {
    const targetIds = selectedPeople.length > 0 ? selectedPeople : connectedPeople.map(p => p.id);
    if (!targetIds.length || !user) return;
    setRequesting(true);
    try {
      const childName = assignedChildren.find((c: any) => c.id === activeChildId)?.name || 'anak';
      const notifications = targetIds.map((personId: string) => ({
        user_id: personId,
        message: `📍 ${user.name} meminta update lokasi Anda untuk ${childName}. Buka halaman Lokasi dan aktifkan "Bagikan Lokasi".`,
      }));
      await supabase.from('notifications').insert(notifications);
      const targetNames = targetIds.map(id => connectedPeople.find(p => p.id === id)?.name).filter(Boolean).join(', ');
      toast({ title: '✅ Permintaan terkirim', description: `Notifikasi dikirim ke ${targetNames || 'semua orang terhubung'}.` });
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    } finally {
      setRequesting(false);
    }
  };

  const refreshLocation = () => {
    qc.invalidateQueries({ queryKey: ['location_pings', activeChildId] });
    toast({ title: '🔄 Lokasi di-refresh' });
  };

  // Get latest location pings
  const { data: pings = [] } = useQuery({
    queryKey: ['location_pings', activeChildId],
    queryFn: async () => {
      const { data } = await supabase
        .from('location_pings')
        .select('*')
        .eq('child_id', activeChildId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!activeChildId,
    refetchInterval: 10000,
  });

  // Realtime
  useEffect(() => {
    if (!activeChildId) return;
    const channel = supabase
      .channel(`loc-${activeChildId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_pings', filter: `child_id=eq.${activeChildId}` }, () => {
        qc.invalidateQueries({ queryKey: ['location_pings', activeChildId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChildId, qc]);

  const sendMyLocation = useCallback(async () => {
    if (!activeChildId || !user) return;
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'GPS tidak didukung di perangkat ini', variant: 'destructive' });
      return;
    }
    setSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from('location_pings').insert({
          user_id: user.id,
          child_id: activeChildId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast({ title: '📍 Lokasi terkirim', description: 'Posisi Anda berhasil dikirim.' });
        setSendingLocation(false);
      },
      (err) => {
        toast({ title: 'GPS Error', description: err.message, variant: 'destructive' });
        setSendingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [activeChildId, user, toast]);

  const backPath = role === 'parent' ? '/parent/dashboard' : role === 'viewer' ? '/viewer/dashboard' : '/babysitter/today';

  // Get profile names for pings
  const { data: pingProfiles = {} } = useQuery({
    queryKey: ['ping_profiles', pings.map((p: any) => p.user_id).join(',')],
    queryFn: async () => {
      const ids = [...new Set(pings.map((p: any) => p.user_id))];
      if (!ids.length) return {};
      const { data } = await supabase.from('profiles').select('id, name').in('id', ids);
      const map: Record<string, string> = {};
      (data || []).forEach(p => { map[p.id] = p.name; });
      return map;
    },
    enabled: pings.length > 0,
  });

  // Group pings by user (latest ping per user)
  const latestPingPerUser = (() => {
    const seen = new Set<string>();
    return pings.filter((p: any) => {
      if (seen.has(p.user_id)) return false;
      seen.add(p.user_id);
      return true;
    });
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-[1000] bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <MapPin className="h-5 w-5" />
          <h1 className="text-lg font-bold">Lokasi GPS</h1>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3 max-w-2xl mx-auto w-full">
        <Select value={activeChildId} onValueChange={setSelectedChild}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
          <SelectContent>
            {assignedChildren.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji || '👶'} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button
          className="w-full h-12 text-base font-bold"
          onClick={sendMyLocation}
          disabled={!activeChildId || sendingLocation}
        >
          {sendingLocation ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim Lokasi...</>
          ) : (
            <><Navigation className="mr-2 h-4 w-4" /> Kirim Lokasi Saya</>
          )}
        </Button>

        {(role === 'parent' || role === 'viewer') && connectedPeople.length > 0 && (
          <Card className="border shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4" />
                  Pilih orang untuk request lokasi
                </div>
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {selectedPeople.length === connectedPeople.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div className="space-y-1.5">
                {connectedPeople.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPeople.includes(person.id)}
                      onCheckedChange={() => togglePerson(person.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(role === 'parent' || role === 'viewer') && (
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1 h-12 text-base font-bold gap-2"
              onClick={requestLocation}
              disabled={!activeChildId || requesting || connectedPeople.length === 0}
            >
              {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {selectedPeople.length > 0
                ? `Request Posisi (${selectedPeople.length})`
                : 'Request Semua'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={refreshLocation}
              disabled={!activeChildId}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 max-w-2xl mx-auto w-full space-y-2">
        {latestPingPerUser.length > 0 ? (
          latestPingPerUser.map((ping: any) => (
            <Card key={ping.id} className="border shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{pingProfiles[ping.user_id] || 'Pengguna'}</p>
                  <p className="text-xs text-muted-foreground">
                    Terakhir: {format(new Date(ping.created_at), 'HH:mm:ss, d MMM', { locale: idLocale })}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${ping.latitude},${ping.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" /> Buka Google Maps
                </a>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-sm bg-muted/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{role === 'babysitter' ? 'Tekan "Bagikan Lokasi" untuk mulai berbagi.' : 'Belum ada lokasi dari orang yang terhubung.'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LocationPage;
