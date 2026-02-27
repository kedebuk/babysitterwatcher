import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChildren, useDailyLog, useEvents, useCreateOrGetDailyLog, useCreateEvent, useDeleteEvent, useChildLogs, useProfileNames } from '@/hooks/use-data';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType, EventUnit, EventStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MoreVertical, LogOut, RefreshCw, User, Bell, Users, Plus, Trash2, Clock, Camera, X, Pencil, Package, MapPin, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PendingInvites from '@/components/PendingInvites';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import { EditEventDialog } from '@/components/EditEventDialog';

const ACTIVITY_OPTIONS: ActivityType[] = ['susu', 'mpasi', 'snack', 'buah', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan'];

interface EventRow {
  tempId: string;
  time: string;
  type: ActivityType;
  detail: string;
  amount: string;
  unit: EventUnit;
  status: EventStatus;
  photoFile: File | null;
  photoPreview: string | null;
  afterPhotoFile: File | null;
  afterPhotoPreview: string | null;
}

const createEmptyRow = (): EventRow => ({
  tempId: crypto.randomUUID(),
  time: format(new Date(), 'HH:mm'),
  type: 'susu',
  detail: '',
  amount: '',
  unit: 'ml',
  status: null,
  photoFile: null,
  photoPreview: null,
  afterPhotoFile: null,
  afterPhotoPreview: null,
});

function getTotalByType(events: any[], type: string): number {
  return events.filter(e => e.type === type && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);
}

const ViewerDashboard = () => {
  const { data: children = [], isLoading: loadingChildren } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { user, logout } = useAuth();

  // Check can_input permission per child
  const { data: viewerPermissions = [] } = useQuery({
    queryKey: ['viewer_permissions', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('child_viewers').select('child_id, can_input').eq('viewer_user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewingEvent, setViewingEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showInput, setShowInput] = useState(false);
  const queryClient = useQueryClient();

  const activeChildId = selectedChild || children[0]?.id || '';
  const child = children.find(c => c.id === activeChildId);
  const canInput = viewerPermissions.find(p => p.child_id === activeChildId)?.can_input ?? false;

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);
  const { data: profileNames = {} } = useProfileNames(events.map((e: any) => e.created_by).filter(Boolean));
  const createOrGetLog = useCreateOrGetDailyLog();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [newRows, setNewRows] = useState<EventRow[]>([createEmptyRow()]);
  const [notes, setNotes] = useState('');

  // Realtime notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('viewer-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const msg = (payload.new as any).message;
        toast({ title: '🔔 Notifikasi Baru', description: msg });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, toast]);

  // Realtime: auto-refresh events when data updates
  useEffect(() => {
    if (!log?.id) return;
    const channel = supabase
      .channel(`realtime-viewer-events-${log.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `daily_log_id=eq.${log.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['events', log.id] });
        queryClient.invalidateQueries({ queryKey: ['childLogs'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [log?.id, queryClient]);

  // 7 day chart data
  const last7dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  const { data: logsWithEvents = [] } = useChildLogs(activeChildId, last7dates);

  const chartData = last7dates.map(date => {
    const logData = logsWithEvents.find((l: any) => l.log_date === date);
    const evts = logData?.events || [];
    return {
      date: format(parseISO(date), 'd MMM', { locale: idLocale }),
      susu: getTotalByType(evts, 'susu'),
      makan: getTotalByType(evts, 'mpasi') + getTotalByType(evts, 'snack') + getTotalByType(evts, 'buah'),
      pup: evts.filter((e: any) => e.type === 'pup').length,
    };
  });

  const totalSusu = getTotalByType(events, 'susu');
  const totalMakan = getTotalByType(events, 'mpasi') + getTotalByType(events, 'snack') + getTotalByType(events, 'buah');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  const vitaminEvent = events.find(e => e.type === 'vitamin');
  const mandiEvents = events.filter(e => e.type === 'mandi' || e.type === 'lap_badan');

  const changeDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(format(dt, 'yyyy-MM-dd'));
  };

  // Input handlers
  const addRow = () => setNewRows(prev => [...prev, createEmptyRow()]);
  const updateRow = (tempId: string, field: keyof EventRow, value: any) => {
    setNewRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };
  const removeRow = (tempId: string) => {
    setNewRows(prev => {
      const row = prev.find(r => r.tempId === tempId);
      if (row?.photoPreview) URL.revokeObjectURL(row.photoPreview);
      if (row?.afterPhotoPreview) URL.revokeObjectURL(row.afterPhotoPreview);
      return prev.filter(r => r.tempId !== tempId);
    });
  };

  const handlePhotoSelect = (tempId: string, file: File, which: 'before' | 'after' = 'before') => {
    const preview = URL.createObjectURL(file);
    setNewRows(prev => prev.map(r => {
      if (r.tempId === tempId) {
        if (which === 'after') {
          if (r.afterPhotoPreview) URL.revokeObjectURL(r.afterPhotoPreview);
          return { ...r, afterPhotoFile: file, afterPhotoPreview: preview };
        }
        if (r.photoPreview) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: file, photoPreview: preview };
      }
      return r;
    }));
  };

  const handleRemovePhoto = (tempId: string, which: 'before' | 'after' = 'before') => {
    setNewRows(prev => prev.map(r => {
      if (r.tempId === tempId) {
        if (which === 'after') {
          if (r.afterPhotoPreview) URL.revokeObjectURL(r.afterPhotoPreview);
          return { ...r, afterPhotoFile: null, afterPhotoPreview: null };
        }
        if (r.photoPreview) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: null, photoPreview: null };
      }
      return r;
    }));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${activeChildId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('event-photos').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!activeChildId || !user) return;
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch { /* GPS not available */ }
      }

      const dailyLog = await createOrGetLog.mutateAsync({
        child_id: activeChildId,
        log_date: selectedDate,
        notes: notes || undefined,
        created_by: user.id,
      });

      for (const row of newRows) {
        if (!row.time) continue;
        let photoUrl: string | undefined;
        let afterPhotoUrl: string | undefined;
        if (row.photoFile) {
          photoUrl = (await uploadPhoto(row.photoFile)) || undefined;
        }
        if (row.afterPhotoFile) {
          afterPhotoUrl = (await uploadPhoto(row.afterPhotoFile)) || undefined;
        }
        // Auto-revise detail text via AI
        let revisedDetail = row.detail || undefined;
        let finalAmount = row.amount ? Number(row.amount) : undefined;
        let finalUnit = row.unit || undefined;
        if (row.detail && row.detail.trim().length >= 3) {
          try {
            const { data: revData } = await supabase.functions.invoke('revise-event-detail', {
              body: { detail: row.detail, type: row.type, amount: row.amount, unit: row.unit },
            });
            if (revData?.revised) revisedDetail = revData.revised;
            if (revData?.corrected_amount) finalAmount = Number(revData.corrected_amount);
            if (revData?.corrected_unit) finalUnit = revData.corrected_unit;
          } catch { /* fallback to original */ }
        }
        await createEvent.mutateAsync({
          daily_log_id: dailyLog.id,
          time: row.time + ':00',
          type: row.type,
          detail: revisedDetail,
          amount: finalAmount,
          unit: finalUnit,
          status: row.status || undefined,
          photo_url: photoUrl,
          photo_url_after: afterPhotoUrl,
          created_by: user.id,
          latitude,
          longitude,
        });
      }

      setNewRows([createEmptyRow()]);
      setNotes('');
      setShowInput(false);
      toast({ title: '✅ Tersimpan!', description: 'Log harian berhasil disimpan' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteEvent = async (eventId: string, logId: string) => {
    try {
      await deleteEvent.mutateAsync({ id: eventId, daily_log_id: logId });
      toast({ title: 'Dihapus', description: 'Event berhasil dihapus' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loadingChildren) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <h1 className="text-lg font-bold">Keluarga</h1>
            </div>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/notifications')}>
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/inventory')}>
                  <Package className="mr-2 h-4 w-4" /> Stok Kebutuhan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/location')}>
                  <MapPin className="mr-2 h-4 w-4" /> Lokasi GPS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/chat')}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Pesan
                </DropdownMenuItem>
                {(user?.roles?.length ?? 0) > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      sessionStorage.removeItem('activeRole');
                      navigate('/choose-role');
                    }}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Ganti Role
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        <PendingInvites />
        {children.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            Belum ada anak yang dibagikan kepada Anda. Minta orang tua untuk mengundang Anda.
          </CardContent></Card>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {child && (
                (child as any).photo_url ? (
                  <img src={(child as any).photo_url} alt={child.name} className="h-11 w-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">{child.avatar_emoji || '👶'}</div>
                )
              )}
              <Select value={activeChildId} onValueChange={setSelectedChild}>
                <SelectTrigger className="h-11 bg-card flex-1"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                <SelectContent>
                  {children.map(c => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
              <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
              <p className="font-semibold text-sm">{format(parseISO(selectedDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}</p>
              <Button variant="ghost" size="icon" onClick={() => changeDate(1)}><ChevronRight className="h-5 w-5" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-susu text-sm">🍼</div>
                  <span className="text-xs text-muted-foreground">Total Susu</span>
                </div>
                <p className="text-2xl font-bold">{totalSusu} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-makan text-sm">🥣</div>
                  <span className="text-xs text-muted-foreground">Total Makan</span>
                </div>
                <p className="text-2xl font-bold">{totalMakan}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-pup text-sm">💩</div>
                  <span className="text-xs text-muted-foreground">BAB</span>
                </div>
                <p className="text-2xl font-bold">{pup} <span className="text-sm font-normal text-muted-foreground">/ {pee}x</span></p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-vitamin text-sm">💊</div>
                  <span className="text-xs text-muted-foreground">Vitamin</span>
                </div>
                <p className="text-lg font-bold">{vitaminEvent ? `✅ ${vitaminEvent.time?.substring(0, 5)}` : '❌ Belum'}</p>
              </CardContent></Card>
            </div>

            {mandiEvents.length > 0 && (
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-mandi text-sm">🛁</div>
                  <span className="text-sm font-semibold">Mandi / Lap Badan</span>
                </div>
                <p className="text-sm text-muted-foreground">{mandiEvents.map(e => `${e.time?.substring(0, 5)} ${e.type === 'mandi' ? 'Mandi' : 'Lap badan'}`).join(' • ')}</p>
              </CardContent></Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3"><CardTitle className="text-sm font-semibold">📈 Grafik 7 Hari Terakhir</CardTitle></CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="susu" name="Susu (ml)" fill="hsl(210, 75%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="makan" name="Makan" fill="hsl(25, 85%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pup" name="BAB" fill="hsl(145, 55%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Timeline with edit/delete */}
            <div>
              <h2 className="font-bold text-sm mb-2">📋 Timeline Harian</h2>
              {events.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Belum ada data untuk tanggal ini</CardContent></Card>
              ) : (
                <div className="space-y-1.5">
                  {events.map(event => (
                    <Card key={event.id} className="border-0 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setViewingEvent(event)}>
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-muted-foreground min-w-[36px]">{event.time?.substring(0, 5)}</span>
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                            {ACTIVITY_ICONS[event.type as ActivityType] || '📝'}
                          </span>
                          <span className="text-xs flex-1 truncate">{event.detail || ACTIVITY_LABELS[event.type as ActivityType] || event.type}</span>
                          {event.amount && <span className="text-xs font-bold">{event.amount} {event.unit}</span>}
                          {(event as any).created_by && profileNames[(event as any).created_by] && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {profileNames[(event as any).created_by]}
                            </span>
                          )}
                          {canInput && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id, event.daily_log_id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {log?.notes && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">📝 Catatan Hari Ini</p>
                  <p className="text-sm">{log.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Input section - toggleable */}
            {canInput && !showInput ? (
              <Button className="w-full h-12 text-base font-bold" onClick={() => setShowInput(true)}>
                <Plus className="mr-2 h-5 w-5" /> Tambah Aktivitas
              </Button>
            ) : canInput && showInput ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">➕ Tambah Event</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
                    <X className="h-4 w-4 mr-1" /> Tutup
                  </Button>
                </div>
                <div className="space-y-3">
                  {newRows.map(row => (
                    <EventRowCard key={row.tempId} row={row} updateRow={updateRow} removeRow={removeRow} onPhotoSelect={handlePhotoSelect} onRemovePhoto={handleRemovePhoto} />
                  ))}
                </div>
                <Button variant="outline" className="w-full h-12 border-dashed" onClick={addRow}>
                  <Plus className="mr-2 h-5 w-5" /> Tambah Baris
                </Button>
                <div>
                  <h2 className="text-sm font-bold mb-2">📝 Catatan Harian</h2>
                  <Textarea placeholder="Catatan tambahan..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px] text-sm" />
                </div>
                <Button className="w-full h-12 text-base font-bold" onClick={handleSave} disabled={createOrGetLog.isPending || createEvent.isPending}>
                  💾 Simpan Log
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {viewingEvent && (
        <EventDetailDialog
          event={viewingEvent}
          open={!!viewingEvent}
          onOpenChange={(open) => { if (!open) setViewingEvent(null); }}
          createdByName={viewingEvent?.created_by ? profileNames[viewingEvent.created_by] : undefined}
          onEdit={canInput ? () => { setEditingEvent(viewingEvent); setViewingEvent(null); } : undefined}
        />
      )}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => { if (!open) setEditingEvent(null); }}
          childId={activeChildId}
        />
      )}
    </div>
  );
};

// Event row component for input form
function EventRowCard({ row, updateRow, removeRow, onPhotoSelect, onRemovePhoto }: {
  row: EventRow;
  updateRow: (tempId: string, field: keyof EventRow, value: any) => void;
  removeRow: (tempId: string) => void;
  onPhotoSelect: (tempId: string, file: File, which: 'before' | 'after') => void;
  onRemovePhoto: (tempId: string, which: 'before' | 'after') => void;
}) {
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-0 shadow-sm animate-slide-up">
      <CardContent className="p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-shrink-0">
            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input type="time" value={row.time} onChange={e => updateRow(row.tempId, 'time', e.target.value)} className="w-[100px] h-10 pl-7 text-sm" />
          </div>
          <Select value={row.type} onValueChange={v => updateRow(row.tempId, 'type', v)}>
            <SelectTrigger className="flex-1 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVITY_OPTIONS.map(act => <SelectItem key={act} value={act}>{ACTIVITY_ICONS[act]} {ACTIVITY_LABELS[act]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeRow(row.tempId)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Input placeholder="Detail (mis: susu 30 ml habis)" value={row.detail} onChange={e => updateRow(row.tempId, 'detail', e.target.value)} className="h-10 text-sm" />
        {(row.type === 'susu' || row.type === 'mpasi' || row.type === 'vitamin' || row.type === 'snack' || row.type === 'buah') && (
          <div className="flex gap-2">
            <Input type="number" placeholder="Jumlah" value={row.amount} onChange={e => updateRow(row.tempId, 'amount', e.target.value)} className="flex-1 h-10 text-sm" />
            <Select value={row.unit || 'ml'} onValueChange={v => updateRow(row.tempId, 'unit', v)}>
              <SelectTrigger className="w-[80px] h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="gram">gram</SelectItem>
                <SelectItem value="pcs">pcs</SelectItem>
                <SelectItem value="dosis">dosis</SelectItem>
              </SelectContent>
            </Select>
            {row.type === 'susu' && (
              <Select value={row.status || ''} onValueChange={v => updateRow(row.tempId, 'status', v as EventStatus)}>
                <SelectTrigger className="w-[90px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="habis">Habis</SelectItem>
                  <SelectItem value="sisa">Sisa</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">📷 Foto Sebelum</p>
            {row.photoPreview ? (
              <div className="relative inline-block">
                <img src={row.photoPreview} alt="Sebelum" className="rounded-lg w-20 h-20 object-cover" />
                <button onClick={() => onRemovePhoto(row.tempId, 'before')} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => beforeFileRef.current?.click()}>
                <Camera className="mr-1 h-3.5 w-3.5" /> Ambil Foto
              </Button>
            )}
            <input ref={beforeFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) onPhotoSelect(row.tempId, e.target.files[0], 'before'); e.target.value = ''; }} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">📷 Foto Sesudah</p>
            {row.afterPhotoPreview ? (
              <div className="relative inline-block">
                <img src={row.afterPhotoPreview} alt="Sesudah" className="rounded-lg w-20 h-20 object-cover" />
                <button onClick={() => onRemovePhoto(row.tempId, 'after')} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => afterFileRef.current?.click()}>
                <Camera className="mr-1 h-3.5 w-3.5" /> Ambil Foto
              </Button>
            )}
            <input ref={afterFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) onPhotoSelect(row.tempId, e.target.files[0], 'after'); e.target.value = ''; }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ViewerDashboard;
