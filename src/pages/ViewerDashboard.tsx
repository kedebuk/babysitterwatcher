import { useState, useEffect } from 'react';
import { useChildren, useDailyLog, useEvents, useChildLogs, useProfileNames } from '@/hooks/use-data';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MoreVertical, LogOut, RefreshCw, User, Bell, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PendingInvites from '@/components/PendingInvites';
import { BottomNav } from '@/components/BottomNav';
import { EventDetailDialog } from '@/components/EventDetailDialog';

function getTotalByType(events: any[], type: string): number {
  return events.filter(e => e.type === type && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);
}

const ViewerDashboard = () => {
  const { data: children = [], isLoading: loadingChildren } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { user, logout, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewingEvent, setViewingEvent] = useState<any>(null);

  const activeChildId = selectedChild || children[0]?.id || '';
  const child = children.find(c => c.id === activeChildId);

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

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);
  const { data: profileNames = {} } = useProfileNames(events.map((e: any) => e.created_by).filter(Boolean));

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

  if (loadingChildren) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 opacity-80" />
              <h1 className="text-lg font-bold">Keluarga</h1>
            </div>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋 (view only)</p>
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
                  <span className="text-xs text-muted-foreground">BAB / BAK</span>
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

            <div>
              <h2 className="font-bold text-sm mb-2">📋 Timeline Harian</h2>
              {events.length === 0 ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Belum ada data untuk tanggal ini</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {events.map(event => (
                    <Card key={event.id} className="border-0 shadow-sm animate-fade-in cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setViewingEvent(event)}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="text-center min-w-[44px]"><p className="text-xs font-bold text-muted-foreground">{event.time?.substring(0, 5)}</p></div>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                          {ACTIVITY_ICONS[event.type as ActivityType] || '📝'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type as ActivityType] || event.type}</p>
                          {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                          {event.amount && <p className="text-xs text-muted-foreground">{event.amount} {event.unit}{event.status ? ` — ${event.status}` : ''}</p>}
                          {event.created_by && profileNames[event.created_by] && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">oleh {profileNames[event.created_by]}</p>
                          )}
                        </div>
                        {(event.photo_url || event.photo_url_after) && (
                          <div className="flex gap-1">
                            {event.photo_url && <img src={event.photo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                            {event.photo_url_after && <img src={event.photo_url_after} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                          </div>
                        )}
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
          </>
        )}
      </div>

      <EventDetailDialog
        event={viewingEvent}
        open={!!viewingEvent}
        onOpenChange={(open) => !open && setViewingEvent(null)}
        createdByName={viewingEvent?.created_by ? profileNames[viewingEvent.created_by] : undefined}
      />
    </div>
  );
};

export default ViewerDashboard;
