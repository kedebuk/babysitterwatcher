import { useState, useRef } from 'react';
import { useChildren, useDailyLog, useEvents, useCreateOrGetDailyLog, useCreateEvent, useDeleteEvent, useProfileNames } from '@/hooks/use-data';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS, EventUnit, EventStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Plus, Trash2, ChevronLeft, Clock, Camera, X, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { EditEventDialog } from '@/components/EditEventDialog';
import { EventDetailDialog } from '@/components/EventDetailDialog';

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

const ParentInput = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data: children = [] } = useChildren();

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || children[0]?.id || '';

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);
  const { data: profileNames = {} } = useProfileNames(events.map((e: any) => e.created_by).filter(Boolean));
  const createOrGetLog = useCreateOrGetDailyLog();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [newRows, setNewRows] = useState<EventRow[]>([createEmptyRow()]);
  const [notes, setNotes] = useState('');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [viewingEvent, setViewingEvent] = useState<any>(null);

  const totalSusu = events.filter(e => e.type === 'susu' && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);

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

  const saveLocationPing = async (childId: string) => {
    if (!user || !navigator.geolocation) return;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: false })
      );
      await supabase.from('location_pings').insert({
        child_id: childId,
        user_id: user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    } catch {
      // silently fail - location is optional
    }
  };

  const handleSave = async () => {
    if (!activeChildId || !user) return;
    try {
      // Capture GPS once for all events
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

      // Auto-capture location
      saveLocationPing(activeChildId);

      setNewRows([createEmptyRow()]);
      setNotes('');
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

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/parent/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Input Harian (Parent)</h1>
            <p className="text-xs opacity-80">Catat aktivitas anak sendiri 👋</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        {children.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            Belum ada anak terdaftar.
          </CardContent></Card>
        ) : (
          <>
            <div className="flex gap-2">
              <Select value={activeChildId} onValueChange={setSelectedChild}>
                <SelectTrigger className="flex-1 h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                <SelectContent>
                  {children.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="h-11 px-3 flex items-center bg-card rounded-lg text-sm font-medium border">
                📅 {format(new Date(selectedDate), 'd MMM', { locale: idLocale })}
              </div>
            </div>

            <Card className="border-0 shadow-sm bg-secondary">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary-foreground">🍼 Total Susu Hari Ini</span>
                <span className="text-lg font-bold text-secondary-foreground">{totalSusu} ml</span>
              </CardContent>
            </Card>

            {events.length > 0 && (
              <div>
                <h2 className="text-sm font-bold mb-2 text-muted-foreground">Event Tercatat</h2>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id, event.daily_log_id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold mb-2">➕ Tambah Event</h2>
              <div className="space-y-3">
                {newRows.map(row => (
                  <EventRowCard key={row.tempId} row={row} updateRow={updateRow} removeRow={removeRow} onPhotoSelect={handlePhotoSelect} onRemovePhoto={handleRemovePhoto} />
                ))}
              </div>
              <Button variant="outline" className="w-full h-12 mt-3 border-dashed" onClick={addRow}>
                <Plus className="mr-2 h-5 w-5" /> Tambah Baris
              </Button>
            </div>

            <div>
              <h2 className="text-sm font-bold mb-2">📝 Catatan Harian</h2>
              <Textarea placeholder="Catatan tambahan..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px] text-sm" />
            </div>

            <Button className="w-full h-12 text-base font-bold" onClick={handleSave} disabled={createOrGetLog.isPending || createEvent.isPending}>
              💾 Simpan Log Hari Ini
            </Button>
          </>
        )}
      </div>

      {viewingEvent && (
        <EventDetailDialog
          event={viewingEvent}
          open={!!viewingEvent}
          onOpenChange={(open) => { if (!open) setViewingEvent(null); }}
          createdByName={viewingEvent?.created_by ? profileNames[viewingEvent.created_by] : undefined}
          onEdit={() => { setEditingEvent(viewingEvent); setViewingEvent(null); }}
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
      <BottomNav role="parent" />
    </div>
  );
};

// Extracted event row component
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
        {/* Before & After Photos */}
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

export default ParentInput;
