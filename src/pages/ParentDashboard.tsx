import { useState, useEffect } from 'react';
import { useChildren, useDailyLog, useEvents, useChildLogs, useProfileNames, useDeleteEvent } from '@/hooks/use-data';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { getSmartIcon } from '@/lib/smart-icon';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Copy, LogOut, ChevronLeft, ChevronRight, Users, Bell, PenLine, MessageCircle, Brain, MapPin, MoreVertical, RefreshCw, UserCheck, Trash2, CreditCard, User, Package, Pencil } from 'lucide-react';
import { EditEventDialog } from '@/components/EditEventDialog';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChildAvatar } from '@/components/ChildAvatar';
import { ActivityIcon, ActivityIconFromEmoji, SusuIcon, MpasiIcon, PupIcon, VitaminIcon, SnackIcon, BuahIcon, MandiIcon, InsightIcon, ChartIcon, TimelineIcon, TidurIcon, ActiveSunIcon, SleepingIcon, WasteIcon, PlateIcon, FruitSliceIcon } from '@/components/ActivityIcons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PendingInvites from '@/components/PendingInvites';
import { BottomNav } from '@/components/BottomNav';
import { DailyTrivia } from '@/components/DailyTrivia';

function getTotalByType(events: any[], type: string): number {
  return events.filter(e => e.type === type && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);
}

function parseSisaFromDetail(detail: string | null | undefined): number {
  if (!detail) return 0;
  // Coba format dari sisa dialog: "sisa 30ml, diminum..."
  const match = detail.match(/sisa (\d+(?:\.\d+)?)ml[,\s]/i);
  if (match) return Number(match[1]);
  // Fallback: hitung dari selisih "Disiapkan Xml" dan "diminum Yml"
  const disiapkan = detail.match(/[Dd]isiapkan (\d+(?:\.\d+)?)ml/);
  const diminum = detail.match(/diminum (\d+(?:\.\d+)?)ml/);
  if (disiapkan && diminum) return Number(disiapkan[1]) - Number(diminum[1]);
  return 0;
}

function calcSleepHours(evts: any[], isMalam: boolean, nextDayEvts: any[] = []): number {
  const sorted = [...evts]
    .filter(e => e.type === 'tidur' || e.type === 'bangun')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  let mins = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].type !== 'tidur') continue;
    const h = parseInt(sorted[i].time?.substring(0, 2) || '0');
    const isNight = h >= 18 || h < 10;
    if (isNight !== isMalam) continue;
    const [sh, sm] = sorted[i].time.substring(0, 5).split(':').map(Number);
    const nextWakeToday = sorted.slice(i + 1).find((e: any) => e.type === 'bangun');
    if (nextWakeToday) {
      const [eh, em] = nextWakeToday.time.substring(0, 5).split(':').map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur > 0) mins += dur;
    } else if (isMalam && nextDayEvts.length > 0) {
      // Cross-day: cari bangun pertama di hari berikutnya
      const nextWake = [...nextDayEvts]
        .filter(e => e.type === 'bangun')
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
      if (nextWake) {
        const [eh, em] = nextWake.time.substring(0, 5).split(':').map(Number);
        const dur = (eh * 60 + em + 24 * 60) - (sh * 60 + sm);
        if (dur > 0 && dur < 16 * 60) mins += dur;
      }
    }
  }
  return Math.round(mins / 6) / 10;
}

function generateWhatsAppText(childName: string, date: string, events: any[], notes?: string) {
  const dayName = format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale });
  let text = `📋 Jadwal ${childName}\n${dayName}\n\n`;
  events.forEach(event => {
    const icon = event.type === 'catatan' ? getSmartIcon(event.type, event.detail, ACTIVITY_ICONS[event.type as ActivityType]) : (ACTIVITY_ICONS[event.type as ActivityType] || '📝');
    text += `${event.time?.substring(0, 5)} ${icon} ${event.detail || ACTIVITY_LABELS[event.type as ActivityType] || event.type}\n`;
  });
  const totalSusu = getTotalByType(events, 'susu');
  const totalMpasi = getTotalByType(events, 'mpasi');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  const totalMakan = getTotalByType(events, 'mpasi') + getTotalByType(events, 'snack') + getTotalByType(events, 'buah');
  text += `\n📊 Ringkasan:\n🍼 Total susu: ${totalSusu} ml\n🥣 Total Makan: ${totalMakan}\n💩 BAB: ${pup}x | 💧 BAK: ${pee}x\n`;
  if (notes) text += `\n📝 Catatan: ${notes}`;
  return text;
}

