import { useState, useRef, useEffect } from 'react';
import { useChildren, useDailyLog, useEvents, useCreateOrGetDailyLog, useCreateEvent, useDeleteEvent, useProfileNames } from '@/hooks/use-data';
import { ChildAvatar } from '@/components/ChildAvatar';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS, EventUnit, EventStatus } from '@/types';
import { getSmartIcon } from '@/lib/smart-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Plus, Trash2, LogOut, Clock, History, Camera, X, MessageCircle, MapPin, MoreVertical, RefreshCw, Baby, UserCheck, User, Package, Pencil, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import PendingInvites from '@/components/PendingInvites';
import { BottomNav } from '@/components/BottomNav';
import { BabysitterMotivation } from '@/components/BabysitterMotivation';
import { EditEventDialog } from '@/components/EditEventDialog';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import { FoodScanButton } from '@/components/FoodScanButton';
import { AvatarSvg } from '@/components/AvatarIcons';

const ACTIVITY_OPTIONS: ActivityType[] = ['susu', 'mpasi', 'snack', 'buah', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan'];

interface EventRow {
  tempId: string;
  time: string;
  type: ActivityType;
  detail: string;
  amount: string;
  unit: EventUnit;
  status: EventStatus;
  sisaAmount: string;
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
  sisaAmount: '',
  photoFile: null,
  photoPreview: null,
  afterPhotoFile: null,
  afterPhotoPreview: null,
});

