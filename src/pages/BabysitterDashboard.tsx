import { useState, useEffect } from 'react';
import { useDailyLog, useEvents, useChildLogs, useProfileNames } from '@/hooks/use-data';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { getSmartIcon } from '@/lib/smart-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Copy, LogOut, ChevronLeft, ChevronRight, MapPin, MoreVertical, RefreshCw, Baby, User, Package, MessageCircle, History, PenLine } from 'lucide-react';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const totalMakan = getTotalByType(events, 'mpasi') + getTotalByType(events, 'snack') + getTotalByType(events, 'buah');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  text += `\n📊 Ringkasan:\n🍼 Total susu: ${totalSusu} ml\n🥣 Total Makan: ${totalMakan}\n💩 BAB: ${pup}x | 💧 BAK: ${pee}x\n`;
  if (notes) text += `\n📝 Catatan: ${notes}`;
  return text;
}

const BabysitterDashboard = () => {
  const { user, logout, setActiveRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignedChildren = [], isLoading: loadingChildren } = useQuery({
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<any>(null);

  const activeChildId = selectedChild || assignedChildren[0]?.id || '';
  const child = assignedChildren.find((c: any) => c.id === activeChildId);

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);

  const prevDate = format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
  const { data: prevLog } = useDailyLog(activeChildId, prevDate);
  const { data: prevEvents = [] } = useEvents(prevLog?.id);
  const { data: profileNames = {} } = useProfileNames(events.map((e: any) => e.created_by).filter(Boolean));

  // Realtime: auto-refresh events when data changes
  useEffect(() => {
    if (!log?.id) return;
    const channel = supabase
      .channel(`realtime-bs-events-${log.id}`)
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

  const sleepEvents = events.filter(e => e.type === 'tidur' || e.type === 'bangun');
  const prevSleepEvents = (prevEvents as any[]).filter(e => e.type === 'tidur' || e.type === 'bangun');
  const lastSleepEvent = sleepEvents.length > 0
    ? sleepEvents[sleepEvents.length - 1]
    : prevSleepEvents.length > 0 && prevSleepEvents[prevSleepEvents.length - 1].type === 'tidur'
      ? { ...prevSleepEvents[prevSleepEvents.length - 1], _carryOver: true }
      : null;
  const isSleeping = lastSleepEvent?.type === 'tidur';
  const lastSusuEvent = [...events].filter(e => e.type === 'susu').slice(-1)[0] ?? null;

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
    toast({ title: 'Disalin!', description: 'Format WhatsApp sudah di-copy ke clipboard' });
  };

  if (loadingChildren) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
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
                <DropdownMenuItem onClick={() => navigate('/babysitter/today')}>
                  <PenLine className="mr-2 h-4 w-4" /> Input Harian
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/babysitter/history')}>
                  <History className="mr-2 h-4 w-4" /> Riwayat
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
        {assignedChildren.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            Belum ada anak yang ditugaskan. Hubungi orang tua untuk penugasan.
          </CardContent></Card>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {child && (
                (child as any).photo_url ? (
                  <img src={(child as any).photo_url} alt={child.name} loading="lazy" decoding="async" width={44} height={44} className="h-11 w-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">{child.avatar_emoji || '👶'}</div>
                )
              )}
              <Select value={activeChildId} onValueChange={setSelectedChild}>
                <SelectTrigger className="h-11 bg-card flex-1"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                <SelectContent>
                  {assignedChildren.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>)}
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
                <span className="text-base">{isSleeping ? '😴' : '🌞'}</span>
                <span>{isSleeping ? 'Sedang Tidur' : 'Sedang Aktif'}</span>
                <span className="text-xs opacity-60 ml-auto">
                  {(lastSleepEvent as any)?._carryOver ? 'semalam ' : 'sejak '}{lastSleepEvent.time?.substring(0, 5)}{!((lastSleepEvent as any)?._carryOver) && calcElapsed(lastSleepEvent.time || '') ? ` · ${calcElapsed(lastSleepEvent.time || '')}` : ''}
                </span>
              </div>
            )}

            {child?.dob && <DailyTrivia childName={child.name} childId={child.id} dob={child.dob} date={selectedDate} />}

            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(210, 65%, 55%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-susu text-sm">🍼</div>
                  <span className="text-xs text-muted-foreground">Total Susu</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalSusu > 0 ? 'hsl(210, 65%, 55%)' : undefined }}>{totalSusu} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
                {lastSusuEvent && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Terakhir {lastSusuEvent.time?.substring(0, 5)}{calcElapsed(lastSusuEvent.time || '') ? ` · ${calcElapsed(lastSusuEvent.time || '')}` : ''}
                  </p>
                )}
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(24, 75%, 55%)' }} onClick={() => setExpandedCard(expandedCard === 'makan' ? null : 'makan')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-makan text-sm">🥣</div>
                  <span className="text-xs text-muted-foreground">Total Makan</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalMakan > 0 ? 'hsl(24, 75%, 55%)' : undefined }}>{totalMakan} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                {mpasiEvents.length > 0 && expandedCard !== 'makan' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'makan' && mpasiEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {mpasiEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground">🍽️ {e.detail || 'MPASI'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(145, 50%, 48%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-pup text-sm">💩</div>
                  <span className="text-xs text-muted-foreground">BAB</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: pup > 0 ? 'hsl(145, 50%, 48%)' : undefined }}>{pup} <span className="text-sm font-normal text-muted-foreground">/ {pee}x</span></p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px]" style={{ borderLeftColor: 'hsl(340, 55%, 55%)' }}><CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-vitamin text-sm">💊</div>
                  <span className="text-xs text-muted-foreground">Vitamin</span>
                </div>
                <p className={`text-lg font-bold ${vitaminEvent ? '' : 'text-muted-foreground/60'}`} style={vitaminEvent ? { color: 'hsl(340, 55%, 55%)' } : undefined}>{vitaminEvent ? `${vitaminEvent.time?.substring(0, 5)}` : 'Belum'}</p>
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(45, 70%, 50%)' }} onClick={() => setExpandedCard(expandedCard === 'snack' ? null : 'snack')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-snack text-sm">🍪</div>
                  <span className="text-xs text-muted-foreground">Snack</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalSnack > 0 ? 'hsl(45, 70%, 50%)' : undefined }}>{totalSnack} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                {snackEvents.length > 0 && expandedCard !== 'snack' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'snack' && snackEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {snackEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground">🍪 {e.detail || 'Snack'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
              </CardContent></Card>
              <Card className="border-0 shadow-sm border-l-[3px] cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: 'hsl(120, 55%, 45%)' }} onClick={() => setExpandedCard(expandedCard === 'buah' ? null : 'buah')}>
                <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-buah text-sm">🍎</div>
                  <span className="text-xs text-muted-foreground">Buah</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalBuah > 0 ? 'hsl(120, 55%, 45%)' : undefined }}>{totalBuah} <span className="text-sm font-normal text-muted-foreground">gram</span></p>
                {buahEvents.length > 0 && expandedCard !== 'buah' && (
                  <p className="text-[10px] text-primary/60 mt-1">tap untuk rincian ▾</p>
                )}
                {expandedCard === 'buah' && buahEvents.length > 0 && (
                  <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {buahEvents.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground">🍉 {e.detail || 'Buah'}{e.amount ? ` — ${e.amount}${e.unit || 'g'}` : ''}</p>
                    ))}
                    <p className="text-[10px] text-primary/60 mt-1">tap untuk tutup ▴</p>
                  </div>
                )}
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
              <CardHeader className="pb-1 px-3 pt-3">
                <CardTitle className="text-sm font-semibold">📈 Grafik 7 Hari Terakhir</CardTitle>
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
                <CardTitle className="text-sm font-semibold">😴 Pola Tidur 7 Hari</CardTitle>
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
                <h2 className="font-bold text-sm">📋 Timeline Harian</h2>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleCopyWhatsApp}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy WhatsApp
                </Button>
              </div>
              {events.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Belum ada data untuk tanggal ini</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {events.map(event => {
                    const ping = findClosestPing(event.time);
                    return (
                    <Card key={event.id} className="border-0 shadow-sm animate-fade-in cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailEvent(event)}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="text-center min-w-[44px]"><p className="text-xs font-bold text-muted-foreground">{event.time?.substring(0, 5)}</p></div>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                          {event.type === 'catatan' ? getSmartIcon(event.type, event.detail, ACTIVITY_ICONS[event.type as ActivityType]) : (ACTIVITY_ICONS[event.type as ActivityType] || '📝')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type as ActivityType] || event.type}</p>
                          {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                          {(event as any).created_by && profileNames[(event as any).created_by] && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">oleh {profileNames[(event as any).created_by]}</p>
                          )}
                          {(event as any).photo_url && (
                            <img src={(event as any).photo_url} alt="Foto aktivitas" className="mt-2 rounded-lg w-24 h-24 object-cover cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open((event as any).photo_url, '_blank'); }} />
                          )}
                          {((event as any).latitude && (event as any).longitude) ? (
                            <a
                              href={`https://www.google.com/maps?q=${(event as any).latitude},${(event as any).longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapPin className="h-3 w-3" />
                              📍 Lihat Lokasi
                            </a>
                          )}
                        </div>
                        {event.amount && (
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{event.amount}</p>
                            <p className="text-xs text-muted-foreground">{event.unit}</p>
                          </div>
                        )}
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

      <BottomNav role="babysitter" />
    </div>
  );
};

export default BabysitterDashboard;
