import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function getTotalByType(events: any[], type: string): number {
  return events.filter(e => e.type === type && e.amount).reduce((s, e) => s + Number(e.amount || 0), 0);
}

const AdminChildDetail = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: child } = useQuery({
    queryKey: ['admin_child', childId],
    queryFn: async () => {
      const { data } = await supabase.from('children').select('*').eq('id', childId!).single();
      return data;
    },
    enabled: !!childId,
  });

  const { data: parentProfile } = useQuery({
    queryKey: ['admin_child_parent', child?.parent_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('name, email').eq('id', child!.parent_id).single();
      return data;
    },
    enabled: !!child?.parent_id,
  });

  const { data: log } = useQuery({
    queryKey: ['admin_daily_log', childId, selectedDate],
    queryFn: async () => {
      const { data } = await supabase.from('daily_logs').select('*').eq('child_id', childId!).eq('log_date', selectedDate).maybeSingle();
      return data;
    },
    enabled: !!childId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin_events', log?.id],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('daily_log_id', log!.id).order('time');
      return data || [];
    },
    enabled: !!log?.id,
  });

  // Chart data
  const last7dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
  const { data: logsWithEvents = [] } = useQuery({
    queryKey: ['admin_child_logs_7d', childId, last7dates],
    queryFn: async () => {
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('child_id', childId!).in('log_date', last7dates);
      if (!logs || logs.length === 0) return [];
      const logIds = logs.map(l => l.id);
      const { data: evts } = await supabase.from('events').select('*').in('daily_log_id', logIds).order('time');
      return logs.map(log => ({ ...log, events: (evts || []).filter(e => e.daily_log_id === log.id) }));
    },
    enabled: !!childId,
  });

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

  const changeDate = (d: number) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(format(dt, 'yyyy-MM-dd'));
  };

  const totalSusu = getTotalByType(events, 'susu');
  const totalMpasi = getTotalByType(events, 'mpasi');
  const pup = events.filter(e => e.type === 'pup').length;
  const pee = events.filter(e => e.type === 'pee').length;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={() => navigate('/admin/children')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5" /> {child?.avatar_emoji} {child?.name || 'Loading...'}
            </h1>
            <p className="text-xs opacity-80">Parent: {parentProfile?.name || parentProfile?.email || '...'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
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
        </div>

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
          <h2 className="font-bold text-sm mb-2">📋 Timeline Harian</h2>
          {events.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Belum ada data untuk tanggal ini</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {events.map((event: any) => (
                <Card key={event.id} className="border-0 shadow-sm animate-fade-in">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="text-center min-w-[44px]"><p className="text-xs font-bold text-muted-foreground">{event.time?.substring(0, 5)}</p></div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                      {ACTIVITY_ICONS[event.type as ActivityType] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type as ActivityType] || event.type}</p>
                      {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                      {event.photo_url && (
                        <img src={event.photo_url} alt="Foto" className="mt-2 rounded-lg w-24 h-24 object-cover cursor-pointer" onClick={() => window.open(event.photo_url, '_blank')} />
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
      </div>
    </div>
  );
};

export default AdminChildDetail;