const BabysitterToday = () => {
  const { user, logout, setActiveRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: assignedChildren = [] } = useQuery({
    queryKey: ['assigned_children', user?.id],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('child_id, children(id, name, dob, notes, avatar_emoji, photo_url, parent_id)')
        .eq('babysitter_user_id', user!.id);
      if (!assignments) return [];
      return assignments.map((a: any) => a.children).filter(Boolean);
    },
    enabled: !!user,
  });

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || assignedChildren[0]?.id || '';

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; daily_log_id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Sisa dialog state: pops up at save time when susu has status "sisa"
  const [sisaDialogOpen, setSisaDialogOpen] = useState(false);
  const [sisaDialogRows, setSisaDialogRows] = useState<{ tempId: string; time: string; amount: string; sisaAmount: string }[]>([]);
  const [pendingSaveRows, setPendingSaveRows] = useState<EventRow[] | null>(null);

  // Pending sisa reminder: check if today's saved events have status "sisa" without sisa detail
  const pendingSisaEvents = events.filter(
    (e: any) => e.type === 'susu' && e.status === 'sisa' && e.amount && !(e.detail || '').includes('diminum')
  );

  // Show reminder when navigating back (visibility change)
  const [showSisaReminder, setShowSisaReminder] = useState(false);
  useEffect(() => {
    if (pendingSisaEvents.length > 0) setShowSisaReminder(true);
  }, [pendingSisaEvents.length]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pendingSisaEvents.length > 0) {
        setShowSisaReminder(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pendingSisaEvents.length]);

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
    // Validate rows
    const validRows = newRows.filter(r => r.time);
    if (validRows.length === 0) {
      toast({ title: '⚠️ Tidak ada event', description: 'Isi minimal satu event dengan waktu untuk disimpan', variant: 'destructive' });
      return;
    }
    const emptyDetailRows = validRows.filter(r => !r.detail && r.type !== 'tidur' && r.type !== 'bangun' && r.type !== 'pup' && r.type !== 'pee');
    if (emptyDetailRows.length > 0) {
      toast({ title: '⚠️ Detail kosong', description: 'Isi detail untuk event yang memerlukan keterangan', variant: 'destructive' });
      return;
    }

    // Check if any susu rows have status "sisa" → show dialog to ask remaining amount
    const susuSisaRows = newRows.filter(r => r.type === 'susu' && r.time && r.status === 'sisa' && r.amount);
    if (susuSisaRows.length > 0 && !susuSisaRows.every(r => r.sisaAmount)) {
      // Open dialog to ask for remaining amounts
      setSisaDialogRows(susuSisaRows.map(r => ({ tempId: r.tempId, time: r.time, amount: r.amount, sisaAmount: r.sisaAmount || '' })));
      setPendingSaveRows(newRows);
      setSisaDialogOpen(true);
      return;
    }

    await doSave(newRows);
  };

  const doSave = async (rowsToSave: EventRow[]) => {
    if (!activeChildId || !user) return;
    setSaving(true);
    try {
      // Capture GPS once for all events in this save — WAJIB
      let latitude: number;
      let longitude: number;
      if (!navigator.geolocation) {
        toast({ title: '📍 Lokasi diperlukan', description: 'Browser kamu tidak mendukung GPS. Coba buka di browser lain.', variant: 'destructive' });
        setSaving(false);
        return;
      }
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        toast({ title: '📍 Lokasi wajib diaktifkan', description: 'Izinkan akses lokasi di browser/HP kamu dulu, lalu coba simpan lagi.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const dailyLog = await createOrGetLog.mutateAsync({
        child_id: activeChildId,
        log_date: selectedDate,
        notes: notes || undefined,
        created_by: user.id,
      });

      for (const row of rowsToSave) {
        if (!row.time) continue;
        let photoUrl: string | undefined;
        let afterPhotoUrl: string | undefined;
        if (row.photoFile) {
          photoUrl = (await uploadPhoto(row.photoFile)) || undefined;
        }
        if (row.afterPhotoFile) {
          afterPhotoUrl = (await uploadPhoto(row.afterPhotoFile)) || undefined;
        }
        let revisedDetail = row.detail || undefined;
        let finalAmount = row.amount ? Number(row.amount) : undefined;
        let finalUnit = row.unit || undefined;
        // AI: only estimate food weight, do NOT revise detail text
        const foodTypes = ["mpasi", "snack", "buah"];
        if (foodTypes.includes(row.type) && row.detail && row.detail.trim().length >= 3) {
          try {
            const { data: revData } = await supabase.functions.invoke('revise-event-detail', {
              body: { detail: row.detail, type: row.type, amount: row.amount, unit: row.unit },
            });
            if (revData?.corrected_amount) finalAmount = Number(revData.corrected_amount);
            if (revData?.corrected_unit) finalUnit = revData.corrected_unit;
          } catch { /* fallback to original */ }
        }

        // Sisa susu: simpan jumlah yang DIMINUM (disiapkan - sisa), detail mencatat info lengkap
        if (row.type === 'susu' && row.status === 'sisa' && row.sisaAmount && finalAmount) {
          const sisaNum = Number(row.sisaAmount);
          if (sisaNum > 0 && sisaNum < finalAmount) {
            const consumed = finalAmount - sisaNum;
            revisedDetail = (revisedDetail || '') + (revisedDetail ? '. ' : '') + `Disiapkan ${finalAmount}ml, sisa ${sisaNum}ml, diminum ${consumed}ml`;
            finalAmount = consumed; // simpan jumlah yang benar-benar diminum bayi
          }
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
    } finally {
      setSaving(false);
    }
  };

  // Handle sisa dialog: save with sisa amounts filled in
  const handleSisaDialogSave = () => {
    if (!pendingSaveRows) return;
    const updatedRows = pendingSaveRows.map(r => {
      const sisaRow = sisaDialogRows.find(s => s.tempId === r.tempId);
      if (sisaRow && sisaRow.sisaAmount) {
        return { ...r, sisaAmount: sisaRow.sisaAmount };
      }
      return r;
    });
    setSisaDialogOpen(false);
    setPendingSaveRows(null);
    doSave(updatedRows);
  };

  // Handle sisa dialog: skip, save without sisa calculation
  const handleSisaDialogSkip = () => {
    if (!pendingSaveRows) return;
    setSisaDialogOpen(false);
    setPendingSaveRows(null);
    doSave(pendingSaveRows);
    toast({
      title: '📝 Sisa belum diisi',
      description: 'Nanti kamu bisa isi sisa susunya dari daftar event. Kami akan ingatkan!',
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Input Harian</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-foreground/20 font-medium">Babysitter</span>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/chat')}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Pesan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/inventory')}>
                  <Package className="mr-2 h-4 w-4" /> Stok Kebutuhan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/location')}>
                  <MapPin className="mr-2 h-4 w-4" /> Lokasi GPS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/babysitter/history')}>
                  <History className="mr-2 h-4 w-4" /> Riwayat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profil Saya
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
                {assignedChildren.length === 0 && (user?.roles?.length ?? 0) <= 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      const { error } = await supabase.from('user_roles').insert({ user_id: user!.id, role: 'parent' });
                      if (!error) {
                        setActiveRole('parent');
                        window.location.href = '/parent/dashboard';
                      } else {
                        toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
                      }
                    }}>
                      <Baby className="mr-2 h-4 w-4" /> Ganti ke Orang Tua
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
        {activeChildId && (
          <BabysitterMotivation childId={activeChildId} babysitterName={user?.name || ''} date={selectedDate} />
        )}
        {assignedChildren.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            Belum ada anak yang ditugaskan. Hubungi orang tua untuk penugasan.
          </CardContent></Card>
        ) : (
          <>
            <div className="flex gap-2 items-center">
              {activeChildId && (() => {
                const c = assignedChildren.find((ch: any) => ch.id === activeChildId);
                return c ? <ChildAvatar photoUrl={c.photo_url} name={c.name} emoji={c.avatar_emoji} className="h-11 w-11 rounded-xl object-cover shrink-0" fallbackClassName="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0" /> : null;
              })()}
              <Select value={activeChildId} onValueChange={setSelectedChild}>
                <SelectTrigger className="flex-1 h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                <SelectContent>
                  {assignedChildren.map((c: any) => <SelectItem key={c.id} value={c.id}><span className="inline-flex items-center gap-2"><AvatarSvg emoji={c.avatar_emoji || '👶'} size={20} /> {c.name}</span></SelectItem>)}
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

            {/* Reminder: pending sisa susu belum diisi */}
            {showSisaReminder && pendingSisaEvents.length > 0 && (
              <Card className="border-0 shadow-sm bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 animate-slide-up">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🍼</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Sisa susu belum diisi!</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                        Ada {pendingSisaEvents.length} susu yang statusnya "Sisa" tapi belum diisi berapa ml sisanya. Tap event di bawah untuk edit.
                      </p>
                      {pendingSisaEvents.map((ev: any) => (
                        <button
                          key={ev.id}
                          className="mt-1.5 flex items-center gap-2 text-xs bg-orange-100 dark:bg-orange-900/40 rounded-md px-2 py-1.5 w-full text-left hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
                          onClick={() => setEditingEvent(ev)}
                        >
                          <span className="font-bold">{ev.time?.substring(0, 5)}</span>
                          <span>🍼 {ev.amount} ml — <span className="text-orange-700 dark:text-orange-300 font-medium">sisa berapa?</span></span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowSisaReminder(false)} className="text-orange-400 hover:text-orange-600 p-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                            {event.type === 'catatan' ? getSmartIcon(event.type, event.detail) : (ACTIVITY_ICONS[event.type as ActivityType] || '📝')}
                          </span>
                          <span className="text-xs flex-1 truncate">{event.detail || ACTIVITY_LABELS[event.type as ActivityType] || event.type}</span>
                          {event.amount && <span className="text-xs font-bold">{event.amount} {event.unit}</span>}
                          {(event as any).created_by && profileNames[(event as any).created_by] && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {profileNames[(event as any).created_by]}
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: event.id, daily_log_id: event.daily_log_id, label: `${ACTIVITY_LABELS[event.type as ActivityType] || event.type} (${event.time?.substring(0, 5)})` }); }}>
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
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold">➕ Tambah Event</h2>
                {events.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => {
                      const last = events[events.length - 1];
                      const newRow: EventRow = {
                        tempId: crypto.randomUUID(),
                        time: format(new Date(), 'HH:mm'),
                        type: last.type as ActivityType,
                        detail: last.detail || '',
                        amount: last.amount ? String(last.amount) : '',
                        unit: (last.unit as EventUnit) || 'ml',
                        status: null,
                        sisaAmount: '',
                        photoFile: null,
                        photoPreview: null,
                        afterPhotoFile: null,
                        afterPhotoPreview: null,
                      };
                      setNewRows(prev => [...prev, newRow]);
                    }}
                  >
                    🔄 Ulangi Terakhir
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {newRows.map(row => (
                  <EventRowCard key={row.tempId} row={row} updateRow={updateRow} removeRow={removeRow} onPhotoSelect={handlePhotoSelect} onRemovePhoto={handleRemovePhoto} parentId={assignedChildren.find((c: any) => c.id === activeChildId)?.parent_id || ''} />
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

            <Button className="w-full h-12 text-base font-bold" onClick={handleSave} disabled={saving || createOrGetLog.isPending || createEvent.isPending}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : '💾 Simpan Log Hari Ini'}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Aktivitas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.label}</strong>? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteEvent.mutate({ id: deleteTarget.id, daily_log_id: deleteTarget.daily_log_id }, {
                    onSuccess: () => toast({ title: '✅ Dihapus', description: 'Aktivitas berhasil dihapus' }),
                    onError: (err: any) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
                  });
                  setDeleteTarget(null);
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sisa dialog: muncul saat save kalau ada susu status "sisa" */}
      <Dialog open={sisaDialogOpen} onOpenChange={setSisaDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🍼 Berapa Sisa di Botol?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ada susu yang statusnya "Sisa". Isi berapa ml yang tersisa di botol — info ini akan dicatat di detail event.
            </p>
            {sisaDialogRows.map((row, i) => (
              <div key={row.tempId} className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
                <span className="text-xs font-bold min-w-[40px]">{row.time}</span>
                <span className="text-sm">🍼 {row.amount} ml →</span>
                <Input
                  type="number"
                  placeholder="Sisa ml"
                  value={row.sisaAmount}
                  onChange={e => {
                    const val = e.target.value;
                    setSisaDialogRows(prev => prev.map((r, j) => j === i ? { ...r, sisaAmount: val } : r));
                  }}
                  className="w-[80px] h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">ml sisa</span>
                {row.sisaAmount && Number(row.sisaAmount) < Number(row.amount) && (
                  <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                    = {Number(row.amount) - Number(row.sisaAmount)} ml diminum
                  </span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={handleSisaDialogSkip}>
              Isi Nanti
            </Button>
            <Button className="flex-1" onClick={handleSisaDialogSave}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav role="babysitter" />
    </div>
  );
};

// Extracted event row component
function EventRowCard({ row, updateRow, removeRow, onPhotoSelect, onRemovePhoto, parentId }: {
  row: EventRow;
  updateRow: (tempId: string, field: keyof EventRow, value: any) => void;
  removeRow: (tempId: string) => void;
  onPhotoSelect: (tempId: string, file: File, which: 'before' | 'after') => void;
  onRemovePhoto: (tempId: string, which: 'before' | 'after') => void;
  parentId: string;
}) {
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const isFoodType = row.type === 'mpasi' || row.type === 'snack' || row.type === 'buah';

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
        {/* Food Scan Button */}
        {isFoodType && (
          <FoodScanButton
            parentId={parentId}
            onResult={(detail, amount, unit) => {
              updateRow(row.tempId, 'detail', detail);
              if (amount) updateRow(row.tempId, 'amount', amount);
              if (unit) updateRow(row.tempId, 'unit', unit);
            }}
          />
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


export default BabysitterToday;