const ParentDashboard = () => {
  const { data: children = [], isLoading: loadingChildren } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { user, logout, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const deleteEvent = useDeleteEvent();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; daily_log_id: string; label: string } | null>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [detailEvent, setDetailEvent] = useState<any>(null);
  const [timelineFilter, setTimelineFilter] = useState<string | null>(null);

  const activeChildId = selectedChild || children[0]?.id || '';
  const child = children.find(c => c.id === activeChildId);

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);

  const prevDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
  const { data: prevLog } = useDailyLog(activeChildId, prevDate);
  const { data: prevEvents = [] } = useEvents(prevLog?.id);
  const { data: profileNames = {} } = useProfileNames(events.map((e: any) => e.created_by).filter(Boolean));

  // Realtime notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('parent-notifications')
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

  // Realtime: auto-refresh events when babysitter updates
  useEffect(() => {
    if (!log?.id) return;
    const channel = supabase
      .channel(`realtime-events-${log.id}`)
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

  const { data: locationPings = [] } = useQuery({
    queryKey: ['location_pings', activeChildId, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('location_pings')
        .select('id, latitude, longitude, user_id, created_at')
        .eq('child_id', activeChildId)
        .gte('created_at', selectedDate + 'T00:00:00')
        .lte('created_at', selectedDate + 'T23:59:59')
        .order('created_at');
      return data || [];
    },
    enabled: !!activeChildId,
  });

  const findClosestPing = (eventTime: string) => {
    if (!locationPings.length || !eventTime) return null;
    const eventMinutes = parseInt(eventTime.substring(0, 2)) * 60 + parseInt(eventTime.substring(3, 5));
    let closest: any = null;
    let minDiff = Infinity;
    for (const ping of locationPings) {
      const pingTime = new Date(ping.created_at);
      const pingMinutes = pingTime.getHours() * 60 + pingTime.getMinutes();
      const diff = Math.abs(pingMinutes - eventMinutes);
      if (diff < minDiff && diff <= 30) { minDiff = diff; closest = ping; }
    }
    return closest;
  };

  // 7 day chart data
  const last7dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  const { data: logsWithEvents = [] } = useChildLogs(activeChildId, last7dates);

  const chartData = last7dates.map((date, idx) => {
    const logData = logsWithEvents.find((l: any) => l.log_date === date);
    const evts = logData?.events || [];
    const nextDate = last7dates[idx + 1];
    const nextEvts = nextDate ? (logsWithEvents.find((l: any) => l.log_date === nextDate)?.events || []) : [];
    return {
      date: format(parseISO(date), 'd MMM', { locale: idLocale }),
      susu: getTotalByType(evts, 'susu'),
      makan: getTotalByType(evts, 'mpasi') + getTotalByType(evts, 'snack') + getTotalByType(evts, 'buah'),
      pup: evts.filter((e: any) => e.type === 'pup').length,
      tidurMalam: calcSleepHours(evts, true, nextEvts),
      tidurSiang: calcSleepHours(evts, false),
    };
  });

  const totalSusu = getTotalByType(events, 'susu');
  const totalMakan = getTotalByType(events, 'mpasi') + getTotalByType(events, 'snack') + getTotalByType(events, 'buah');
  const totalSnack = getTotalByType(events, 'snack');
  const totalBuah = getTotalByType(events, 'buah');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  const vitaminEvent = events.find(e => e.type === 'vitamin');
  const mandiEvents = events.filter(e => e.type === 'mandi' || e.type === 'lap_badan');

  // Trend: compare today vs yesterday
  const prevTotalSusu = getTotalByType(prevEvents as any[], 'susu');
  const prevTotalMakan = getTotalByType(prevEvents as any[], 'mpasi') + getTotalByType(prevEvents as any[], 'snack') + getTotalByType(prevEvents as any[], 'buah');
  const prevPup = (prevEvents as any[]).filter(e => e.type === 'pup').length;

  function TrendBadge({ current, previous, unit }: { current: number; previous: number; unit?: string }) {
    if (previous === 0 || current === 0) return null;
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    if (pct === 0) return null;
    return (
      <span className={`text-[10px] font-medium ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {diff > 0 ? '↑' : '↓'}{Math.abs(pct)}%
      </span>
    );
  }

  const sleepEvents = events.filter(e => e.type === 'tidur' || e.type === 'bangun');
  const prevSleepEvents = (prevEvents as any[]).filter(e => e.type === 'tidur' || e.type === 'bangun');
  // Carry over: if no sleep event today, use last from previous day (only if it was 'tidur')
  const lastSleepEvent = sleepEvents.length > 0
    ? sleepEvents[sleepEvents.length - 1]
    : prevSleepEvents.length > 0 && prevSleepEvents[prevSleepEvents.length - 1].type === 'tidur'
      ? { ...prevSleepEvents[prevSleepEvents.length - 1], _carryOver: true }
      : null;
  const isSleeping = lastSleepEvent?.type === 'tidur';
  const lastSusuEvent = [...events].filter(e => e.type === 'susu').slice(-1)[0] ?? null;
  const totalSisaSusu = events
    .filter((e: any) => e.type === 'susu' && (e.status === 'sisa' || parseSisaFromDetail(e.detail) > 0))
    .reduce((total: number, e: any) => total + parseSisaFromDetail(e.detail), 0);

  const today = format(new Date(), 'yyyy-MM-dd');
  function calcElapsed(timeStr: string): string {
    if (selectedDate !== today || !timeStr) return '';
    const [h, m] = timeStr.substring(0, 5).split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '';
    const now = new Date();
    const diffMins = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
    if (diffMins <= 0) return '';
    if (diffMins < 60) return `~${diffMins} mnt lalu`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `~${hrs}j ${mins}m lalu` : `~${hrs} jam lalu`;
  }

  // Food detail lists
  const mpasiEvents = events.filter(e => e.type === 'mpasi');
  const snackEvents = events.filter(e => e.type === 'snack');
  const buahEvents = events.filter(e => e.type === 'buah');

  const changeDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(format(dt, 'yyyy-MM-dd'));
  };

  const handleCopyWhatsApp = () => {
    if (!child) return;
    const text = generateWhatsAppText(child.name, selectedDate, events, log?.notes || undefined);
    navigator.clipboard.writeText(text);
    toast({ title: '✅ Disalin!', description: 'Format WhatsApp sudah di-copy ke clipboard' });
  };

  if (loadingChildren) return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
            <Skeleton className="h-3 w-32 mt-1 bg-primary-foreground/10" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg bg-primary-foreground/20" />
        </div>
      </div>
      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <BottomNav role="parent" />
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
            <div className="flex items-center gap-1.5">
              <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-foreground/20 font-medium">Parent</span>
            </div>
          </div>
          <div className="flex gap-1">
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/parent/input')}>
                  <PenLine className="mr-2 h-4 w-4" /> Input Harian
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/parent/children')}>
                  <Users className="mr-2 h-4 w-4" /> Kelola Anak
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/inventory')}>
                  <Package className="mr-2 h-4 w-4" /> Stok Kebutuhan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/chat')}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Pesan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/location')}>
                  <MapPin className="mr-2 h-4 w-4" /> Lokasi GPS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/insights')}>
                  <Brain className="mr-2 h-4 w-4" /> Insight Cerdas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/subscription-status')}>
                  <CreditCard className="mr-2 h-4 w-4" /> Status Langganan
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
                {children.length === 0 && (user?.roles?.length ?? 0) <= 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                      const { error } = await supabase.from('user_roles').insert({ user_id: user!.id, role: 'babysitter' });
                      if (!error) {
                        setActiveRole('babysitter');
                        window.location.href = '/babysitter/today';
                      } else {
                        toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
                      }
                    }}>
                      <UserCheck className="mr-2 h-4 w-4" /> Ganti ke Babysitter
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
            Belum ada anak terdaftar. <Button variant="link" onClick={() => navigate('/parent/children')}>Tambah anak →</Button>
          </CardContent></Card>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {child && <ChildAvatar photoUrl={(child as any).photo_url} name={child.name} emoji={child.avatar_emoji} className="h-11 w-11 rounded-xl object-cover shrink-0" fallbackClassName="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0" />}
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

            {lastSleepEvent && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isSleeping
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                <span className="text-base">{isSleeping ? <SleepingIcon size={20} /> : <ActiveSunIcon size={20} />}</span>
                <span>{isSleeping ? 'Sedang Tidur' : 'Sedang Aktif'}</span>
                <span className="text-xs opacity-60 ml-auto">
                  {(lastSleepEvent as any)?._carryOver ? 'semalam ' : 'sejak '}{lastSleepEvent.time?.substring(0, 5)}{!((lastSleepEvent as any)?._carryOver) && calcElapsed(lastSleepEvent.time || '') ? ` · ${calcElapsed(lastSleepEvent.time || '')}` : ''}
                </span>
              </div>
            )}

            {child?.dob && <DailyTrivia childName={child.name} childId={child.id} dob={child.dob} date={selectedDate} />}

            <Card
              className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md bg-gradient-to-r from-primary/5 to-accent/10"
              onClick={() => navigate('/insights')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><InsightIcon size={22} /></div>
                    <span className="text-sm font-bold text-foreground">Insight Harian {child?.name?.split(' ')[0]}</span>
                    <span className="text-xs flex items-center gap-0.5"><ChartIcon size={14} /></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-primary/60">tap baca</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(210, 65%, 55%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-susu"><SusuIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">Susu Diminum</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalSusu > 0 ? 'hsl(210, 65%, 55%)' : undefined }}>{totalSusu} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
                <TrendBadge current={totalSusu} previous={prevTotalSusu} />
                {totalSisaSusu > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 rounded-md px-1.5 py-1">
                    <span className="text-[10px]"><WasteIcon size={12} /></span>
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">sisa {totalSisaSusu}ml</span>
                    <span className="text-[10px] text-muted-foreground">· dari {totalSusu + totalSisaSusu}ml</span>
                  </div>
                )}
                {lastSusuEvent && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Terakhir {lastSusuEvent.time?.substring(0, 5)}{calcElapsed(lastSusuEvent.time || '') ? ` · ${calcElapsed(lastSusuEvent.time || '')}` : ''}
                  </p>
                )}
              </CardContent></Card>
               <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(24, 75%, 55%)' }} onClick={() => setExpandedCard(expandedCard === 'makan' ? null : 'makan')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-makan"><MpasiIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">Total Makan</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalMakan > 0 ? 'hsl(24, 75%, 55%)' : undefined }}>{totalMakan} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                <TrendBadge current={totalMakan} previous={prevTotalMakan} />
                {mpasiEvents.length > 0 && expandedCard !== 'makan' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'makan' && mpasiEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {mpasiEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1"><PlateIcon size={14} /> {e.detail || 'MPASI'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(145, 50%, 48%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-pup"><PupIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">BAB</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: pup > 0 ? 'hsl(145, 50%, 48%)' : undefined }}>{pup} <span className="text-sm font-normal text-muted-foreground">/ {pee}x</span></p>
                <TrendBadge current={pup} previous={prevPup} />
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(340, 55%, 55%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-vitamin"><VitaminIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">Vitamin</span>
                </div>
                <p className={`text-lg font-bold ${vitaminEvent ? '' : 'text-muted-foreground/60'}`} style={vitaminEvent ? { color: 'hsl(340, 55%, 55%)' } : undefined}>{vitaminEvent ? `${vitaminEvent.time?.substring(0, 5)}` : 'Belum'}</p>
              </CardContent></Card>
               <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(45, 70%, 50%)' }} onClick={() => setExpandedCard(expandedCard === 'snack' ? null : 'snack')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-snack"><SnackIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">Snack</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalSnack > 0 ? 'hsl(45, 70%, 50%)' : undefined }}>{totalSnack} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                {snackEvents.length > 0 && expandedCard !== 'snack' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'snack' && snackEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {snackEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1"><SnackIcon size={14} /> {e.detail || 'Snack'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
              </CardContent></Card>
               <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(120, 55%, 45%)' }} onClick={() => setExpandedCard(expandedCard === 'buah' ? null : 'buah')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-buah"><BuahIcon size={20} /></div>
                  <span className="text-xs text-muted-foreground">Buah</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalBuah > 0 ? 'hsl(120, 55%, 45%)' : undefined }}>{totalBuah} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                {buahEvents.length > 0 && expandedCard !== 'buah' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'buah' && buahEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {buahEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-1"><FruitSliceIcon size={14} /> {e.detail || 'Buah'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
              </CardContent></Card>
            </div>

            {mandiEvents.length > 0 && (
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-mandi"><MandiIcon size={20} /></div>
                  <span className="text-sm font-semibold">Mandi / Lap Badan</span>
                </div>
                <p className="text-sm text-muted-foreground">{mandiEvents.map(e => `${e.time?.substring(0, 5)} ${e.type === 'mandi' ? 'Mandi' : 'Lap badan'}`).join(' • ')}</p>
              </CardContent></Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 px-3 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><ChartIcon size={18} /> Grafik 7 Hari Terakhir</CardTitle>
                <p className="text-[10px] text-muted-foreground">Susu (ml) · Makan (gram) · BAB</p>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="susu" name="Susu (ml)" fill="hsl(210, 75%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="makan" name="Makan" fill="hsl(25, 85%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pup" name="BAB" fill="hsl(145, 55%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20">
              <CardHeader className="pb-1 px-3 pt-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><TidurIcon size={18} /> Pola Tidur 7 Hari</CardTitle>
                <p className="text-[10px] text-muted-foreground">Durasi dalam jam · Malam (≥18:00 atau &lt;10:00) · Siang (10:00–17:59)</p>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="j" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`${value} jam`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="tidurMalam" name="Tidur Malam" fill="hsl(245, 65%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tidurSiang" name="Tidur Siang" fill="hsl(45, 85%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-sm flex items-center gap-1.5"><TimelineIcon size={18} /> Timeline Harian</h2>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleCopyWhatsApp}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy WhatsApp
                </Button>
              </div>
              {events.length > 0 && (
                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setTimelineFilter(null)}
                    className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors', !timelineFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                  >
                    Semua
                  </button>
                  {Array.from(new Set(events.map(e => e.type))).map(type => (
                    <button
                      key={type}
                      onClick={() => setTimelineFilter(timelineFilter === type ? null : type)}
                      className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors', timelineFilter === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                    >
                      <span className="inline-flex items-center gap-1"><ActivityIcon type={type} size={14} /> {ACTIVITY_LABELS[type as ActivityType] || type}</span>
                    </button>
                  ))}
                </div>
              )}
              {events.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Belum ada data untuk tanggal ini</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {events.filter(e => !timelineFilter || e.type === timelineFilter).map(event => {
                    const ping = findClosestPing(event.time);
                    return (
                    <Card key={event.id} className="border-0 shadow-sm animate-fade-in cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailEvent(event)}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="text-center min-w-[44px]"><p className="text-xs font-bold text-muted-foreground">{event.time?.substring(0, 5)}</p></div>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                          {event.type === 'catatan' ? <ActivityIconFromEmoji emoji={getSmartIcon(event.type, event.detail, ACTIVITY_ICONS[event.type as ActivityType])} size={22} /> : <ActivityIcon type={event.type} size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type as ActivityType] || event.type}</p>
                          {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                          {(event as any).created_by && profileNames[(event as any).created_by] && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">oleh {profileNames[(event as any).created_by]}</p>
                          )}
                          {(event as any).photo_url && (
                            <img src={(event as any).photo_url} alt="Foto aktivitas" className="mt-2 rounded-lg w-24 h-24 object-cover cursor-pointer" onClick={() => window.open((event as any).photo_url, '_blank')} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                          {((event as any).latitude && (event as any).longitude) ? (
                            <a
                              href={`https://www.google.com/maps?q=${(event as any).latitude},${(event as any).longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary hover:underline"
                            >
                              <MapPin className="h-3 w-3" />
                              📍 Lihat Lokasi
                            </a>
                          ) : ping && (
                            <a
                              href={`https://www.google.com/maps?q=${ping.latitude},${ping.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary hover:underline"
                            >
                              <MapPin className="h-3 w-3" />
                              📍 Lihat Lokasi
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          {event.amount && (
                            <div className="text-right">
                              <p className="text-sm font-bold">{event.amount}</p>
                              <p className="text-xs text-muted-foreground">{event.unit}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-primary"
                              onClick={() => setEditEvent(event)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget({
                                id: event.id,
                                daily_log_id: event.daily_log_id,
                                label: `${ACTIVITY_LABELS[event.type as ActivityType] || event.type} (${event.time?.substring(0, 5)})`,
                              })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {log?.notes && (
              <Card className="border-0 shadow-sm"><CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Catatan Harian</p>
                <p className="text-sm">{log.notes}</p>
              </CardContent></Card>
            )}
          </>
        )}
      </div>

      <EventDetailDialog
        event={detailEvent}
        open={!!detailEvent}
        onOpenChange={(open) => !open && setDetailEvent(null)}
        createdByName={detailEvent?.created_by ? profileNames[detailEvent.created_by] : undefined}
      />

      {editEvent && (
        <EditEventDialog
          event={editEvent}
          open={!!editEvent}
          onOpenChange={(open) => !open && setEditEvent(null)}
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

      <BottomNav role="parent" />
    </div>
  );
};

export default ParentDashboard;
