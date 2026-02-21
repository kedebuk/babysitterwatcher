import { useState, useRef } from 'react';
import { useChildren, useDailyLog, useEvents, useCreateOrGetDailyLog, useCreateEvent, useDeleteEvent } from '@/hooks/use-data';
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
import { Plus, Trash2, LogOut, Clock, History, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import PendingInvites from '@/components/PendingInvites';

const ACTIVITY_OPTIONS: ActivityType[] = ['susu', 'mpasi', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan'];

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
});

const BabysitterToday = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: assignedChildren = [] } = useQuery({
    queryKey: ['assigned_children', user?.id],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('child_id, children(*)');
      if (!assignments) return [];
      return assignments.map((a: any) => a.children).filter(Boolean);
    },
    enabled: !!user,
  });

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || assignedChildren[0]?.id || '';

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);
  const createOrGetLog = useCreateOrGetDailyLog();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [newRows, setNewRows] = useState<EventRow[]>([createEmptyRow()]);
  const [notes, setNotes] = useState('');

  const totalSusu = events.filter(e => e.type === 'susu' && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);

  const addRow = () => setNewRows(prev => [...prev, createEmptyRow()]);
  const updateRow = (tempId: string, field: keyof EventRow, value: any) => {
    setNewRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };
  const removeRow = (tempId: string) => {
    setNewRows(prev => {
      const row = prev.find(r => r.tempId === tempId);
      if (row?.photoPreview) URL.revokeObjectURL(row.photoPreview);
      return prev.filter(r => r.tempId !== tempId);
    });
  };

  const handlePhotoSelect = (tempId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setNewRows(prev => prev.map(r => {
      if (r.tempId === tempId) {
        if (r.photoPreview) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: file, photoPreview: preview };
      }
      return r;
    }));
  };

  const handleRemovePhoto = (tempId: string) => {
    setNewRows(prev => prev.map(r => {
      if (r.tempId === tempId) {
        if (r.photoPreview) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: null, photoPreview: null };
      }
      return r;
    }));
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('event-photos').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!activeChildId || !user) return;
    try {
      const dailyLog = await createOrGetLog.mutateAsync({
        child_id: activeChildId,
        log_date: selectedDate,
        notes: notes || undefined,
        created_by: user.id,
      });

      for (const row of newRows) {
        if (!row.time) continue;
        let photoUrl: string | undefined;
        if (row.photoFile) {
          photoUrl = (await uploadPhoto(row.photoFile)) || undefined;
        }
        await createEvent.mutateAsync({
          daily_log_id: dailyLog.id,
          time: row.time + ':00',
          type: row.type,
          detail: row.detail || undefined,
          amount: row.amount ? Number(row.amount) : undefined,
          unit: row.unit || undefined,
          status: row.status || undefined,
          photo_url: photoUrl,
        });
      }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Input Harian</h1>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/babysitter/history')}>
              <History className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        <PendingInvites />
        {assignedChildren.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            Belum ada anak yang ditugaskan. Hubungi orang tua untuk penugasan.
          </CardContent></Card>
        ) : (
          <>
            <div className="flex gap-2">
              <Select value={activeChildId} onValueChange={setSelectedChild}>
                <SelectTrigger className="flex-1 h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                <SelectContent>
                  {assignedChildren.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>)}
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
                    <Card key={event.id} className="border-0 shadow-sm">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-muted-foreground min-w-[36px]">{event.time?.substring(0, 5)}</span>
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                            {ACTIVITY_ICONS[event.type as ActivityType] || '📝'}
                          </span>
                          <span className="text-xs flex-1 truncate">{event.detail || ACTIVITY_LABELS[event.type as ActivityType] || event.type}</span>
                          {event.amount && <span className="text-xs font-bold">{event.amount} {event.unit}</span>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteEvent(event.id, event.daily_log_id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {(event as any).photo_url && (
                          <img src={(event as any).photo_url} alt="Foto event" className="mt-2 rounded-lg w-20 h-20 object-cover" />
                        )}
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
          </>
        )}
      </div>

      {assignedChildren.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t max-w-2xl mx-auto">
          <Button className="w-full h-14 text-base font-bold" onClick={handleSave} disabled={createOrGetLog.isPending || createEvent.isPending}>
            💾 Simpan Log Hari Ini
          </Button>
        </div>
      )}
    </div>
  );
};

// Extracted event row component
function EventRowCard({ row, updateRow, removeRow, onPhotoSelect, onRemovePhoto }: {
  row: EventRow;
  updateRow: (tempId: string, field: keyof EventRow, value: any) => void;
  removeRow: (tempId: string) => void;
  onPhotoSelect: (tempId: string, file: File) => void;
  onRemovePhoto: (tempId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

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
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground shrink-0" onClick={() => fileRef.current?.click()}>
            <Camera className="h-4 w-4" />
          </Button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) onPhotoSelect(row.tempId, e.target.files[0]); e.target.value = ''; }} />
          <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeRow(row.tempId)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Input placeholder="Detail (mis: susu 30 ml habis)" value={row.detail} onChange={e => updateRow(row.tempId, 'detail', e.target.value)} className="h-10 text-sm" />
        {(row.type === 'susu' || row.type === 'mpasi' || row.type === 'vitamin') && (
          <div className="flex gap-2">
            <Input type="number" placeholder="Jumlah" value={row.amount} onChange={e => updateRow(row.tempId, 'amount', e.target.value)} className="flex-1 h-10 text-sm" />
            <Select value={row.unit || 'ml'} onValueChange={v => updateRow(row.tempId, 'unit', v)}>
              <SelectTrigger className="w-[80px] h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">ml</SelectItem>
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
        {row.photoPreview && (
          <div className="relative inline-block">
            <img src={row.photoPreview} alt="Preview" className="rounded-lg w-20 h-20 object-cover" />
            <button onClick={() => onRemovePhoto(row.tempId)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default BabysitterToday;
