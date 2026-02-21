import { useState, useEffect } from 'react';
import { useChildren, useDailyLog, useEvents, useChildLogs } from '@/hooks/use-data';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Copy, LogOut, ChevronLeft, ChevronRight, Users, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PendingInvites from '@/components/PendingInvites';

function getTotalByType(events: any[], type: string): number {
  return events.filter(e => e.type === type && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);
}

function generateWhatsAppText(childName: string, date: string, events: any[], notes?: string) {
  const dayName = format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale });
  let text = `📋 Jadwal ${childName}\n${dayName}\n\n`;
  events.forEach(event => {
    const icon = ACTIVITY_ICONS[event.type as ActivityType] || '📝';
    text += `${event.time?.substring(0, 5)} ${icon} ${event.detail || ACTIVITY_LABELS[event.type as ActivityType] || event.type}\n`;
  });
  const totalSusu = getTotalByType(events, 'susu');
  const totalMpasi = getTotalByType(events, 'mpasi');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  text += `\n📊 Ringkasan:\n🍼 Total susu: ${totalSusu} ml\n🥣 Total MPASI: ${totalMpasi} ml\n💩 BAB: ${pup}x | 💧 BAK: ${pee}x\n`;
  if (notes) text += `\n📝 Catatan: ${notes}`;
  return text;
}

const ParentDashboard = () => {
  const { data: children = [], isLoading: loadingChildren } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeChildId = selectedChild || children[0]?.id || '';
  const child = children.find(c => c.id === activeChildId);

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

  const { data: log } = useDailyLog(activeChildId, selectedDate);
  const { data: events = [] } = useEvents(log?.id);

  // 7 day chart data
  const last7dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  const { data: logsWithEvents = [] } = useChildLogs(activeChildId, last7dates);

  const chartData = last7dates.map(date => {
    const logData = logsWithEvents.find((l: any) => l.log_date === date);
    const evts = logData?.events || [];
    return {
      date: format(parseISO(date), 'd MMM', { locale: idLocale }),
      susu: getTotalByType(evts, 'susu'),
      mpasi: getTotalByType(evts, 'mpasi'),
      pup: evts.filter((e: any) => e.type === 'pup').length,
    };
  });

  const totalSusu = getTotalByType(events, 'susu');
  const totalMpasi = getTotalByType(events, 'mpasi');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;
  const vitaminEvent = events.find(e => e.type === 'vitamin');
  const mandiEvents = events.filter(e => e.type === 'mandi' || e.type === 'lap_badan');

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

  if (loadingChildren) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/parent/children')}>
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
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
            <Select value={activeChildId} onValueChange={setSelectedChild}>
              <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
              <SelectContent>
                {children.map(c => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>

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
                  <span className="text-xs text-muted-foreground">Total MPASI</span>
                </div>
                <p className="text-2xl font-bold">{totalMpasi} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
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
                    <Bar dataKey="mpasi" name="MPASI (ml)" fill="hsl(25, 85%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pup" name="BAB" fill="hsl(145, 55%, 45%)" radius={[4, 4, 0, 0]} />
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
                  {events.map(event => (
                    <Card key={event.id} className="border-0 shadow-sm animate-fade-in">
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className="text-center min-w-[44px]"><p className="text-xs font-bold text-muted-foreground">{event.time?.substring(0, 5)}</p></div>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                          {ACTIVITY_ICONS[event.type as ActivityType] || '📝'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type as ActivityType] || event.type}</p>
                          {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                          {(event as any).photo_url && (
                            <img src={(event as any).photo_url} alt="Foto aktivitas" className="mt-2 rounded-lg w-24 h-24 object-cover cursor-pointer" onClick={() => window.open((event as any).photo_url, '_blank')} />
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
                  ))}
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
    </div>
  );
};

export default ParentDashboard;
