import { ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS, ActivityType } from '@/types';
import { getSmartIcon } from '@/lib/smart-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';

const BabysitterHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: logs = [] } = useQuery({
    queryKey: ['babysitter_history', user?.id],
    queryFn: async () => {
      // Get assigned child ids
      const { data: assignments } = await supabase
        .from('assignments')
        .select('child_id')
        .eq('babysitter_user_id', user!.id);
      if (!assignments || assignments.length === 0) return [];

      const childIds = assignments.map(a => a.child_id);
      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*, children(name, avatar_emoji)')
        .in('child_id', childIds)
        .order('log_date', { ascending: false })
        .limit(30);

      if (!dailyLogs) return [];

      // Get events for these logs
      const logIds = dailyLogs.map(l => l.id);
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .in('daily_log_id', logIds)
        .order('time');

      return dailyLogs.map(log => ({
        ...log,
        events: (events || []).filter(e => e.daily_log_id === log.id),
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/babysitter/today')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Riwayat</h1>
            <p className="text-xs opacity-80">Log harian sebelumnya</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {logs.map((log: any) => {
          const totalSusu = log.events.filter((e: any) => e.type === 'susu' && e.amount).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
          return (
            <Card key={log.id} className="border-0 shadow-sm animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">
                      {format(parseISO(log.log_date), 'EEEE, d MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {log.children?.avatar_emoji} {log.children?.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {log.events.slice(0, 8).map((event: any) => (
                    <span key={event.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_BADGE_CLASS[event.type as ActivityType] || 'activity-badge-other'}`}>
                      {event.type === 'catatan' ? getSmartIcon(event.type, event.detail) : (ACTIVITY_ICONS[event.type as ActivityType] || '📝')} {event.time?.substring(0, 5)}
                    </span>
                  ))}
                  {log.events.length > 8 && <span className="text-xs text-muted-foreground px-2">+{log.events.length - 8} lagi</span>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>🍼 {totalSusu} ml</span>
                  <span>📋 {log.events.length} event</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">📭</p>
            <p>Belum ada riwayat</p>
          </div>
        )}
      </div>

      <BottomNav role="babysitter" />
    </div>
  );
};

export default BabysitterHistory;
