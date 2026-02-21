import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Loader2, Navigation } from 'lucide-react';
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

const LocationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const role = user?.role;

  // Babysitter: get assigned children
  const { data: assignedChildren = [] } = useQuery({
    queryKey: ['location_children', user?.id, role],
    queryFn: async () => {
      if (role === 'babysitter') {
        const { data } = await supabase.from('assignments').select('child_id, children(*)');
        return (data || []).map((a: any) => a.children).filter(Boolean);
      } else {
        const { data } = await supabase.from('children').select('*').eq('parent_id', user!.id);
        return data || [];
      }
    },
    enabled: !!user,
  });

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || assignedChildren[0]?.id || '';
  const [sharing, setSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Get latest location pings
  const { data: pings = [] } = useQuery({
    queryKey: ['location_pings', activeChildId],
    queryFn: async () => {
      const { data } = await supabase
        .from('location_pings')
        .select('*')
        .eq('child_id', activeChildId)
        .order('created_at', { ascending: false })
        .limit(20);
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

  const startSharing = useCallback(() => {
    if (!activeChildId || !user) return;
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'GPS tidak didukung di perangkat ini', variant: 'destructive' });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from('location_pings').insert({
          user_id: user.id,
          child_id: activeChildId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        toast({ title: 'GPS Error', description: err.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    setWatchId(id);
    setSharing(true);
    toast({ title: '📍 Lokasi aktif', description: 'Lokasi Anda sedang dibagikan' });
  }, [activeChildId, user, toast]);

  const stopSharing = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setSharing(false);
    toast({ title: 'Lokasi dimatikan' });
  }, [watchId, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  const latestPing = pings[0];
  const backPath = role === 'parent' ? '/parent/dashboard' : '/babysitter/today';

  // Get babysitter names for pings
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

        {role === 'babysitter' && (
          <Button
            className={`w-full h-12 text-base font-bold ${sharing ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            onClick={sharing ? stopSharing : startSharing}
            disabled={!activeChildId}
          >
            {sharing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Matikan Lokasi</>
            ) : (
              <><Navigation className="mr-2 h-4 w-4" /> Bagikan Lokasi</>
            )}
          </Button>
        )}
      </div>

      {latestPing ? (
        <div className="flex-1 px-4 pb-4 max-w-2xl mx-auto w-full" style={{ minHeight: '400px' }}>
          <div className="rounded-xl overflow-hidden border h-[400px]">
            <MapContainer center={[latestPing.latitude, latestPing.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <RecenterMap lat={latestPing.latitude} lng={latestPing.longitude} />
              {pings.map((p: any) => (
                <Marker key={p.id} position={[p.latitude, p.longitude]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{pingProfiles[p.user_id] || 'Babysitter'}</p>
                      <p>{format(new Date(p.created_at), 'HH:mm:ss', { locale: idLocale })}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Terakhir update: {format(new Date(latestPing.created_at), 'HH:mm:ss, d MMM', { locale: idLocale })}
          </p>
        </div>
      ) : (
        <div className="px-4 max-w-2xl mx-auto w-full">
          <Card className="border-0 shadow-sm bg-muted/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{role === 'parent' ? 'Belum ada lokasi dari babysitter.' : 'Tekan "Bagikan Lokasi" untuk mulai berbagi.'}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LocationPage;
